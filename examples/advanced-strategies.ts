/**
 * Advanced GAIA Benchmark Examples
 * Demonstrates all enhancement features: ReAct, reflection, confidence, multi-strategy
 */

import { createGaiaAgent, createTaskAwareInstructions, estimateConfidence } from "../src/index.js";
import type { GaiaTask } from "../src/types.js";

console.log("🚀 Advanced GAIA Benchmark Strategy Examples\n");
console.log("=".repeat(80));

// Sample task for testing
const sampleTask: GaiaTask = {
  id: "example-001",
  question: "What is the sum of 157 and 289?",
  answer: "446",
  level: 1,
};

/**
 * Example 1: Basic ReAct Planner Usage
 */
async function _example1_basicReAct() {
  console.log("\n📌 Example 1: Basic ReAct Planner");
  console.log("─".repeat(80));

  const agent = createGaiaAgent({
    useReActPlanner: true,
    maxSteps: 5,
  });

  const result = await agent.generate({
    messages: [{ role: "user", content: sampleTask.question }],
  });

  console.log(`Question: ${sampleTask.question}`);
  console.log(`Answer: ${result.text}`);
  console.log(`Steps taken: ${result.steps?.length || 0}`);
  console.log(`Expected: ${sampleTask.answer}`);
  console.log(`Match: ${result.text?.trim() === sampleTask.answer ? "✅ YES" : "❌ NO"}`);
}

/**
 * Example 2: Task-Aware Instructions
 */
async function _example2_taskAware() {
  console.log("\n📌 Example 2: Task-Aware Instructions");
  console.log("─".repeat(80));

  // Different question types
  const questions = [
    { q: "What year was Tesla founded?", type: "factual" },
    { q: "Calculate 123 × 456", type: "mathematical" },
    { q: "Visit example.com and extract the title", type: "browser" },
  ];

  for (const { q, type } of questions) {
    const instructions = createTaskAwareInstructions(q, false);
    console.log(`\n${type.toUpperCase()} Question: "${q}"`);
    console.log(`Detected patterns: ${instructions.includes("DETECTED:") ? "✅ Yes" : "❌ No"}`);

    // Check for specific guidance
    if (type === "factual" && instructions.includes("authoritative source")) {
      console.log("  ✓ Added factual question guidance");
    }
    if (type === "mathematical" && instructions.includes("calculator")) {
      console.log("  ✓ Added calculation guidance");
    }
    if (type === "browser" && instructions.includes("browser")) {
      console.log("  ✓ Added browser guidance");
    }
  }
}

/**
 * Example 3: Confidence Estimation
 */
async function _example3_confidence() {
  console.log("\n📌 Example 3: Confidence Estimation");
  console.log("─".repeat(80));

  const agent = createGaiaAgent({
    useReActPlanner: true,
    maxSteps: 5,
  });

  const result = await agent.generate({
    messages: [{ role: "user", content: sampleTask.question }],
  });

  // Extract tool names from steps
  const toolsUsed =
    result.steps?.flatMap((step) =>
      "toolCalls" in step && step.toolCalls
        ? step.toolCalls.map((tc: { toolName: string }) => tc.toolName)
        : [],
    ) || [];

  const confidence = estimateConfidence({
    stepsCount: result.steps?.length,
    toolsUsed,
    hasError: false,
    answerLength: result.text?.length,
  });

  console.log(`Question: ${sampleTask.question}`);
  console.log(`Answer: ${result.text}`);
  console.log(`Steps: ${result.steps?.length || 0}`);
  console.log(`Tools used: ${toolsUsed.join(", ") || "none"}`);
  console.log(`Estimated confidence: ${confidence}%`);

  if (confidence >= 80) {
    console.log("✅ High confidence - submit answer");
  } else if (confidence >= 60) {
    console.log("⚠️ Medium confidence - consider verification");
  } else {
    console.log("❌ Low confidence - retry recommended");
  }
}

console.log(`\n${"=".repeat(80)}`);
console.log("✅ Examples loaded! Run with: pnpm tsx examples/advanced-strategies.ts");
console.log("\n📚 Available examples:");
console.log("  1. Basic ReAct Planner");
console.log("  2. Task-Aware Instructions");
console.log("  3. Confidence Estimation");
console.log("\n💡 Note: Examples 4-6 (reflection, iterative, multi-strategy)");
console.log("   require API keys and will run in actual benchmarks");
