import { describe, expect, it } from "vitest";
import { REASONING_LEVELS, type ReasoningEffort } from "../src/experiment.js";
import { taskMetrics, type RunRecord } from "../src/analyze-results.js";

describe("nine-level analysis", () => {
  it("finds the sufficient effort and preserves a 1.0 no-waste baseline", () => {
    const records: RunRecord[] = REASONING_LEVELS.map((effort) => ({ taskId: "sample", category: "sample", effort, success: effort >= 50, usage: { total_tokens: 10 + effort } }));
    expect(taskMetrics(records)).toMatchObject({ minimumSolvableEffort: 50, difficulty: 4 / 9 });
    expect(taskMetrics(REASONING_LEVELS.map((effort) => ({ taskId: "sample", category: "sample", effort, success: effort === 100, usage: { total_tokens: 10 + effort } })))).toMatchObject({ minimumSolvableEffort: 100, overComputeRatio: 1 });
  });

  it("rejects an incomplete effort curve", () => {
    const records = REASONING_LEVELS.slice(0, -1).map((effort) => ({ taskId: "sample", category: "sample", effort: effort as ReasoningEffort, success: false }));
    expect(() => taskMetrics(records)).toThrow("one result at every reasoning effort");
  });
});
