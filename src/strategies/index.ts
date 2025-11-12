/**
 * Advanced strategies for improving GAIA benchmark performance
 * Includes ReAct planning, reflection, confidence scoring, and multi-agent verification
 */

import type { CoreMessage } from "ai";
import type { GAIAAgent } from "../agent.js";
import {
  getTaskAwareInstructions,
  REACT_PLANNER_INSTRUCTIONS,
  REFLECTION_PROMPT,
} from "../config/react-planner.js";
import type { GaiaTask } from "../types.js";

/**
 * Create task-aware instructions by combining ReAct planner with task-specific guidance
 */
export function createTaskAwareInstructions(question: string, hasFiles: boolean): string {
  const baseInstructions = REACT_PLANNER_INSTRUCTIONS;
  const taskSpecificInstructions = getTaskAwareInstructions(question, hasFiles);

  return baseInstructions + taskSpecificInstructions;
}

/**
 * Reflection mechanism - verify answer before submission
 * This implements a self-verification step to catch errors
 */
export async function reflectOnAnswer(
  agent: GAIAAgent,
  task: GaiaTask,
  proposedAnswer: string,
  verbose = false,
): Promise<{ shouldRetry: boolean; reflection: string; confidence?: number }> {
  if (verbose) {
    console.log("\n🔍 Reflecting on answer...");
    console.log(`Proposed answer: ${proposedAnswer}`);
  }

  // Build reflection prompt
  const reflectionPrompt = `
Question: ${task.question}
My proposed answer: ${proposedAnswer}
Expected answer format: ${task.answer ? typeof task.answer : "unknown"}

${REFLECTION_PROMPT}

Provide your reflection and confidence level (0-100%).
`;

  try {
    // Use the agent to reflect on its own answer
    const reflectionResult = await agent.generate({
      messages: [
        {
          role: "user",
          content: reflectionPrompt,
        },
      ],
    });

    const reflection = reflectionResult.text || "";

    if (verbose) {
      console.log(`\n📝 Reflection: ${reflection.substring(0, 200)}...`);
    }

    // Parse confidence if mentioned
    const confidenceMatch = reflection.match(/(\d+)%/);
    const confidence = confidenceMatch ? Number.parseInt(confidenceMatch[1], 10) : undefined;

    // Determine if we should retry based on reflection
    const shouldRetry =
      reflection.toLowerCase().includes("uncertain") ||
      reflection.toLowerCase().includes("should verify") ||
      reflection.toLowerCase().includes("low confidence") ||
      (confidence !== undefined && confidence < 80);

    if (verbose && shouldRetry) {
      console.log(`\n⚠️ Low confidence detected (${confidence}%). Recommending retry.`);
    }

    return {
      shouldRetry,
      reflection,
      confidence,
    };
  } catch (error) {
    if (verbose) {
      console.error(`Error during reflection: ${error}`);
    }
    return {
      shouldRetry: false,
      reflection: "Reflection failed",
    };
  }
}

/**
 * Estimate confidence in an answer based on multiple signals
 */
export function estimateConfidence(options: {
  stepsCount?: number;
  toolsUsed?: string[];
  hasError?: boolean;
  answerLength?: number;
}): number {
  let confidence = 50; // baseline

  // More steps generally indicates thorough investigation
  if (options.stepsCount) {
    if (options.stepsCount >= 3) confidence += 20;
    else if (options.stepsCount >= 2) confidence += 10;
  }

  // Certain tools indicate verification
  if (options.toolsUsed) {
    const hasSearch = options.toolsUsed.includes("search");
    const hasVerification = options.toolsUsed.includes("searchGetContents");
    const hasCalculation =
      options.toolsUsed.includes("calculator") || options.toolsUsed.includes("sandbox");

    if (hasSearch) confidence += 15;
    if (hasVerification) confidence += 10;
    if (hasCalculation) confidence += 10;
  }

  // Errors reduce confidence
  if (options.hasError) confidence -= 30;

  // Very short or very long answers might indicate issues
  if (options.answerLength) {
    if (options.answerLength < 1) confidence -= 20;
    else if (options.answerLength > 500)
      confidence -= 10; // probably includes explanation
    else if (options.answerLength > 1 && options.answerLength < 100) confidence += 10; // concise answer
  }

  return Math.max(0, Math.min(100, confidence));
}
