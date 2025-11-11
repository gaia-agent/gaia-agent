/**
 * Task evaluator - runs individual GAIA tasks and evaluates results
 */

import type { GAIAAgent } from "../src/index.js";
import type { GaiaBenchmarkResult, GaiaTask } from "./types.js";

/**
 * Normalize answer for comparison (remove whitespace, lowercase, etc.)
 */
export function normalizeAnswer(answer: string): string {
  return answer
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "");
}

/**
 * Evaluate a single task
 */
export async function evaluateTask(
  task: GaiaTask,
  agent: GAIAAgent,
  options: {
    verbose?: boolean;
    stream?: boolean;
  } = {}
): Promise<GaiaBenchmarkResult> {
  const { verbose = false, stream = false } = options;
  const startTime = Date.now();

  if (verbose) {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`📋 Task ${task.id} (Level ${task.level})`);
    console.log(`${"=".repeat(80)}`);
    console.log(`Question: ${task.question}`);
    if (task.files && task.files.length > 0) {
      console.log(`Files: ${task.files.map((f) => f.name).join(", ")}`);
    }
    console.log(`${"=".repeat(80)}\n`);
  }

  try {
    let answer = "";

    if (stream) {
      // Stream mode: show real-time agent thinking process
      console.log("\n🤖 Agent thinking (streaming)...\n");

      const { textStream, steps } = await agent.stream({
        prompt: task.question,
      });

      // Stream text chunks to stdout
      for await (const chunk of textStream) {
        process.stdout.write(chunk);
        answer += chunk;
      }

      console.log("\n"); // New line after streaming

      const durationMs = Date.now() - startTime;

      // Wait for steps to complete
      const resolvedSteps = await steps;

      // Check correctness
      const correct = task.answer
        ? normalizeAnswer(answer).includes(normalizeAnswer(task.answer)) ||
          normalizeAnswer(task.answer).includes(normalizeAnswer(answer))
        : false;

      if (verbose) {
        console.log(`\n${"=".repeat(80)}`);
        console.log(`📊 Evaluation:`);
        console.log(`${"=".repeat(80)}`);
        console.log(`Expected Answer: ${task.answer || "N/A"}`);
        console.log(`Normalized Expected: ${task.answer ? normalizeAnswer(task.answer) : "N/A"}`);
        console.log(`Normalized Agent: ${normalizeAnswer(answer)}`);
        console.log(`Result: ${correct ? "✅ CORRECT" : "❌ INCORRECT"}`);
        console.log(`Duration: ${(durationMs / 1000).toFixed(2)}s (${durationMs}ms)`);
        console.log(`Steps: ${resolvedSteps?.length || 0}`);
        if (resolvedSteps && resolvedSteps.length > 0) {
          console.log(`\n🔧 Tool Calls:`);
          for (const [idx, step] of resolvedSteps.entries()) {
            if ("toolCalls" in step && step.toolCalls) {
              for (const toolCall of step.toolCalls) {
                console.log(`  ${idx + 1}. ${toolCall.toolName}`);
              }
            }
          }
        }
        console.log(`${"=".repeat(80)}\n`);
      }

      return {
        taskId: task.id,
        answer,
        expectedAnswer: task.answer,
        correct,
        durationMs,
        steps: resolvedSteps?.length || 0,
      };
    } else {
      // Normal mode: wait for complete response
      const result = await agent.generate({
        prompt: task.question,
      });

      const durationMs = Date.now() - startTime;
      answer = result.text || "";

      // Check correctness
      const correct = task.answer
        ? normalizeAnswer(answer).includes(normalizeAnswer(task.answer)) ||
          normalizeAnswer(task.answer).includes(normalizeAnswer(answer))
        : false;

      if (verbose) {
        console.log(`\n${"=".repeat(80)}`);
        console.log(`🤖 Agent Response:`);
        console.log(`${"=".repeat(80)}`);
        console.log(answer);
        console.log(`\n${"=".repeat(80)}`);
        console.log(`📊 Evaluation:`);
        console.log(`${"=".repeat(80)}`);
        console.log(`Expected Answer: ${task.answer || "N/A"}`);
        console.log(`Agent Answer: ${answer}`);
        console.log(`Normalized Expected: ${task.answer ? normalizeAnswer(task.answer) : "N/A"}`);
        console.log(`Normalized Agent: ${normalizeAnswer(answer)}`);
        console.log(`Result: ${correct ? "✅ CORRECT" : "❌ INCORRECT"}`);
        console.log(`Duration: ${(durationMs / 1000).toFixed(2)}s (${durationMs}ms)`);
        console.log(`Steps: ${result.steps?.length || 0}`);
        if (result.steps && result.steps.length > 0) {
          console.log(`\n🔧 Tool Calls:`);
          for (const [idx, step] of result.steps.entries()) {
            if ("toolCalls" in step && step.toolCalls) {
              for (const toolCall of step.toolCalls) {
                console.log(`  ${idx + 1}. ${toolCall.toolName}`);
              }
            }
          }
        }
        console.log(`${"=".repeat(80)}\n`);
      }

      return {
        taskId: task.id,
        answer,
        expectedAnswer: task.answer,
        correct,
        durationMs,
        steps: result.steps?.length || 0,
      };
    }
  } catch (error) {
    const durationMs = Date.now() - startTime;

    if (verbose) {
      console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      taskId: task.id,
      answer: "",
      expectedAnswer: task.answer,
      correct: false,
      durationMs,
      steps: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
