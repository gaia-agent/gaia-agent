/**
 * Reflection Evaluator - Task evaluator with reflection prompts
 * Implements Approach A (Prompt-Based Reflection) from reflection-guide.md
 */

import type { CoreMessage } from "ai";
import type { GAIAAgent } from "../src/index.js";
import type { GaiaBenchmarkResult, GaiaTask } from "./types.js";

/**
 * Check if reflection should be triggered based on context
 */
function shouldTriggerReflection(context: {
  stepCount: number;
  maxSteps: number;
  lastToolName?: string;
  toolHistory: string[];
  hasError?: boolean;
}): boolean {
  const { stepCount, maxSteps, lastToolName, toolHistory, hasError } = context;

  // Always reflect if there was an error
  if (hasError) {
    return true;
  }

  // Reflect at key milestones (every 3 steps, but not too early)
  if (stepCount > 2 && stepCount % 3 === 0) {
    return true;
  }

  // Reflect if approaching step limit (80% of max steps)
  if (stepCount >= maxSteps * 0.8) {
    return true;
  }

  // Reflect if same tool used consecutively 3+ times
  if (lastToolName && toolHistory.length >= 3) {
    const recent = toolHistory.slice(-3);
    if (recent.every((t) => t === lastToolName)) {
      return true;
    }
  }

  return false;
}

/**
 * Reflection prompt templates
 */
const REFLECTION_PROMPTS = {
  basic: `
🤔 **QUICK CHECK**

Take 10 seconds to assess your progress:

1. What did you just learn? (1 sentence)
2. Are you closer to the answer? (yes/no + why)
3. What's your IMMEDIATE next action? (be specific: which tool + what query)

Then DO IT - take that action right now!
`,

  detailed: `
🤔 **PROGRESS CHECK**

**What you learned:** Summarize the key information from the last tool.

**Progress status:**
- Moving toward answer? (yes/no)
- Confidence level? (low/medium/high)
- Any contradictions or gaps?

**Immediate next action:**
Choose ONE and execute immediately:
1. Search with different query
2. Verify with another tool
3. Calculate or process data
4. Provide final answer (if confident)

DO IT NOW - don't just plan!
`,

  quick: `
🤔 Quick check: What did you learn? Helpful? Next tool? → GO!
`,
};

/**
 * Build reflection prompt based on context
 */
function buildReflectionPrompt(
  stepContext: {
    stepNumber: number;
    totalSteps: number;
    lastToolUsed?: string;
    lastToolResult?: string;
  },
  reflectionStyle: "basic" | "detailed" | "quick" = "basic",
): string {
  const { stepNumber, totalSteps, lastToolUsed } = stepContext;

  let prompt = `\n${"=".repeat(60)}\n`;
  prompt += `📊 Step ${stepNumber} of ${totalSteps} completed\n`;
  if (lastToolUsed) {
    prompt += `🔧 Last tool used: ${lastToolUsed}\n`;
  }
  prompt += "=".repeat(60) + "\n";
  prompt += REFLECTION_PROMPTS[reflectionStyle];

  return prompt;
}

/**
 * Extract final answer from text
 * Improved to handle reflection content, lists, and numeric answers
 */
