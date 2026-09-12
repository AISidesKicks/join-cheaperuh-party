import { describe, expect, it } from "vitest";
import { ATTEMPTS_PER_CHOICE, SUPERVISOR_CHOICES, type ReasoningEffort } from "../src/experiment.js";
import { taskMetrics, type RunRecord } from "../src/analyze-results.js";

describe("nine-level analysis", () => {
  it("summarizes three supervisor choices and three attempts per choice", () => {
    const records: RunRecord[] = Array.from({ length: SUPERVISOR_CHOICES }, (_, choice) => Array.from({ length: ATTEMPTS_PER_CHOICE }, (_, attempt) => ({ taskId: "sample", category: "sample", choice: choice + 1, attempt: attempt + 1, effort: (choice === 0 ? "none" : "high") as ReasoningEffort, success: choice > 0, usage: { total_tokens: 10 + choice } }))).flat();
    expect(taskMetrics(records)).toMatchObject({ successRate: 2 / 3, totalTokens: 99, totalCost: 0, selectedEfforts: ["none", "high", "high"] });
  });

  it("rejects an incomplete effort curve", () => {
    expect(() => taskMetrics([])).toThrow("three supervisor choices");
  });
});
