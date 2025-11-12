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

/**
 * Iterative answering with confidence-based retry
 * If confidence is low, try alternative approach
 */
export async function iterativeAnswering(
  agent: GAIAAgent,
  task: GaiaTask,
  options: {
    maxAttempts?: number;
    confidenceThreshold?: number;
    verbose?: boolean;
    useReflection?: boolean;
  } = {},
): Promise<{
  answer: string;
  attempts: number;
  confidence?: number;
  finalReflection?: string;
}> {
  const {
    maxAttempts = 2,
    confidenceThreshold = 70,
    verbose = false,
    useReflection = true,
  } = options;

  const attempts: Array<{ answer: string; confidence: number }> = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (verbose) {
      console.log(`\n🔄 Attempt ${attempt}/${maxAttempts}`);
    }

    // Generate answer with task-aware instructions
    const taskInstructions = createTaskAwareInstructions(
      task.question,
      Boolean(task.files && task.files.length > 0),
    );

    // Build messages
    const messages: CoreMessage[] = [];

    if (task.files && task.files.length > 0) {
      const contentParts: Array<
        { type: "text"; text: string } | { type: "image"; image: string | URL }
      > = [{ type: "text", text: task.question }];

      for (const file of task.files) {
        if (file.data) {
          contentParts.push({
            type: "image",
            image: file.data,
          });
        }
      }

      messages.push({
        role: "user",
        content: contentParts,
      });
    } else {
      messages.push({
        role: "user",
        content: task.question,
      });
    }

    // Add attempt-specific context
    if (attempt > 1) {
      messages.push({
        role: "user",
        content: `Previous attempt had low confidence. Try a different approach or verify using alternative sources/methods.`,
      });
    }

    const result = await agent.generate({
      messages,
    });

    const answer = result.text || "";

    // Estimate confidence
    const confidence = estimateConfidence({
      stepsCount: result.steps?.length,
      toolsUsed: result.steps?.flatMap((s) =>
        "toolCalls" in s && s.toolCalls
          ? s.toolCalls.map((tc: { toolName: string }) => tc.toolName)
          : [],
      ),
      hasError: false,
      answerLength: answer.length,
    });

    if (verbose) {
      console.log(`📊 Estimated confidence: ${confidence}%`);
    }

    attempts.push({ answer, confidence });

    // Use reflection if enabled
    if (useReflection && attempt < maxAttempts) {
      const reflection = await reflectOnAnswer(agent, task, answer, verbose);

      if (!reflection.shouldRetry || confidence >= confidenceThreshold) {
        // High confidence, return this answer
        return {
          answer,
          attempts: attempt,
          confidence: reflection.confidence || confidence,
          finalReflection: reflection.reflection,
        };
      }
    } else if (confidence >= confidenceThreshold) {
      // Reached confidence threshold without reflection
      return {
        answer,
        attempts: attempt,
        confidence,
      };
    }
  }

  // Return best attempt
  const best = attempts.reduce((a, b) => (a.confidence > b.confidence ? a : b));

  if (verbose) {
    console.log(`\n✅ Returning best attempt (confidence: ${best.confidence}%)`);
  }

  return {
    answer: best.answer,
    attempts: attempts.length,
    confidence: best.confidence,
  };
}

/**
 * Multi-strategy answering - try multiple approaches and pick the best
 * This implements ensemble/voting mechanism
 */
export async function multiStrategyAnswering(
  createAgentFn: (instructions: string) => GAIAAgent,
  task: GaiaTask,
  options: {
    strategies?: Array<{ name: string; instructions: string }>;
    verbose?: boolean;
  } = {},
): Promise<{
  answer: string;
  consensus?: boolean;
  votes?: Record<string, number>;
  strategies?: Array<{ name: string; answer: string }>;
}> {
  const { verbose = false } = options;

  // Default strategies if not provided
  const strategies = options.strategies || [
    {
      name: "search-first",
      instructions: `${REACT_PLANNER_INSTRUCTIONS}\n\n🎯 STRATEGY: Search-First Approach\nPrioritize web search and authoritative sources. Use search, searchGetContents, and cross-verification.`,
    },
    {
      name: "calculation-first",
      instructions: `${REACT_PLANNER_INSTRUCTIONS}\n\n🎯 STRATEGY: Calculation-First Approach\nPrioritize computational tools. Use calculator and sandbox for verification. Cross-check calculations.`,
    },
  ];

  if (verbose) {
    console.log(`\n🤖 Running multi-strategy answering with ${strategies.length} strategies...`);
  }

  const results: Array<{ name: string; answer: string }> = [];

  // Execute each strategy
  for (const strategy of strategies) {
    if (verbose) {
      console.log(`\n📋 Strategy: ${strategy.name}`);
    }

    const agent = createAgentFn(strategy.instructions);

    const messages: CoreMessage[] = [];

    if (task.files && task.files.length > 0) {
      const contentParts: Array<
        { type: "text"; text: string } | { type: "image"; image: string | URL }
      > = [{ type: "text", text: task.question }];

      for (const file of task.files) {
        if (file.data) {
          contentParts.push({
            type: "image",
            image: file.data,
          });
        }
      }

      messages.push({
        role: "user",
        content: contentParts,
      });
    } else {
      messages.push({
        role: "user",
        content: task.question,
      });
    }

    try {
      const result = await agent.generate({
        messages,
      });

      const answer = (result.text || "").trim();
      results.push({ name: strategy.name, answer });

      if (verbose) {
        console.log(`  Answer: ${answer.substring(0, 100)}${answer.length > 100 ? "..." : ""}`);
      }
    } catch (error) {
      if (verbose) {
        console.error(`  Error: ${error}`);
      }
      results.push({ name: strategy.name, answer: "" });
    }
  }

  // Count votes (exact match)
  const votes: Record<string, number> = {};
  for (const result of results) {
    const normalized = result.answer.toLowerCase().trim();
    votes[normalized] = (votes[normalized] || 0) + 1;
  }

  // Find majority
  const sortedVotes = Object.entries(votes).sort((a, b) => b[1] - a[1]);
  const winner = sortedVotes[0];
  const consensus = winner && winner[1] > results.length / 2;

  if (verbose) {
    console.log(`\n📊 Voting results:`);
    for (const [answer, count] of sortedVotes) {
      console.log(
        `  ${answer.substring(0, 50)}${answer.length > 50 ? "..." : ""}: ${count} vote${count > 1 ? "s" : ""}`,
      );
    }
    console.log(`\n${consensus ? "✅ Consensus reached" : "⚠️ No clear consensus"}`);
  }

  return {
    answer: winner ? winner[0] : results[0]?.answer || "",
    consensus,
    votes,
    strategies: results,
  };
}
