import { appendFile, mkdir, readFile } from "node:fs/promises";
import { ATTEMPTS_PER_CHOICE, DEMO_TASKS, SUPERVISOR_CHOICES, SUPPORTED_EFFORTS, isCorrect, reasoningRequest, type BenchmarkTask, type ReasoningEffort } from "./experiment.js";

const args = new Set(process.argv.slice(2));
const live = args.has("--live");
const limit = Number(process.argv.find((arg) => arg.startsWith("--limit="))?.split("=")[1] ?? 0);
const groups = DEMO_TASKS.flatMap((task) => Array.from({ length: SUPERVISOR_CHOICES }, (_, choice) => ({ task, choice: choice + 1 })));

if (!live) {
  console.log(JSON.stringify({ candidateTasks: 33, selectedDemoTasks: DEMO_TASKS.length, categories: new Set(DEMO_TASKS.map((task) => task.category)).size, supervisorChoicesPerTask: SUPERVISOR_CHOICES, attemptsPerChoice: ATTEMPTS_PER_CHOICE, taskRequests: groups.length * ATTEMPTS_PER_CHOICE, supervisorRequests: groups.length, selectableEfforts: SUPPORTED_EFFORTS, note: "The supervisor sees only a vague brief, chooses any supported effort including none, then the task runs three times at that choice." }, null, 2));
  process.exit(0);
}
if (!Number.isInteger(limit) || limit < 1 || limit > groups.length) throw new Error(`Live runs require --limit=1..${groups.length}; one unit is a supervisor choice plus three task attempts.`);

process.loadEnvFile(".env");
const apiKey = process.env.OPENROUTER_API_KEY;
const model = process.env.OPENROUTER_MODEL ?? "deepseek/deepseek-v4.1-flash";
if (!apiKey) throw new Error("OPENROUTER_API_KEY is required in .env");
const outputPath = "results/openrouter-supervisor-demo.jsonl";
await mkdir("results", { recursive: true });
const completed = new Set((await readFile(outputPath, "utf8").catch(() => "")).split("\n").filter(Boolean).map((line) => {
  const record = JSON.parse(line) as { taskId: string; choice: number };
  return `${record.taskId}:${record.choice}`;
}));

async function complete(messages: Array<{ role: "system" | "user"; content: string }>, effort: ReasoningEffort) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "X-Title": "Cheaperuh reasoning router" }, body: JSON.stringify({ model, messages, temperature: 0, max_tokens: 200, reasoning: reasoningRequest(effort) }) });
  if (!response.ok) throw new Error(`OpenRouter returned ${response.status}`);
  const body = await response.json() as { choices?: Array<{ message?: { content?: string } }>; usage?: unknown };
  return { content: body.choices?.[0]?.message?.content ?? "", usage: body.usage };
}

async function chooseEffort(task: BenchmarkTask): Promise<ReasoningEffort> {
  const supervisor = await complete([{ role: "system", content: `You are a cost-conscious reasoning supervisor. You see only a vague task brief. Select exactly one effort from: ${SUPPORTED_EFFORTS.join(", ")}. Prefer the least effort likely to complete the task. Reply with only that effort word.` }, { role: "user", content: task.brief }], "none");
  const selected = supervisor.content.trim().toLowerCase() as ReasoningEffort;
  if (!SUPPORTED_EFFORTS.includes(selected)) throw new Error(`Supervisor returned an unsupported effort.`);
  return selected;
}

for (const { task, choice } of groups.filter(({ task, choice }) => !completed.has(`${task.id}:${choice}`)).slice(0, limit)) {
  const effort = await chooseEffort(task);
  for (let attempt = 1; attempt <= ATTEMPTS_PER_CHOICE; attempt += 1) {
    const result = await complete([{ role: "user", content: task.prompt }], effort);
    await appendFile(outputPath, `${JSON.stringify({ taskId: task.id, category: task.category, choice, attempt, effort, success: isCorrect(task, result.content), usage: result.usage, model, response: result.content, startedAt: new Date().toISOString() })}\n`);
  }
  console.log(`${task.id} choice=${choice} effort=${effort} attempts=${ATTEMPTS_PER_CHOICE}`);
}
