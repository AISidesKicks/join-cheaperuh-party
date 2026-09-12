import { describe, expect, it } from "vitest";
import { calculateAuditTaskMetrics, pearsonCorrelation } from "../src/audit-metrics.js";
import { SUPPORTED_EFFORTS } from "../src/experiment.js";

describe("effort audit metrics", () => {
  it("calculates minimum effort and marginal ROI from a full effort curve", () => {
    const attempts = SUPPORTED_EFFORTS.flatMap((effort, index) => Array.from({ length: 3 }, () => ({ taskId: "sample", effort, success: index >= 2, usage: { total_tokens: 10 * (index + 1), cost: 0.01 * (index + 1) } })));
    const metrics = calculateAuditTaskMetrics("sample", attempts);
    expect(metrics.minimumSolvableEffort).toBe("low");
    expect(metrics.marginalAccuracyGain).toBe(1);
    expect(metrics.computeExpansionRatio).toBeCloseTo(7);
  });

  it("calculates a signed fit correlation", () => {
    expect(pearsonCorrelation([1, 2, 3], [2, 4, 6])).toBeCloseTo(1);
  });
});
