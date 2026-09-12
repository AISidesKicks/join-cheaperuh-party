import { LEVELS, type Attempt, type Level, type Task } from "./types.js";

const mean = (values: number[]) => values.reduce((total, value) => total + value, 0) / values.length;
const atLevel = (attempts: Attempt[], level: Level) => attempts.filter((attempt) => attempt.level === level);
const accuracy = (attempts: Attempt[]) => mean(attempts.map((attempt) => Number(attempt.success)));
const cost = (attempts: Attempt[]) => mean(attempts.map((attempt) => attempt.cost));

export interface TaskMetrics {
  difficulty: number;
  minimumSolvableLevel: Level | null;
  overComputeRatio: number | null;
  marginalAccuracyGain: number;
  computeExpansionRatio: number;
  marginalRoi: number | null;
}

export function validateMatrix(task: Task): void {
  if (task.attempts.length !== 9) throw new Error(`${task.id}: expected 9 calibration attempts`);
  for (const level of LEVELS) {
    const attempts = atLevel(task.attempts, level);
    if (attempts.length !== 3) throw new Error(`${task.id}: expected 3 attempts at ${level}`);
    if (attempts.some((attempt) => attempt.cost <= 0)) throw new Error(`${task.id}: cost must be positive`);
  }
}

export function calculateTaskMetrics(task: Task): TaskMetrics {
  validateMatrix(task);
  const l1 = atLevel(task.attempts, "L1");
  const l3 = atLevel(task.attempts, "L3");
  const minimumSolvableLevel = LEVELS.find((level) => atLevel(task.attempts, level).some((attempt) => attempt.success)) ?? null;
  const levelOneCost = cost(l1);
  const levelThreeCost = cost(l3);
  const extraCost = levelThreeCost - levelOneCost;
  const marginalAccuracyGain = accuracy(l3) - accuracy(l1);
  const solvableAndHigher = minimumSolvableLevel
    ? task.attempts.filter((attempt) => LEVELS.indexOf(attempt.level) >= LEVELS.indexOf(minimumSolvableLevel))
    : [];
  return {
    difficulty: 1 - accuracy(task.attempts),
    minimumSolvableLevel,
    overComputeRatio: minimumSolvableLevel ? cost(solvableAndHigher) / cost(atLevel(task.attempts, minimumSolvableLevel)) : null,
    marginalAccuracyGain,
    computeExpansionRatio: levelThreeCost / levelOneCost,
    marginalRoi: extraCost > 0 ? marginalAccuracyGain / extraCost : null,
  };
}

export interface RouterScore {
  exactLevelMatch: boolean;
  safeSelection: boolean;
  underSelected: boolean;
  recommendedCost: number;
  l3Cost: number;
}

export function scoreRecommendation(task: Task, selectedLevel: Level): RouterScore {
  const metrics = calculateTaskMetrics(task);
  const selected = atLevel(task.attempts, selectedLevel);
  const minimumIndex = metrics.minimumSolvableLevel ? LEVELS.indexOf(metrics.minimumSolvableLevel) : -1;
  return {
    exactLevelMatch: metrics.minimumSolvableLevel === selectedLevel,
    safeSelection: selected.some((attempt) => attempt.success),
    underSelected: minimumIndex >= 0 && LEVELS.indexOf(selectedLevel) < minimumIndex,
    recommendedCost: cost(selected),
    l3Cost: cost(atLevel(task.attempts, "L3")),
  };
}
