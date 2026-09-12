import { describe, expect, it } from "vitest";
import { CANDIDATE_TASKS, DEMO_TASKS, SUPPORTED_EFFORTS, isCorrect, reasoningRequest } from "../src/experiment.js";

describe("nine by nine reasoning experiment", () => {
  it("curates three graded demo tasks per category from a 33-task candidate bank", () => {
    expect(new Set(CANDIDATE_TASKS.map((task) => task.category)).size).toBe(9);
    expect(CANDIDATE_TASKS).toHaveLength(33);
    expect(DEMO_TASKS).toHaveLength(27);
    expect(new Set(DEMO_TASKS.map((task) => task.category)).size).toBe(9);
    expect([...new Set(DEMO_TASKS.map((task) => task.category))].every((category) => DEMO_TASKS.filter((task) => task.category === category).length === 3)).toBe(true);
  });

  it("allows the supervisor every supported effort including zero reasoning", () => {
    expect(SUPPORTED_EFFORTS).toEqual(["none", "minimal", "low", "medium", "high", "xhigh", "max"]);
    expect(reasoningRequest("none")).toEqual({ enabled: false, exclude: true });
    expect(reasoningRequest("xhigh")).toEqual({ effort: "xhigh", exclude: true });
  });

  it("scores exact and diagnostic answers without an LLM", () => {
    expect(isCorrect(CANDIDATE_TASKS[0], "Use count === 0")).toBe(true);
    expect(isCorrect(CANDIDATE_TASKS[4], "17")).toBe(true);
    expect(isCorrect(CANDIDATE_TASKS[4], "The quantity is 17")).toBe(false);
    expect(isCorrect(DEMO_TASKS.find((task) => task.id === "ordering-constraints-03")!, "B, C, A, D, E, F")).toBe(true);
    expect(isCorrect(DEMO_TASKS.find((task) => task.id === "debug-diagnosis-02")!, "Click and submit both save.")).toBe(true);
  });
});
