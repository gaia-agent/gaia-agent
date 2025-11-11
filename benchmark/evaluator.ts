/**
 * Task evaluator - runs individual GAIA tasks and evaluates results
 */

import type { CoreMessage } from "ai";
import type { GAIAAgent } from "../src/index.js";
import type { GaiaBenchmarkResult, GaiaTask, StepDetail } from "./types.js";

/**
 * Build prompt messages including file attachments
 */
function buildPromptMessages(task: GaiaTask): CoreMessage[] {
  const messages: CoreMessage[] = [];

  // If no files, just use simple text message
  if (!task.files || task.files.length === 0) {
    messages.push({
      role: "user",
      content: task.question,
    });
    return messages;
  }

  // Build content parts with files
  const contentParts: Array<
    { type: "text"; text: string } | { type: "image"; image: string | URL }
  > = [{ type: "text", text: task.question }];

  // Add file attachments
  for (const file of task.files) {
    if (file.data) {
      // Use image type for data URLs (AI SDK handles various file types via data URLs)
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

  return messages;
}

/**
 * Extract step details from AI SDK steps for saving to results
 */
// biome-ignore lint/suspicious/noExplicitAny: Dynamic step structure from AI SDK
function extractStepDetails(steps: any[]): StepDetail[] {
  return steps.map((step, stepIdx) => {
    const stepDetail: StepDetail = {
      stepIndex: stepIdx + 1,
    };

    // Extract tool calls
    if ("toolCalls" in step && step.toolCalls && step.toolCalls.length > 0) {
      // biome-ignore lint/suspicious/noExplicitAny: Dynamic AI SDK tool call structure
      stepDetail.toolCalls = step.toolCalls.map((toolCall: any) => {
        // Get arguments - filter out SDK metadata
        let args = toolCall.args || {};
        if (!toolCall.args) {
          // biome-ignore lint/suspicious/noExplicitAny: Dynamic argument extraction
          const argsObj: Record<string, any> = {};
          for (const [key, value] of Object.entries(toolCall)) {
            if (key !== "toolName" && key !== "toolCallId" && key !== "type") {
              argsObj[key] = value;
            }
          }
          args = argsObj;
        }

        // Filter out SDK internal metadata
        const filteredArgs: Record<string, unknown> = {};
        const metadataKeys = ["providerExecuted", "providerMetadata", "title"];
        for (const [key, value] of Object.entries(args)) {
          if (!metadataKeys.includes(key)) {
            filteredArgs[key] = value;
          }
        }

        return {
          toolName: toolCall.toolName,
          toolCallId: toolCall.toolCallId,
          args: filteredArgs,
        };
      });
    }

    // Extract tool results
    if ("toolResults" in step && step.toolResults && step.toolResults.length > 0) {
      // biome-ignore lint/suspicious/noExplicitAny: Dynamic AI SDK tool result structure
      stepDetail.toolResults = step.toolResults.map((result: any) => ({
        toolName: result.toolName,
        toolCallId: result.toolCallId,
        result: result.output,
      }));
    }

    // Extract text
    if ("text" in step && step.text) {
      stepDetail.text = step.text;
    }

    return stepDetail;
  });
}

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
 * Print detailed tool call information
 */
// biome-ignore lint/suspicious/noExplicitAny: Dynamic tool call structure from AI SDK
function printToolCall(toolCall: any, toolIdx: number) {
  console.log(`\n  🔹 Tool Call ${toolIdx + 1}: ${toolCall.toolName}`);
  console.log(`     Tool ID: ${toolCall.toolCallId}`);

  // Try to extract arguments - AI SDK may store them in different locations
  let args = toolCall.args;
  if (!args) {
    // Check all properties except metadata
    // biome-ignore lint/suspicious/noExplicitAny: Dynamic argument extraction
    const argsObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(toolCall)) {
      if (key !== "toolName" && key !== "toolCallId" && key !== "type") {
        argsObj[key] = value;
      }
    }
    if (Object.keys(argsObj).length > 0) {
      args = argsObj;
    }
  }

  if (args && Object.keys(args).length > 0) {
    console.log(`     Arguments:`);
    // Filter out SDK internal metadata
    const metadataKeys = ["providerExecuted", "providerMetadata", "title"];
    for (const [key, value] of Object.entries(args)) {
      // Skip internal SDK metadata
      if (metadataKeys.includes(key)) {
        continue;
      }

      const valueStr =
        typeof value === "string" && value.length > 100
          ? value.substring(0, 100) + "..."
          : JSON.stringify(value);
      console.log(`       ${key}: ${valueStr}`);
    }
  }
}

/**
 * Print detailed tool result information
 */
// biome-ignore lint/suspicious/noExplicitAny: Dynamic tool result structure from AI SDK
function printToolResult(result: any, resultIdx: number) {
  console.log(`\n  ✅ Tool Result ${resultIdx}: ${result.toolName}`);
  console.log(`     Tool ID: ${result.toolCallId}`);

  // Try to extract result data - check output property (AI SDK v6 stores results here)
  // biome-ignore lint/suspicious/noExplicitAny: Dynamic result extraction from AI SDK
  const resultData = (result as any).output;

  if (resultData) {
    let resultStr: string;
    if (typeof resultData === "string") {
      resultStr =
        resultData.length > 1000
          ? resultData.substring(0, 1000) + `... (${resultData.length} chars total)`
          : resultData;
    } else if (typeof resultData === "object") {
      const jsonStr = JSON.stringify(resultData, null, 2);
      resultStr =
        jsonStr.length > 2000
          ? jsonStr.substring(0, 2000) + `...\n       (${jsonStr.length} chars total)`
          : jsonStr;
    } else {
      resultStr = String(resultData);
    }
    console.log(
      `     Result:\n${resultStr
        .split("\n")
        .map((line) => "       " + line)
        .join("\n")}`,
    );
  }
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
  } = {},
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

    // Build messages with file attachments
    const messages = buildPromptMessages(task);

    if (stream) {
      // Stream mode: show real-time agent thinking process
      console.log("\n🤖 Agent thinking (streaming)...\n");

      const { textStream, steps } = await agent.stream({
        messages,
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
        console.log(`Agent Answer: ${answer}`);
        console.log(`\n--- Normalized Comparison ---`);
        console.log(`Expected: ${task.answer ? normalizeAnswer(task.answer) : "N/A"}`);
        console.log(`Agent:    ${normalizeAnswer(answer)}`);
        console.log(`Result: ${correct ? "✅ CORRECT" : "❌ INCORRECT"}`);
        console.log(`Duration: ${(durationMs / 1000).toFixed(2)}s (${durationMs}ms)`);
        console.log(`Steps: ${resolvedSteps?.length || 0}`);

        // Detailed tool calls with parameters and results
        if (resolvedSteps && resolvedSteps.length > 0) {
          console.log(`\n🔧 Tool Execution Details:`);
          console.log(`${"─".repeat(80)}`);

          for (const [stepIdx, step] of resolvedSteps.entries()) {
            console.log(`\n📍 Step ${stepIdx + 1}/${resolvedSteps.length}`);

            if ("toolCalls" in step && step.toolCalls && step.toolCalls.length > 0) {
              for (const [toolIdx, toolCall] of step.toolCalls.entries()) {
                printToolCall(toolCall, toolIdx);
              }
            }

            // Show tool results
            if ("toolResults" in step && step.toolResults && step.toolResults.length > 0) {
              for (const [resultIdx, result] of step.toolResults.entries()) {
                printToolResult(result, resultIdx);
              }
            }

            // Show text generated in this step
            if ("text" in step && step.text) {
              const stepText =
                step.text.length > 150 ? step.text.substring(0, 150) + "..." : step.text;
              console.log(`\n  💬 Agent Response: ${stepText}`);
            }
          }

          console.log(`\n${"─".repeat(80)}`);
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
        stepDetails: resolvedSteps ? extractStepDetails(resolvedSteps) : undefined,
      };
    } else {
      // Normal mode: wait for complete response
      const result = await agent.generate({
        messages,
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
        console.log(`\n--- Normalized Comparison ---`);
        console.log(`Expected: ${task.answer ? normalizeAnswer(task.answer) : "N/A"}`);
        console.log(`Agent:    ${normalizeAnswer(answer)}`);
        console.log(`Result: ${correct ? "✅ CORRECT" : "❌ INCORRECT"}`);
        console.log(`Duration: ${(durationMs / 1000).toFixed(2)}s (${durationMs}ms)`);
        console.log(`Steps: ${result.steps?.length || 0}`);

        // Detailed tool calls with parameters and results
        if (result.steps && result.steps.length > 0) {
          console.log(`\n🔧 Tool Execution Details:`);
          console.log(`${"─".repeat(80)}`);

          for (const [stepIdx, step] of result.steps.entries()) {
            console.log(`\n📍 Step ${stepIdx + 1}/${result.steps.length}`);

            if ("toolCalls" in step && step.toolCalls && step.toolCalls.length > 0) {
              for (const [toolIdx, toolCall] of step.toolCalls.entries()) {
                printToolCall(toolCall, toolIdx);
              }
            }

            // Show tool results
            if ("toolResults" in step && step.toolResults && step.toolResults.length > 0) {
              for (const [resultIdx, toolResult] of step.toolResults.entries()) {
                printToolResult(toolResult, resultIdx);
              }
            }

            // Show text generated in this step
            if ("text" in step && step.text) {
              const stepText =
                step.text.length > 150 ? step.text.substring(0, 150) + "..." : step.text;
              console.log(`\n  💬 Agent Response: ${stepText}`);
            }
          }

          console.log(`\n${"─".repeat(80)}`);
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
        stepDetails: result.steps ? extractStepDetails(result.steps) : undefined,
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
