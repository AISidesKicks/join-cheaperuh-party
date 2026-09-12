import { appendFile, mkdir, readFile } from "node:fs/promises";
import { ATTEMPTS_PER_CHOICE, DEMO_TASKS, SUPERVISOR_CHOICES, SUPPORTED_EFFORTS, isCorrect, reasoningRequest, type BenchmarkTask, type ReasoningEffort } from "./experiment.js";

const args = new Set(process.argv.slice(2));
const live = args.has("--live");
const strategy = process.argv.find((arg) => arg.startsWith("--strategy="))?.split("=")[1] ?? "supervisor";
const runId = process.argv.find((arg) => arg.startsWith("--run="))?.split("=")[1] ?? "v1";
const limit = Number(process.argv.find((arg) => arg.startsWith("--limit="))?.split("=")[1] ?? 0);
const groups = DEMO_TASKS.flatMap((task) => Array.from({ length: SUPERVISOR_CHOICES }, (_, choice) => ({ task, choice: choice + 1 })));

if (!live) {
  console.log(JSON.stringify({ runId, candidateTasks: 33, selectedDemoTasks: DEMO_TASKS.length, categories: new Set(DEMO_TASKS.map((task) => task.category)).size, supervisorChoicesPerTask: SUPERVISOR_CHOICES, attemptsPerChoice: ATTEMPTS_PER_CHOICE, taskRequests: groups.length * ATTEMPTS_PER_CHOICE, supervisorRequests: strategy === "supervisor" ? groups.length : 0, selectableEfforts: SUPPORTED_EFFORTS, strategies: ["supervisor", "none", "high"], note: "The supervisor defaults to none and escalates only for stated evidence. Baselines bypass the supervisor." }, null, 2));
  process.exit(0);
}
if (!Number.isInteger(limit) || limit < 1 || limit > groups.length) throw new Error(`Live runs require --limit=1..${groups.length}; one unit is a supervisor choice plus three task attempts.`);
if (strategy !== "supervisor" && strategy !== "none" && strategy !== "high") throw new Error("Strategy must be supervisor, none, or high.");

process.loadEnvFile(".env");
const apiKey = process.env.OPENROUTER_API_KEY;
const model = process.env.OPENROUTER_MODEL ?? "deepseek/deepseek-v4.1-flash";
if (!apiKey) throw new Error("OPENROUTER_API_KEY is required in .env");
const outputPath = `results/openrouter-${strategy}-${runId}.jsonl`;
const decisionsPath = `results/openrouter-${strategy}-${runId}-decisions.jsonl`;
await mkdir("results", { recursive: true });
const existingRecords = (await readFile(outputPath, "utf8").catch(() => "")).split("\n").filter(Boolean).map((line) => JSON.parse(line) as { taskId: string; choice: number; attempt: number; effort: ReasoningEffort });
const existingDecisions = (await readFile(decisionsPath, "utf8").catch(() => "")).split("\n").filter(Boolean).map((line) => JSON.parse(line) as { taskId: string; choice: number; effort: ReasoningEffort; rationale: string });
const recordsFor = (taskId: string, choice: number) => existingRecords.filter((record) => record.taskId === taskId && record.choice === choice);
const decisionFor = (taskId: string, choice: number) => existingDecisions.find((decision) => decision.taskId === taskId && decision.choice === choice);
const completed = new Set(groups.filter(({ task, choice }) => recordsFor(task.id, choice).length >= ATTEMPTS_PER_CHOICE).map(({ task, choice }) => `${task.id}:${choice}`));

async function complete(messages: Array<{ role: "system" | "user"; content: string }>, effort: ReasoningEffort) {
  let lastStatus = "network failure";
  for (let retry = 0; retry < 4; retry += 1) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "X-Title": "Cheaperuh reasoning router" }, body: JSON.stringify({ model, messages, temperature: 0, max_tokens: 200, reasoning: reasoningRequest(effort) }) });
      if (response.ok) {
        const body = await response.json() as { choices?: Array<{ message?: { content?: string } }>; usage?: unknown };
        return { content: body.choices?.[0]?.message?.content ?? "", usage: body.usage };
      }
      lastStatus = `HTTP ${response.status}`;
      if (response.status < 429 || response.status >= 500) throw new Error(lastStatus);
    } catch (error) {
      lastStatus = error instanceof Error ? error.message : "unknown error";
    }
    await new Promise((resolve) => setTimeout(resolve, 750 * (retry + 1)));
  }
  throw new Error(`OpenRouter request failed after four attempts: ${lastStatus}`);
}

