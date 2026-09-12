import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { DEMO_TASKS, SUPPORTED_EFFORTS } from "./experiment.js";
import { calculateAuditTaskMetrics, pearsonCorrelation, type AuditAttempt } from "./audit-metrics.js";

const readJsonl = async <T>(path: string): Promise<T[]> => (await readFile(path, "utf8")).split("\n").filter(Boolean).map((line) => JSON.parse(line) as T);
const effortIndex = (effort: string) => SUPPORTED_EFFORTS.indexOf(effort as (typeof SUPPORTED_EFFORTS)[number]);
const average = (values: number[]) => values.reduce((total, value) => total + value, 0) / values.length;

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const runId = process.argv.find((arg) => arg.startsWith("--run="))?.split("=")[1] ?? "effort-audit-v1";
  const auditPath = `results/openrouter-effort-audit-${runId}.jsonl`;
  const records = await readJsonl<AuditAttempt & { attempt: number; category: string; response?: string }>(auditPath);
  const canonical = records.filter((record, index) => records.findIndex((candidate) => candidate.taskId === record.taskId && candidate.effort === record.effort && candidate.attempt === record.attempt) === index);
  const supervisor = await readJsonl<{ taskId: string; choice: number; attempt: number; effort: string }>("results/openrouter-supervisor-expanded-v1.jsonl");
  const canonicalSupervisor = supervisor.filter((record, index) => supervisor.findIndex((candidate) => candidate.taskId === record.taskId && candidate.choice === record.choice && candidate.attempt === record.attempt) === index);
  const tasks = DEMO_TASKS.map((task) => {
    const metrics = calculateAuditTaskMetrics(task.id, canonical.filter((record) => record.taskId === task.id));
    const selections = canonicalSupervisor.filter((record) => record.taskId === task.id).map((record) => effortIndex(record.effort));
    return { category: task.category, supervisorMeanEffortIndex: average(selections), ...metrics };
  });
  const difficulty = tasks.map((task) => task.difficulty);
  const selectedEffort = tasks.map((task) => task.supervisorMeanEffortIndex);
  const totalCost = canonical.reduce((total, record) => total + (record.usage?.cost ?? 0), 0);
  const report = { version: 1, runId, measured: true, protocol: { tasks: DEMO_TASKS.length, efforts: SUPPORTED_EFFORTS, attemptsPerEffort: 3, canonicalAttempts: canonical.length, ignoredDuplicateAttempts: records.length - canonical.length, threshold: 0.05 }, summary: { meanDifficulty: average(difficulty), adaptiveFitCorrelation: pearsonCorrelation(selectedEffort, difficulty), auditWorkerCost: totalCost, meanMarginalAccuracyGain: average(tasks.map((task) => task.marginalAccuracyGain)), meanComputeExpansionRatio: average(tasks.map((task) => task.computeExpansionRatio ?? 0)), meanOverComputeRatio: average(tasks.map((task) => task.overComputeRatio ?? 0)) }, tasks };
  await mkdir("docs/data", { recursive: true });
  await writeFile(`docs/data/${runId}.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report.summary, null, 2));
}
