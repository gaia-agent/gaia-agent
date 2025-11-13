/**
 * Planning Tool - Creates step-by-step execution plans for complex tasks
 *
 * Use this tool FIRST for multi-step tasks (Level 2-3) to create a structured
 * plan before executing tools. The plan is stored in memory for tracking progress.
 */

import { tool } from "ai";
import { z } from "zod";
import type { ExecutionPlan, PlanStep } from "./types.js";

/**
 * Schema for a single plan step
 */
const planStepSchema = z.object({
  step: z.number().min(1).describe("Step number (1, 2, 3, ...)"),
  reasoning: z
    .string()
    .min(10)
    .describe("Detailed reasoning: Why is this step needed? What will it accomplish?"),
  tool: z.string().describe("Tool to use: search, sandbox, browser, calculator, memoryStore, etc."),
  expectedOutput: z.string().describe("What result do you expect from this step? Be specific."),
});

/**
 * Planning tool - creates structured execution plans
 *
 * @example
 * ```typescript
 * // For complex question: "Calculate the average founding year of top 3 tech companies"
 * await planner({
 *   question: "Calculate the average founding year of top 3 tech companies",
 *   steps: [
 *     {
 *       step: 1,
 *       reasoning: "Need to identify which are the top 3 tech companies by market cap",
 *       tool: "search",
 *       expectedOutput: "List of top tech companies: Apple, Microsoft, Google"
 *     },
 *     {
 *       step: 2,
 *       reasoning: "Need founding years for each company to calculate average",
 *       tool: "search",
 *       expectedOutput: "Apple: 1976, Microsoft: 1975, Google: 1998"
 *     },
 *     {
 *       step: 3,
 *       reasoning: "Calculate average of the three founding years",
 *       tool: "calculator",
 *       expectedOutput: "Average year: 1983"
 *     }
 *   ]
 * });
 * ```
 */
export const planner = tool({
  description: `Create a detailed step-by-step execution plan for complex multi-step tasks.

USE THIS TOOL when:
- Task requires 3+ steps to solve
- Multiple tools needed in sequence
- Complex reasoning or data processing required
- Task is Level 2 or Level 3 difficulty

DO NOT use for simple single-step tasks (just use the appropriate tool directly).

The plan will be stored in memory to track your progress through execution.`,

  inputSchema: z.object({
    question: z.string().describe("The complete question/task you need to solve"),
    steps: z
      .array(planStepSchema)
      .min(2)
      .max(10)
      .describe("Ordered list of steps to execute (minimum 2, maximum 10 steps)"),
  }) as unknown as typeof tool.prototype.inputSchema,

  execute: async ({ question, steps }): Promise<ExecutionPlan> => {
    // Validate steps are properly ordered
    for (let i = 0; i < steps.length; i++) {
      if (steps[i].step !== i + 1) {
        return {
          question,
          steps: [],
          complexity: 0,
          success: false,
        };
      }
    }

    // Format plan for memory storage
    const planSummary = steps
      .map(
        (s: PlanStep) => `Step ${s.step}: [${s.tool}] ${s.reasoning} → Expect: ${s.expectedOutput}`,
      )
      .join("\n");

    const planMemory = `
═══════════════════════════════════════════════════════════
📋 EXECUTION PLAN for: "${question}"
═══════════════════════════════════════════════════════════
Total Steps: ${steps.length}

${planSummary}

═══════════════════════════════════════════════════════════
Status: Plan created. Execute steps in order.
Next: Execute Step 1
═══════════════════════════════════════════════════════════
`;

    // Store plan in global context if memory is available
    // Note: In real execution, this would integrate with the agent's memory system
    console.log("\n📋 Plan Created:\n", planMemory);

    return {
      question,
      steps: steps as PlanStep[],
      complexity: steps.length,
      success: true,
    };
  },
});

/**
 * Schema for planning tool (for use in tool collections)
 */
export const plannerSchema = z.object({
  question: z.string().describe("The complete question/task you need to solve"),
  steps: z
    .array(planStepSchema)
    .min(2)
    .max(10)
    .describe("Ordered list of steps to execute (2-10 steps)"),
});