async function chooseEffort(task: BenchmarkTask) {
  const supervisor = await complete([{ role: "system", content: `You are a cost-conscious reasoning supervisor. You see only a vague task brief, never the hidden prompt or answer. Choose the lowest effort that is justified by evidence in the brief.

Mandatory restraint rule: choose none for a literal extraction, deterministic formatting request, or isolated one-line repair unless the brief explicitly states ambiguity, multiple dependent steps, state changes, or a diagnosis problem. Do not choose minimal merely as a safety gesture.

Escalation evidence: choose low or medium only for an explicit calculation, nested rule, or short dependency chain. Choose high, xhigh, or max only for stated sequential state, larger dependency graphs, ambiguity, diagnosis, or test design. Never infer hidden complexity.

Select exactly one effort from: ${SUPPORTED_EFFORTS.join(", ")}. Reply in exactly two lines: EFFORT: <value> and REASON: <five words or fewer>.` }, { role: "user", content: task.brief }], "none");
  const effortMatch = supervisor.content.match(/EFFORT:\s*(none|minimal|low|medium|high|xhigh|max)/i);
  const reasonMatch = supervisor.content.match(/REASON:\s*(.+)/i);
  const selected = effortMatch?.[1].toLowerCase() as ReasoningEffort | undefined;
  if (!selected || !SUPPORTED_EFFORTS.includes(selected)) throw new Error("Supervisor returned an unsupported effort.");
  return { effort: selected, rationale: reasonMatch?.[1].trim() ?? "No rationale returned.", usage: supervisor.usage };
}

const pendingGroups = groups.filter(({ task, choice }) => !completed.has(`${task.id}:${choice}`)).slice(0, limit);

async function runGroup({ task, choice }: { task: BenchmarkTask; choice: number }) {
  const previous = recordsFor(task.id, choice);
  const recordedDecision = decisionFor(task.id, choice);
  const decision = recordedDecision ?? (previous[0] ? { effort: previous[0].effort, rationale: "Resumed existing group." } : strategy === "supervisor" ? await chooseEffort(task) : { effort: strategy as ReasoningEffort, rationale: `Always-${strategy} baseline.` });
  const effort = decision.effort;
  const pendingAttempts = Array.from({ length: ATTEMPTS_PER_CHOICE }, (_, index) => index + 1).filter((attempt) => !previous.some((record) => record.attempt === attempt));
  const completedAttempts = await Promise.all(pendingAttempts.map(async (attempt) => {
    const result = await complete([{ role: "user", content: task.prompt }], effort);
    return { taskId: task.id, category: task.category, choice, attempt, effort, success: isCorrect(task, result.content), usage: result.usage, model, response: result.content, startedAt: new Date().toISOString() };
  }));
  return { task, choice, effort, decision, recordedDecision, completedAttempts };
}

const GROUP_CONCURRENCY = strategy === "supervisor" ? 3 : 6;
for (let start = 0; start < pendingGroups.length; start += GROUP_CONCURRENCY) {
  const settled = await Promise.allSettled(pendingGroups.slice(start, start + GROUP_CONCURRENCY).map(runGroup));
  for (const outcome of settled) {
    if (outcome.status === "rejected") {
      console.error(`Group failed and can be resumed: ${outcome.reason instanceof Error ? outcome.reason.message : "unknown error"}`);
      continue;
    }
    const group = outcome.value;
    if (!group.recordedDecision) await appendFile(decisionsPath, `${JSON.stringify({ taskId: group.task.id, category: group.task.category, choice: group.choice, effort: group.effort, rationale: group.decision.rationale, usage: "usage" in group.decision ? group.decision.usage : undefined, model, startedAt: new Date().toISOString() })}\n`);
    for (const result of group.completedAttempts) await appendFile(outputPath, `${JSON.stringify(result)}\n`);
    console.log(`${group.task.id} choice=${group.choice} effort=${group.effort} attempts=${ATTEMPTS_PER_CHOICE}`);
  }
}
