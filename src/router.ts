import { type Level, type Task } from "./types.js";

/** Transparent baseline. Replace with a model assessor that returns one Level. */
export function suggestLevel(task: Pick<Task, "category" | "complexity">): Level {
  if (task.complexity.needsExecution || task.category === "executable-debugging") return "L3";
  if (task.complexity.dependencies >= 2 || task.complexity.steps >= 3 || task.complexity.ambiguityRisk !== "low") return "L2";
  return "L1";
}
