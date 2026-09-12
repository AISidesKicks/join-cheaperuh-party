export const LEVELS = ["L1", "L2", "L3"] as const;
export type Level = (typeof LEVELS)[number];
export type Category = "direct-extraction" | "bounded-transformation" | "compositional-reasoning" | "executable-debugging";

export interface ComplexityProfile {
  steps: number;
  dependencies: number;
  needsExecution: boolean;
  ambiguityRisk: "low" | "medium" | "high";
}

export interface Attempt {
  level: Level;
  success: boolean;
  cost: number;
}

export interface Task {
  id: string;
  category: Category;
  prompt: string;
  verifier: string;
  complexity: ComplexityProfile;
  attempts: Attempt[];
}

export interface CalibrationSet {
  name: string;
  referenceKind: "illustrative" | "measured";
  tasks: Task[];
}
