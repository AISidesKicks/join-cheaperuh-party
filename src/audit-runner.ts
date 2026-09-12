import { appendFile, mkdir, readFile } from "node:fs/promises";
import { DEMO_TASKS, SUPPORTED_EFFORTS, isCorrect, reasoningRequest, type BenchmarkTask, type ReasoningEffort } from "./experiment.js";

const args = new Set(process.argv.slice(2));
const live = args.has("--live");
const runId = process.argv.find((arg) => arg.startsWith("--run="))?.split("=")[1] ?? "effort-audit-v1";
const limit = Number(process.argv.find((arg) => arg.startsWith("--limit="))?.split("=")[1] ?? 0);
const groups = DEMO_TASKS.flatMap((task) => SUPPORTED_EFFORTS.map((effort) => ({ task, effort })));

if (!live) {
  console.log(JSON.stringify({ runId, tasks: DEMO_TASKS.length, efforts: SUPPORTED_EFFORTS, attemptsPerEffort: 3, workerRequests: groups.length * 3 }, null, 2));
  process.exit(0);
}
if (!Number.isInteger(limit) || limit < 1 || limit > groups.length) throw new Error(`Audit runs require --limit=1..${groups.length}.`);

process.loadEnvFile(".env");
const apiKey = process.env.OPENROUTER_API_KEY;
const model = process.env.OPENROUTER_MODEL ?? "deepseek/deepseek-v4.1-flash";
if (!apiKey) throw new Error("OPENROUTER_API_KEY is required in .env");
const outputPath = `results/openrouter-effort-audit-${runId}.jsonl`;
await mkdir("results", { recursive: true });
const existing = (await readFile(outputPath, "utf8").catch(() => "")).split("\n").filter(Boolean).map((line) => JSON.parse(line) as { taskId: string; effort: ReasoningEffort; attempt: number });
const recordsFor = (taskId: string, effort: ReasoningEffort) => existing.filter((record) => record.taskId === taskId && record.effort === effort);
const pending = groups.filter(({ task, effort }) => recordsFor(task.id, effort).length < 3).slice(0, limit);

async function complete(task: BenchmarkTask, effort: ReasoningEffort) {
  let lastStatus = "network failure";
  for (let retry = 0; retry < 4; retry += 1) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "X-Title": "Cheaperuh effort audit" }, body: JSON.stringify({ model, messages: [{ role: "user", content: task.prompt }], temperature: 0, max_tokens: 200, reasoning: reasoningRequest(effort) }) });
      if (response.ok) {
        const body = await response.json() as { choices?: Array<{ message?: { content?: string } }>; usage?: unknown };
        return { content: body.choices?.[0]?.message?.content ?? "", usage: body.usage };
      }
      lastStatus = `HTTP ${response.status}`;
    } catch (error) { lastStatus = error instanceof Error ? error.message : "unknown error"; }
    await new Promise((resolve) => setTimeout(resolve, 750 * (retry + 1)));
  }
  throw new Error(`OpenRouter request failed after four attempts: ${lastStatus}`);
}

async function runGroup({ task, effort }: { task: BenchmarkTask; effort: ReasoningEffort }) {
  const previous = recordsFor(task.id, effort);
  const attempts = [1, 2, 3].filter((attempt) => !previous.some((record) => record.attempt === attempt));
  const results = await Promise.all(attempts.map(async (attempt) => {
    const result = await complete(task, effort);
    return { taskId: task.id, category: task.category, effort, attempt, success: isCorrect(task, result.content), usage: result.usage, model, response: result.content, startedAt: new Date().toISOString() };
  }));
  return { task, effort, results };
}

const AUDIT_CONCURRENCY = 16;
for (let start = 0; start < pending.length; start += AUDIT_CONCURRENCY) {
  const batch = await Promise.allSettled(pending.slice(start, start + AUDIT_CONCURRENCY).map(runGroup));
  for (const outcome of batch) {
    if (outcome.status === "rejected") { console.error(`Audit group failed and can be resumed: ${outcome.reason instanceof Error ? outcome.reason.message : "unknown error"}`); continue; }
    for (const result of outcome.value.results) await appendFile(outputPath, `${JSON.stringify(result)}\n`);
    console.log(`${outcome.value.task.id} effort=${outcome.value.effort} attempts=3`);
  }
}
