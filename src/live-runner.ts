import { appendFile, mkdir, readFile } from "node:fs/promises";
import { TASKS, REASONING_LEVELS, directDeepSeekThinkingRequest, isCorrect, type BenchmarkTask, type ReasoningEffort } from "./experiment.js";

const args = new Set(process.argv.slice(2));
const mode = args.has("--live") ? "live" : "plan";
const provider = process.argv.find((arg) => arg.startsWith("--provider="))?.split("=")[1] ?? "openrouter";
const limitFlag = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = limitFlag ? Number(limitFlag.split("=")[1]) : undefined;
const matrix = TASKS.flatMap((task) => REASONING_LEVELS.map((effort) => ({ task, effort })));

if (mode === "plan") {
  console.log(JSON.stringify({ tasks: TASKS.length, categories: new Set(TASKS.map((task) => task.category)).size, reasoningLevels: REASONING_LEVELS, requests: matrix.length, note: "True 1-100 calibration requires --provider=deepseek and DEEPSEEK_API_KEY. OpenRouter accepts only named gateway efforts, not numeric values." }, null, 2));
  process.exit(0);
}

if (!limit || !Number.isInteger(limit) || limit < 1 || limit > matrix.length) {
  throw new Error(`Live runs require --limit=1..${matrix.length} to cap spend.`);
}

if (provider !== "deepseek") throw new Error("OpenRouter rejects numeric reasoning effort. Use --provider=deepseek with DEEPSEEK_API_KEY for the 9-level numeric calibration.");
process.loadEnvFile(".env");
const apiKey = process.env.DEEPSEEK_API_KEY;
const model = process.env.DEEPSEEK_MODEL;
if (!apiKey || !model) throw new Error("DEEPSEEK_API_KEY and DEEPSEEK_MODEL are required in .env for direct numeric calibration.");
await mkdir("results", { recursive: true });
const outputPath = "results/deepseek-v4.1-flash.jsonl";
const completed = new Set((await readFile(outputPath, "utf8").catch(() => "")).split("\n").filter(Boolean).map((line) => {
  const record = JSON.parse(line) as { taskId: string; effort: number };
  return `${record.taskId}:${record.effort}`;
}));

async function run(task: BenchmarkTask, effort: ReasoningEffort) {
  const startedAt = new Date().toISOString();
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: [{ role: "user", content: task.prompt }], max_tokens: 200, ...directDeepSeekThinkingRequest(effort) }),
  });
  if (!response.ok) throw new Error(`${task.id}@${effort}: provider returned ${response.status}`);
  const body = await response.json() as { choices?: Array<{ message?: { content?: string } }>; usage?: unknown };
  const answer = body.choices?.[0]?.message?.content ?? "";
  return { startedAt, model, taskId: task.id, category: task.category, effort, success: isCorrect(task, answer), usage: body.usage, response: answer };
}

for (const { task, effort } of matrix.filter(({ task, effort }) => !completed.has(`${task.id}:${effort}`)).slice(0, limit)) {
  const result = await run(task, effort);
  await appendFile(outputPath, `${JSON.stringify(result)}\n`);
  console.log(`${result.taskId} effort=${effort} success=${result.success}`);
}
