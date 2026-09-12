import { appendFile, mkdir, readFile } from "node:fs/promises";
import { ATTEMPTS_PER_CHOICE, DEMO_TASKS, SUPERVISOR_CHOICES, SUPPORTED_EFFORTS, isCorrect, reasoningRequest, type BenchmarkTask, type ReasoningEffort } from "./experiment.js";

const args = new Set(process.argv.slice(2));
const live = args.has("--live");
const strategy = process.argv.find((arg) => arg.startsWith("--strategy="))?.split("=")[1] ?? "supervisor";
const limit = Number(process.argv.find((arg) => arg.startsWith("--limit="))?.split("=")[1] ?? 0);
const groups = DEMO_TASKS.flatMap((task) => Array.from({ length: SUPERVISOR_CHOICES }, (_, choice) => ({ task, choice: choice + 1 })));

if (!live) {
  console.log(JSON.stringify({ candidateTasks: 33, selectedDemoTasks: DEMO_TASKS.length, categories: new Set(DEMO_TASKS.map((task) => task.category)).size, supervisorChoicesPerTask: SUPERVISOR_CHOICES, attemptsPerChoice: ATTEMPTS_PER_CHOICE, taskRequests: groups.length * ATTEMPTS_PER_CHOICE, supervisorRequests: strategy === "supervisor" ? groups.length : 0, selectableEfforts: SUPPORTED_EFFORTS, strategies: ["supervisor", "none", "high"], note: "The supervisor defaults to none and escalates only for stated evidence. Baselines bypass the supervisor." }, null, 2));
  process.exit(0);
}
if (!Number.isInteger(limit) || limit < 1 || limit > groups.length) throw new Error(`Live runs require --limit=1..${groups.length}; one unit is a supervisor choice plus three task attempts.`);
if (strategy !== "supervisor" && strategy !== "none" && strategy !== "high") throw new Error("Strategy must be supervisor, none, or high.");

process.loadEnvFile(".env");
const apiKey = process.env.OPENROUTER_API_KEY;
const model = process.env.OPENROUTER_MODEL ?? "deepseek/deepseek-v4.1-flash";
if (!apiKey) throw new Error("OPENROUTER_API_KEY is required in .env");
const outputPath = `results/openrouter-${strategy}-demo.jsonl`;
const decisionsPath = `results/openrouter-${strategy}-demo-decisions.jsonl`;
await mkdir("results", { recursive: true });
const existingRecords = (await readFile(outputPath, "utf8").catch(() => "")).split("\n").filter(Boolean).map((line) => JSON.parse(line) as { taskId: string; choice: number; attempt: number; effort: ReasoningEffort });
const recordsFor = (taskId: string, choice: number) => existingRecords.filter((record) => record.taskId === taskId && record.choice === choice);
const completed = new Set(groups.filter(({ task, choice }) => recordsFor(task.id, choice).length >= ATTEMPTS_PER_CHOICE).map(({ task, choice }) => `${task.id}:${choice}`));

async function complete(messages: Array<{ role: "system" | "user"; content: string }>, effort: ReasoningEffort) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "X-Title": "Cheaperuh reasoning router" }, body: JSON.stringify({ model, messages, temperature: 0, max_tokens: 200, reasoning: reasoningRequest(effort) }) });
  if (!response.ok) throw new Error(`OpenRouter returned ${response.status}`);
  const body = await response.json() as { choices?: Array<{ message?: { content?: string } }>; usage?: unknown };
  return { content: body.choices?.[0]?.message?.content ?? "", usage: body.usage };
}

async function chooseEffort(task: BenchmarkTask) {
  const supervisor = await complete([{ role: "system", content: `You are a cost-conscious reasoning supervisor. You see only a vague task brief. Default to none. Escalate only when the brief gives evidence of multi-step state, ambiguity, dependency chains, debugging, or test design. Select exactly one effort from: ${SUPPORTED_EFFORTS.join(", ")}. Reply in exactly two lines: EFFORT: <value> and REASON: <five words or fewer>.` }, { role: "user", content: task.brief }], "none");
  const effortMatch = supervisor.content.match(/EFFORT:\s*(none|minimal|low|medium|high|xhigh|max)/i);
  const reasonMatch = supervisor.content.match(/REASON:\s*(.+)/i);
  const selected = effortMatch?.[1].toLowerCase() as ReasoningEffort | undefined;
  if (!selected || !SUPPORTED_EFFORTS.includes(selected)) throw new Error("Supervisor returned an unsupported effort.");
  return { effort: selected, rationale: reasonMatch?.[1].trim() ?? "No rationale returned.", usage: supervisor.usage };
}

for (const { task, choice } of groups.filter(({ task, choice }) => !completed.has(`${task.id}:${choice}`)).slice(0, limit)) {
  const previous = recordsFor(task.id, choice);
  const decision = previous[0] ? { effort: previous[0].effort, rationale: "Resumed existing group." } : strategy === "supervisor" ? await chooseEffort(task) : { effort: strategy as ReasoningEffort, rationale: `Always-${strategy} baseline.` };
  const effort = decision.effort;
  await appendFile(decisionsPath, `${JSON.stringify({ taskId: task.id, category: task.category, choice, effort, rationale: decision.rationale, usage: "usage" in decision ? decision.usage : undefined, model, startedAt: new Date().toISOString() })}\n`);
  const pendingAttempts = Array.from({ length: ATTEMPTS_PER_CHOICE }, (_, index) => index + 1).filter((attempt) => !previous.some((record) => record.attempt === attempt));
  const completedAttempts = await Promise.all(pendingAttempts.map(async (attempt) => {
    const result = await complete([{ role: "user", content: task.prompt }], effort);
    return { taskId: task.id, category: task.category, choice, attempt, effort, success: isCorrect(task, result.content), usage: result.usage, model, response: result.content, startedAt: new Date().toISOString() };
  }));
  for (const result of completedAttempts) await appendFile(outputPath, `${JSON.stringify(result)}\n`);
  console.log(`${task.id} choice=${choice} effort=${effort} attempts=${ATTEMPTS_PER_CHOICE}`);
}
