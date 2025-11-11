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
      if (key !== 'toolName' && key !== 'toolCallId' && key !== 'type') {
        argsObj[key] = value;
      }
    }
    if (Object.keys(argsObj).length > 0) {
      args = argsObj;
    }
  }
  
  if (args && Object.keys(args).length > 0) {
    console.log(`     Arguments:`);
    for (const [key, value] of Object.entries(args)) {
      const valueStr = typeof value === 'string' && value.length > 100
        ? value.substring(0, 100) + '...'
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
  console.log(`\n  ✅ Tool Result ${resultIdx + 1}: ${result.toolName}`);
  console.log(`     Tool ID: ${result.toolCallId}`);
  
  // Try to extract result data - check multiple possible locations
  let resultData = result.result;
  
  // If not found, try to get all non-metadata properties
  if (!resultData) {
    // biome-ignore lint/suspicious/noExplicitAny: Dynamic result extraction
    const dataObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(result)) {
      if (key !== 'toolName' && key !== 'toolCallId' && key !== 'type') {
        dataObj[key] = value;
      }
    }
    if (Object.keys(dataObj).length > 0) {
      resultData = dataObj;
    }
  }
  
  if (resultData) {
    let resultStr: string;
    if (typeof resultData === 'string') {
      resultStr = resultData.length > 300
        ? resultData.substring(0, 300) + `... (${resultData.length} chars total)`
        : resultData;
    } else if (typeof resultData === 'object') {
      const jsonStr = JSON.stringify(resultData, null, 2);
      resultStr = jsonStr.length > 400
        ? jsonStr.substring(0, 400) + `...\n       (${jsonStr.length} chars total)`
        : jsonStr;
    } else {
      resultStr = String(resultData);
    }
    console.log(`     Result:\n${resultStr.split('\n').map(line => '       ' + line).join('\n')}`);
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
              const stepText = step.text.length > 150
                ? step.text.substring(0, 150) + '...'
                : step.text;
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
              const stepText = step.text.length > 150
                ? step.text.substring(0, 150) + '...'
                : step.text;
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
