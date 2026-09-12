import { describe, expect, it } from "vitest";
import fixture from "../datasets/poc-calibration.json" with { type: "json" };
import { calculateTaskMetrics, scoreRecommendation, validateMatrix } from "../src/metrics.js";
import { suggestLevel } from "../src/router.js";
import type { CalibrationSet, Task } from "../src/types.js";

const data = fixture as CalibrationSet;

describe("3 x 3 calibration metrics", () => {
  it("scores Variant A and B from all nine attempts", () => {
    const result = calculateTaskMetrics(data.tasks[0]);
    expect(result).toMatchObject({ difficulty: 0, minimumSolvableLevel: "L1", marginalAccuracyGain: 0 });
    expect(result.overComputeRatio).toBeGreaterThan(1);
    expect(result.computeExpansionRatio).toBeGreaterThan(1);
  });

  it("uses one as the no-waste baseline when L3 is first solvable", () => {
    const result = calculateTaskMetrics(data.tasks[9]);
    expect(result.minimumSolvableLevel).toBe("L3");
    expect(result.overComputeRatio).toBe(1);
  });

  it("rejects incomplete calibration evidence", () => {
    const incomplete = { ...data.tasks[0], attempts: data.tasks[0].attempts.slice(0, 8) } as Task;
    expect(() => validateMatrix(incomplete)).toThrow("expected 9 calibration attempts");
  });
});

describe("logical router PoC", () => {
  it("covers twelve tasks in four rubrics and makes one choice per task", () => {
    expect(data.tasks).toHaveLength(12);
    expect(new Set(data.tasks.map((task) => task.category)).size).toBe(4);
    const scores = data.tasks.map((task) => scoreRecommendation(task, suggestLevel(task)));
    expect(scores.filter((score) => score.safeSelection)).toHaveLength(11);
    expect(scores.filter((score) => score.exactLevelMatch)).toHaveLength(9);
  });
});