function extractFinalAnswer(text: string): string {
  // Remove reflection prompts and markdown formatting
  const cleanText = text
    .replace(/🤔.*?REFLECTION.*?\*\*/gi, "")
    .replace(/\*\*[^*]+\*\*/g, "")
    .replace(/^\s*\d+\.\s*/gm, "")
    .trim();

  // Priority 1: Look for explicit "final answer" or "answer is" patterns
  const explicitAnswerPatterns = [
    /(?:final answer|my final answer|the final answer)[:\s]+(.+?)(?:\.|$)/is,
    /(?:therefore|thus|so)[,\s]+(?:the answer is|it is)[:\s]+(.+?)(?:\.|$)/is,
  ];

  for (const pattern of explicitAnswerPatterns) {
    const match = cleanText.match(pattern);
    if (match?.[1]) {
      const answer = match[1].trim().replace(/[.,;!?]+$/, "");
      if (!answer.includes("?**") && !answer.toLowerCase().includes("does it help")) {
        return answer;
      }
    }
  }

  // Priority 2: For counting questions, look for numeric answers
  const isCountingQuestion = text.toLowerCase().includes("how many");
  if (isCountingQuestion) {
    // Try to find explicit count statements
    const countPatterns = [
      /(?:total|count|there are|there were|number is)[:\s]+(\d+)/i,
      /(\d+)\s+(?:countries|items|elements|people|states)/i,
    ];

    for (const pattern of countPatterns) {
      const match = cleanText.match(pattern);
      if (match?.[1]) {
        return match[1];
      }
    }

    // If no explicit count, try counting bullet points or list items
    const bulletPoints = cleanText.match(/^[-•*]\s+/gm);
    if (bulletPoints && bulletPoints.length >= 3) {
      // Check if this looks like an answer list (not reflection options)
      const hasReflectionKeywords =
        cleanText.toLowerCase().includes("next action") ||
        cleanText.toLowerCase().includes("continue current approach") ||
        cleanText.toLowerCase().includes("verify current findings");

      if (!hasReflectionKeywords) {
        return bulletPoints.length.toString();
      }
    }
  }

  // Priority 3: Look for other answer patterns
  const answerPatterns = [
    /(?:answer|conclusion)[:\s]+(.+?)(?:\.|$)/is,
    /(?:the term|the word)[:\s]+"([^"]+)"/i, // Capture quoted terms
    /(?:the result is|result)[:\s]+(.+?)(?:\.|$)/is,
  ];

  for (const pattern of answerPatterns) {
    const match = cleanText.match(pattern);
    if (match?.[1]) {
      const answer = match[1].trim().replace(/[.,;!?]+$/, "");
      if (!answer.includes("?**") && !answer.toLowerCase().includes("does it help")) {
        return answer;
      }
    }
  }

  // Priority 4: Get last substantial non-question, non-reflection line
  const lines = cleanText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 10 && !l.startsWith("□") && !l.includes("?**"));

  if (lines.length > 0) {
    // Prefer lines that don't look like reflection content
    const nonReflectionLines = lines.filter(
      (l) =>
        !l.toLowerCase().includes("next action") &&
        !l.toLowerCase().includes("confidence") &&
        !l.toLowerCase().includes("does this help") &&
        !l.toLowerCase().includes("my immediate next") &&
        !l.toLowerCase().includes("i will") &&
        !l.toLowerCase().includes("i need to"),
    );

    if (nonReflectionLines.length > 0) {
      const answer = nonReflectionLines[nonReflectionLines.length - 1];
      // Try to extract quoted term if present
      const quotedMatch = answer.match(/"([^"]+)"/);
      if (quotedMatch?.[1]) {
        return quotedMatch[1];
      }
      return answer.replace(/[.,;!?]+$/, "");
    }
    return lines[lines.length - 1].replace(/[.,;!?]+$/, "");
  }

  return cleanText.trim();
}

/**
 * Check if text contains final answer indicators
 */
function containsFinalAnswer(text: string): boolean {
  const indicators = [
    /final answer/i,
    /task complete/i,
    /conclusion:/i,
    /therefore,?\s+(?:the answer is|it is)/i,
    /in summary/i,
  ];

  return indicators.some((pattern) => pattern.test(text));
}

/**
 * Evaluate task with reflection prompts
 */
