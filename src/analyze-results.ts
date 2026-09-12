import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { ATTEMPTS_PER_CHOICE, DEMO_TASKS, SUPERVISOR_CHOICES, type ReasoningEffort } from "./experiment.js";

export interface RunRecord { taskId: string; category: string; choice: number; attempt: number; effort: ReasoningEffort; success: boolean; usage?: { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number } }
const tokens = (record: RunRecord) => record.usage?.total_tokens ?? (record.usage?.prompt_tokens ?? 0) + (record.usage?.completion_tokens ?? 0);
const mean = (numbers: number[]) => numbers.reduce((sum, value) => sum + value, 0) / numbers.length;

export function taskMetrics(records: RunRecord[]) {
  if (records.length !== SUPERVISOR_CHOICES * ATTEMPTS_PER_CHOICE) throw new Error("A task requires three supervisor choices with three attempts each.");
  for (let choice = 1; choice <= SUPERVISOR_CHOICES; choice += 1) if (records.filter((record) => record.choice === choice).length !== ATTEMPTS_PER_CHOICE) throw new Error(`Choice ${choice} is incomplete.`);
  return { successRate: records.filter((record) => record.success).length / records.length, meanTokens: mean(records.map(tokens)), selectedEfforts: Array.from({ length: SUPERVISOR_CHOICES }, (_, index) => records.find((record) => record.choice === index + 1)?.effort), zeroReasoningSelections: records.filter((record) => record.effort === "none").length / records.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const path = process.argv[2] ?? "results/openrouter-supervisor-demo.jsonl";
  const records = (await readFile(path, "utf8")).trim().split("\n").filter(Boolean).map((line) => JSON.parse(line) as RunRecord);
  console.log(JSON.stringify({ tasks: DEMO_TASKS.map((task) => ({ taskId: task.id, category: task.category, ...taskMetrics(records.filter((record) => record.taskId === task.id)) })) }, null, 2));
}
