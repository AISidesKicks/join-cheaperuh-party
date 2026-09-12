import { describe, expect, it } from "vitest";
import { REASONING_LEVELS, TASKS, directDeepSeekThinkingRequest, isCorrect, reasoningRequest } from "../src/experiment.js";

describe("nine by nine reasoning experiment", () => {
  it("has nine categories with nine original tasks each", () => {
    expect(new Set(TASKS.map((task) => task.category)).size).toBe(9);
    expect(TASKS).toHaveLength(81);
    for (const category of new Set(TASKS.map((task) => task.category))) {
      expect(TASKS.filter((task) => task.category === category)).toHaveLength(9);
    }
  });

  it("uses disabled thinking plus eight evenly spaced numeric effort settings", () => {
    expect(REASONING_LEVELS).toEqual([0, 12, 25, 38, 50, 63, 75, 88, 100]);
    expect(reasoningRequest(0)).toEqual({ enabled: false });
    expect(reasoningRequest(75)).toEqual({ effort: 75 });
    expect(directDeepSeekThinkingRequest(75)).toEqual({ thinking: { type: "enabled" }, reasoning_effort: 75 });
  });

  it("scores exact and diagnostic answers without an LLM", () => {
    expect(isCorrect(TASKS[0], "Use count === 0")).toBe(true);
    expect(isCorrect(TASKS[9], "17")).toBe(true);
    expect(isCorrect(TASKS[9], "The quantity is 17")).toBe(false);
  });
});