export async function evaluateTaskWithReflection(
  task: GaiaTask,
  agent: GAIAAgent,
  options: {
    verbose?: boolean;
    reflectionStyle?: "basic" | "detailed" | "quick";
    maxReflections?: number;
  } = {},
): Promise<GaiaBenchmarkResult> {
  const { verbose = false, reflectionStyle = "basic", maxReflections = 15 } = options;
  const startTime = Date.now();

  if (verbose) {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`📋 Task ${task.id} (Level ${task.level}) [WITH REFLECTION]`);
    console.log(`${"=".repeat(80)}`);
    console.log(`Question: ${task.question}`);
    if (task.files && task.files.length > 0) {
      console.log(`Files: ${task.files.map((f) => f.name).join(", ")}`);
    }
    console.log(`${"=".repeat(80)}\n`);
  }

  try {
    // Build initial message
    const messages: CoreMessage[] = [];
    if (!task.files || task.files.length === 0) {
      messages.push({
        role: "user",
        content: task.question,
      });
    } else {
      // Supported image formats by OpenAI
      const supportedImageTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"];

      const contentParts: Array<
        { type: "text"; text: string } | { type: "image"; image: string | URL }
      > = [{ type: "text", text: task.question }];

      for (const file of task.files) {
        // Handle image files
        if (file.data && supportedImageTypes.includes(file.type)) {
          contentParts.push({
            type: "image",
            image: file.data,
          });
        }
        // Handle non-image files (XLSX, PDF, etc.)
        else if (file.data) {
          contentParts.push({
            type: "text",
            text: `\n[Attached file: ${file.name} (${file.type})] - File content available for processing`,
          });
        }
      }

      messages.push({
        role: "user",
        content: contentParts,
      });
    }

    let stepCount = 0;
    const reflections: string[] = [];
    const toolHistory: string[] = [];
    let finalAnswer = "";

    // Reflection loop
    while (stepCount < maxReflections) {
      if (verbose) {
        console.log(`\n🔄 Step ${stepCount + 1}/${maxReflections}`);
      }

      // Execute one generation
      const result = await agent.generate({ messages });

      stepCount++;

      // Check if agent provided final answer
      if (containsFinalAnswer(result.text)) {
        finalAnswer = extractFinalAnswer(result.text);
        if (verbose) {
          console.log(`\n✅ Final answer detected: ${finalAnswer}`);
        }
        break;
      }

      // Check if tools were used
      const hasToolCalls =
        result.steps &&
        result.steps.length > 0 &&
        "toolCalls" in result.steps[result.steps.length - 1] &&
        // biome-ignore lint/suspicious/noExplicitAny: Dynamic AI SDK step structure
        (result.steps[result.steps.length - 1] as any).toolCalls?.length > 0;

      if (!hasToolCalls) {
        // No tools used, probably final answer
        finalAnswer = extractFinalAnswer(result.text);
        if (verbose) {
          console.log(`\n✅ No more tool calls, using response as final answer`);
        }
        break;
      }

      // Tools were used, get tool name and add to history
      // biome-ignore lint/suspicious/noExplicitAny: Dynamic AI SDK step structure
      const lastStep = result.steps[result.steps.length - 1] as any;
      const lastToolCall = lastStep.toolCalls?.[0];
      const lastToolName = lastToolCall?.toolName || "unknown";
      toolHistory.push(lastToolName);

      // Add assistant response to messages
      messages.push({
        role: "assistant",
        content: result.text,
      });

      // Decide if reflection should be triggered
      const needsReflection = shouldTriggerReflection({
        stepCount,
        maxSteps: maxReflections,
        lastToolName,
        toolHistory,
      });

      if (needsReflection) {
        // Inject reflection prompt
        const reflectionPrompt = buildReflectionPrompt(
          {
            stepNumber: stepCount,
            totalSteps: maxReflections,
            lastToolUsed: lastToolName,
          },
          reflectionStyle,
        );

        messages.push({
          role: "user",
          content: reflectionPrompt,
        });

        if (verbose) {
          console.log(`\n💭 Triggering reflection after ${lastToolName} (step ${stepCount})`);
        }

        // Get reflection response (which should include the next action)
        const reflectionResult = await agent.generate({ messages });
        reflections.push(reflectionResult.text);

        if (verbose) {
          console.log(`\n📝 Reflection:\n${reflectionResult.text.substring(0, 300)}...`);
        }

        // Check if reflection indicates completion with final answer
        if (containsFinalAnswer(reflectionResult.text)) {
          finalAnswer = extractFinalAnswer(reflectionResult.text);
          if (verbose) {
            console.log(`\n✅ Final answer in reflection: ${finalAnswer}`);
          }
          break;
        }

        // The reflection response should contain the next action (tool call or answer)
        // Add it to messages and continue the loop
        messages.push({
          role: "assistant",
          content: reflectionResult.text,
        });

        stepCount++;
      }
    }

    // If no final answer extracted, use last assistant message
    if (!finalAnswer) {
      finalAnswer = extractFinalAnswer(messages[messages.length - 1]?.content?.toString() || "");
    }

    const duration = Date.now() - startTime;

    // Check correctness
    const normalizedAnswer = finalAnswer.toLowerCase().trim();
    const normalizedExpected = task.answer?.toLowerCase().trim() || "";
    const correct = normalizedAnswer === normalizedExpected;

    if (verbose) {
      console.log(`\n${"=".repeat(80)}`);
      console.log("📊 Reflection Summary:");
      console.log(`   Total Reflections: ${reflections.length}`);
      console.log(`   Total Steps: ${stepCount}`);
      console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);
      console.log(`   Answer: ${finalAnswer}`);
      console.log(`   Expected: ${task.answer || "N/A"}`);
      console.log(`   Correct: ${correct ? "✅" : "❌"}`);
      console.log(`${"=".repeat(80)}\n`);
    }

    return {
      taskId: task.id,
      question: task.question,
      level: task.level,
      files: task.files?.map((f) => f.name),
      answer: finalAnswer,
      expectedAnswer: task.answer,
      correct,
      durationMs: duration,
      steps: stepCount,
      toolsUsed: [],
      summary: {
        totalToolCalls: 0,
        uniqueTools: [],
        hadError: false,
      },
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (verbose) {
      console.error(`\n❌ Error evaluating task ${task.id}:`, errorMessage);
    }

    return {
      taskId: task.id,
      question: task.question,
      level: task.level,
      files: task.files?.map((f) => f.name),
      answer: "",
      expectedAnswer: task.answer,
      correct: false,
      durationMs: duration,
      steps: 0,
      error: errorMessage,
      toolsUsed: [],
      summary: {
        totalToolCalls: 0,
        uniqueTools: [],
        hadError: true,
      },
    };
  }
}
