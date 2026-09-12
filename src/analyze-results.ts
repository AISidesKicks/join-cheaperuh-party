import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { REASONING_LEVELS, TASKS, type ReasoningEffort } from "./experiment.js";

export interface RunRecord {
  taskId: string;
  category: string;
  effort: ReasoningEffort;
  success: boolean;
  usage?: { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number };
}

const cost = (record: RunRecord) => record.usage?.total_tokens ?? (record.usage?.prompt_tokens ?? 0) + (record.usage?.completion_tokens ?? 0);
const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

export function taskMetrics(records: RunRecord[]) {
  if (records.length !== REASONING_LEVELS.length) throw new Error("A task requires one result at every reasoning effort.");
  const byEffort = new Map(records.map((record) => [record.effort, record]));
  for (const effort of REASONING_LEVELS) if (!byEffort.has(effort)) throw new Error(`Missing effort ${effort}`);
  const minimumSolvableEffort = REASONING_LEVELS.find((effort) => byEffort.get(effort)?.success) ?? null;
  const allCosts = records.map(cost);
  const baseCost = minimumSolvableEffort === null ? null : cost(byEffort.get(minimumSolvableEffort)!);
  const higherCosts = minimumSolvableEffort === null ? [] : records.filter((record) => record.effort >= minimumSolvableEffort).map(cost);
  const off = byEffort.get(0)!;
  const max = byEffort.get(100)!;
  const extraCost = cost(max) - cost(off);
  return {
    difficulty: 1 - records.filter((record) => record.success).length / records.length,
    minimumSolvableEffort,
    overComputeRatio: baseCost && baseCost > 0 ? mean(higherCosts) / baseCost : null,
    marginalAccuracyGain: Number(max.success) - Number(off.success),
    computeExpansionRatio: cost(off) > 0 ? cost(max) / cost(off) : null,
    marginalRoi: extraCost > 0 ? (Number(max.success) - Number(off.success)) / extraCost : null,
    meanTokens: mean(allCosts),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const path = process.argv[2] ?? "results/deepseek-v4.1-flash.jsonl";
  const lines = (await readFile(path, "utf8")).trim().split("\n").filter(Boolean);
  const records = lines.map((line) => JSON.parse(line) as RunRecord);
  const metrics = TASKS.map((task) => ({ taskId: task.id, category: task.category, ...taskMetrics(records.filter((record) => record.taskId === task.id)) }));
  console.log(JSON.stringify({ tasks: metrics.length, metrics }, null, 2));
}
