import { SUPPORTED_EFFORTS, type ReasoningEffort } from "./experiment.js";

export interface AuditAttempt { taskId: string; effort: ReasoningEffort; success: boolean; usage?: { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number; cost?: number } }
export interface EffortSummary { effort: ReasoningEffort; accuracy: number; meanCost: number; meanTokens: number }
export interface AuditTaskMetrics { taskId: string; difficulty: number; minimumSolvableEffort: ReasoningEffort | null; overComputeRatio: number | null; marginalAccuracyGain: number; computeExpansionRatio: number | null; marginalRoi: number | null; diminishingReturnEffort: ReasoningEffort | null; efforts: EffortSummary[] }

const mean = (values: number[]) => values.reduce((total, value) => total + value, 0) / values.length;
const usageValue = (attempt: AuditAttempt, key: "cost" | "tokens") => key === "cost" ? attempt.usage?.cost ?? 0 : attempt.usage?.total_tokens ?? (attempt.usage?.prompt_tokens ?? 0) + (attempt.usage?.completion_tokens ?? 0);

export function calculateAuditTaskMetrics(taskId: string, attempts: AuditAttempt[], threshold = 0.05): AuditTaskMetrics {
  const efforts = SUPPORTED_EFFORTS.map((effort) => {
    const atEffort = attempts.filter((attempt) => attempt.effort === effort);
    if (atEffort.length !== 3) throw new Error(`${taskId}/${effort}: expected three attempts`);
    return { effort, accuracy: mean(atEffort.map((attempt) => Number(attempt.success))), meanCost: mean(atEffort.map((attempt) => usageValue(attempt, "cost"))), meanTokens: mean(atEffort.map((attempt) => usageValue(attempt, "tokens"))) };
  });
  const minimumSolvableEffort = efforts.find((effort) => effort.accuracy > 0)?.effort ?? null;
  const none = efforts[0];
  const max = efforts.at(-1)!;
  const extraCost = max.meanCost - none.meanCost;
  const firstSmallGain = efforts.slice(1).find((effort, index) => effort.accuracy - efforts[index].accuracy < threshold)?.effort ?? null;
  const baseline = minimumSolvableEffort ? efforts.find((effort) => effort.effort === minimumSolvableEffort)! : null;
  return { taskId, difficulty: 1 - mean(attempts.map((attempt) => Number(attempt.success))), minimumSolvableEffort, overComputeRatio: baseline?.meanCost ? mean(efforts.map((effort) => effort.meanCost)) / baseline.meanCost : null, marginalAccuracyGain: max.accuracy - none.accuracy, computeExpansionRatio: none.meanCost ? max.meanCost / none.meanCost : null, marginalRoi: extraCost > 0 ? (max.accuracy - none.accuracy) / extraCost : null, diminishingReturnEffort: firstSmallGain, efforts };
}

export function pearsonCorrelation(left: number[], right: number[]): number | null {
  if (left.length !== right.length || left.length < 2) return null;
  const leftMean = mean(left), rightMean = mean(right);
  const numerator = left.reduce((total, value, index) => total + (value - leftMean) * (right[index] - rightMean), 0);
  const denominator = Math.sqrt(left.reduce((total, value) => total + (value - leftMean) ** 2, 0) * right.reduce((total, value) => total + (value - rightMean) ** 2, 0));
  return denominator ? numerator / denominator : null;
}
