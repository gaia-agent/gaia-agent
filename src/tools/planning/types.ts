/**
 * Planning tool type definitions
 */

/**
 * A single step in the execution plan
 */
export interface PlanStep {
  /** Step number (1-indexed) */
  step: number;
  /** Reasoning for why this step is needed */
  reasoning: string;
  /** Which tool to use for this step */
  tool: string;
  /** What output/result you expect from this step */
  expectedOutput: string;
}

/**
 * Execution plan for a task
 */
export interface ExecutionPlan {
  /** The question/task being solved */
  question: string;
  /** Ordered list of steps to execute */
  steps: PlanStep[];
  /** Estimated complexity (number of steps) */
  complexity: number;
  /** Whether the plan was successfully created */
  success: boolean;
}

/**
 * Plan execution status
 */
export interface PlanStatus {
  /** Current step being executed (1-indexed) */
  currentStep: number;
  /** Total number of steps in plan */
  totalSteps: number;
  /** Steps completed so far */
  completedSteps: number[];
  /** Whether plan execution is complete */
  complete: boolean;
}
