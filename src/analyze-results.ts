import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { ATTEMPTS_PER_CHOICE, DEMO_TASKS, SUPERVISOR_CHOICES, isCorrect, type ReasoningEffort } from "./experiment.js";

export interface Usage { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number; cost?: number }
export interface RunRecord { taskId: string; category: string; choice: number; attempt: number; effort: ReasoningEffort; success: boolean; response?: string; usage?: Usage }
export interface SupervisorDecision { taskId: string; category: string; choice: number; effort: ReasoningEffort; rationale?: string; usage?: Usage }
const tokens = (record: { usage?: Usage }) => record.usage?.total_tokens ?? (record.usage?.prompt_tokens ?? 0) + (record.usage?.completion_tokens ?? 0);
const cost = (record: { usage?: Usage }) => record.usage?.cost ?? 0;
const mean = (numbers: number[]) => numbers.reduce((sum, value) => sum + value, 0) / numbers.length;

export function taskMetrics(records: RunRecord[]) {
  if (records.length !== SUPERVISOR_CHOICES * ATTEMPTS_PER_CHOICE) throw new Error("A task requires three supervisor choices with three attempts each.");
  for (let choice = 1; choice <= SUPERVISOR_CHOICES; choice += 1) if (records.filter((record) => record.choice === choice).length !== ATTEMPTS_PER_CHOICE) throw new Error(`Choice ${choice} is incomplete.`);
  return { successRate: records.filter((record) => record.success).length / records.length, meanTokens: mean(records.map(tokens)), totalTokens: records.map(tokens).reduce((sum, value) => sum + value, 0), totalCost: records.map(cost).reduce((sum, value) => sum + value, 0), selectedEfforts: Array.from({ length: SUPERVISOR_CHOICES }, (_, index) => records.find((record) => record.choice === index + 1)?.effort), zeroReasoningSelections: records.filter((record) => record.effort === "none").length / records.length };
}

export function canonicalWorkerRecords(records: RunRecord[]): RunRecord[] {
  return records.filter((record, index) => records.findIndex((candidate) => candidate.taskId === record.taskId && candidate.choice === record.choice && candidate.attempt === record.attempt) === index).map((record) => {
    const task = DEMO_TASKS.find((candidate) => candidate.id === record.taskId);
    return task && record.response ? { ...record, success: isCorrect(task, record.response) } : record;
  });
}

export function summarizeRun(records: RunRecord[], decisions: SupervisorDecision[]) {
  const canonical = canonicalWorkerRecords(records);
  const canonicalDecisions = decisions.filter((decision, index) => decisions.findIndex((candidate) => candidate.taskId === decision.taskId && candidate.choice === decision.choice) === index);
  const tasks = DEMO_TASKS.map((task) => {
    const worker = taskMetrics(canonical.filter((record) => record.taskId === task.id));
    const supervisor = canonicalDecisions.filter((decision) => decision.taskId === task.id);
    const supervisorTokens = supervisor.map(tokens).reduce((sum, value) => sum + value, 0);
    const supervisorCost = supervisor.map(cost).reduce((sum, value) => sum + value, 0);
    return { taskId: task.id, category: task.category, brief: task.brief, ...worker, supervisor: { decisions: supervisor.length, tokens: supervisorTokens, cost: supervisorCost, selections: supervisor.map((decision) => ({ choice: decision.choice, effort: decision.effort, rationale: decision.rationale ?? "Not recorded" })) }, combinedCost: worker.totalCost + supervisorCost };
  });
  return { ignoredDuplicateRecords: records.length - canonical.length, workerTotals: { attempts: canonical.length, tokens: canonical.map(tokens).reduce((sum, value) => sum + value, 0), cost: canonical.map(cost).reduce((sum, value) => sum + value, 0) }, supervisorTotals: { decisions: canonicalDecisions.length, tokens: canonicalDecisions.map(tokens).reduce((sum, value) => sum + value, 0), cost: canonicalDecisions.map(cost).reduce((sum, value) => sum + value, 0) }, tasks };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const path = process.argv.slice(2).find((arg) => !arg.startsWith("--")) ?? "results/openrouter-supervisor-demo.jsonl";
  const records = (await readFile(path, "utf8")).trim().split("\n").filter(Boolean).map((line) => JSON.parse(line) as RunRecord);
  const decisionsPath = path.replace(/\.jsonl$/, "-decisions.jsonl");
  const decisions = (await readFile(decisionsPath, "utf8").catch(() => "")).split("\n").filter(Boolean).map((line) => JSON.parse(line) as SupervisorDecision);
  const report = summarizeRun(records, decisions);
  if (process.argv.includes("--write")) await writeFile(path.replace(/\.jsonl$/, "-summary.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
}
