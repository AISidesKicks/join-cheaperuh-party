import { readFile } from "node:fs/promises";
import { calculateTaskMetrics, scoreRecommendation } from "./metrics.js";
import { suggestLevel } from "./router.js";
import type { CalibrationSet } from "./types.js";

const dataset = JSON.parse(await readFile(new URL("../datasets/poc-calibration.json", import.meta.url), "utf8")) as CalibrationSet;
const rows = dataset.tasks.map((task) => {
  const selectedLevel = suggestLevel(task);
  return { id: task.id, category: task.category, selectedLevel, ...calculateTaskMetrics(task), ...scoreRecommendation(task, selectedLevel) };
});
const rate = (key: "exactLevelMatch" | "safeSelection" | "underSelected") => rows.filter((row) => row[key]).length / rows.length;
const costRatio = rows.reduce((sum, row) => sum + row.recommendedCost, 0) / rows.reduce((sum, row) => sum + row.l3Cost, 0);
console.log(JSON.stringify({ dataset: dataset.name, referenceKind: dataset.referenceKind, taskCount: rows.length, router: { exactLevelMatch: rate("exactLevelMatch"), safeSelection: rate("safeSelection"), underSelection: rate("underSelected"), costVsAlwaysL3: costRatio }, rows }, null, 2));
