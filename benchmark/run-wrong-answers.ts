#!/usr/bin/env node

/**
 * Wrong Answers Runner
 *
 * Runs benchmark only on tasks that previously failed (from wrong-answers.json)
 * This helps you retry and improve on previously failed tasks.
 *
 * Usage:
 *   pnpm run benchmark:wrong              # Run all wrong answers
 *   pnpm run benchmark:wrong --verbose    # Detailed output
 *   pnpm run benchmark:wrong --stream     # Stream agent thinking
 *   pnpm run benchmark:wrong --limit 5    # Limit to first 5 wrong answers
 *   pnpm run benchmark:wrong --level 1    # Only level 1 wrong answers
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";

const envPath = join(process.cwd(), ".env");
if (existsSync(envPath)) {
  config({ path: envPath });
  console.log("✅ Loaded environment variables from .env file");
}

if (!process.env.OPENAI_API_KEY) {
  console.error("❌ Error: OPENAI_API_KEY is required but not set.");
  process.exit(1);
}

import { createOpenAI } from "@ai-sdk/openai";
import { createGaiaAgent } from "../src/index.js";
import type { ProviderConfig } from "../src/types.js";
import { downloadGaiaDataset } from "./downloader.js";
import { evaluateTask } from "./evaluator.js";
import { displaySummary, saveResults } from "./reporter.js";
import type { GaiaBenchmarkResult } from "./types.js";
import { displayWrongAnswersSummary, loadWrongAnswers } from "./wrong-answers.js";

/**
 * Get OpenAI model from environment
 */
function getOpenAIModel() {
  const modelName = process.env.OPENAI_MODEL || "gpt-4o";
  return createOpenAI({
    baseURL: process.env.OPENAI_BASE_URL,
    apiKey: process.env.OPENAI_API_KEY,
  })(modelName);
}

/**
 * Get provider configuration from environment
 */
function getProviderConfigFromEnv(): ProviderConfig | undefined {
  const config: ProviderConfig = {};

  if (process.env.GAIA_AGENT_SEARCH_PROVIDER) {
    const provider = process.env.GAIA_AGENT_SEARCH_PROVIDER.toLowerCase();
    if (provider === "tavily" || provider === "exa") {
      config.search = provider;
    }
  }

  if (process.env.GAIA_AGENT_SANDBOX_PROVIDER) {
    const provider = process.env.GAIA_AGENT_SANDBOX_PROVIDER.toLowerCase();
    if (provider === "e2b" || provider === "sandock") {
      config.sandbox = provider;
    }
  }

  if (process.env.GAIA_AGENT_BROWSER_PROVIDER) {
    const provider = process.env.GAIA_AGENT_BROWSER_PROVIDER.toLowerCase();
    if (provider === "browseruse" || provider === "aws-bedrock-agentcore" || provider === "steel") {
      config.browser = provider;
    }
  }

  if (process.env.GAIA_AGENT_MEMORY_PROVIDER) {
    const provider = process.env.GAIA_AGENT_MEMORY_PROVIDER.toLowerCase();
    if (provider === "mem0" || provider === "agentcore") {
      config.memory = provider;
    }
  }

  return Object.keys(config).length > 0 ? config : undefined;
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const outputDir = args.includes("--output")
    ? args[args.indexOf("--output") + 1]
    : "./benchmark-results";
  const verbose = args.includes("--verbose") || args.includes("-v");
  const stream = args.includes("--stream");
  const limit = args.includes("--limit") ? Number.parseInt(args[args.indexOf("--limit") + 1], 10) : undefined;
  const levelFilter = args.includes("--level")
    ? (Number.parseInt(args[args.indexOf("--level") + 1], 10) as 1 | 2 | 3)
    : undefined;

  const modelName = process.env.OPENAI_MODEL || "gpt-4o";
  const providers = getProviderConfigFromEnv();

  console.log("📚 Wrong Answers Benchmark Runner");
  console.log("=".repeat(60));
  console.log(`Model:    ${modelName}`);
  console.log(`Output:   ${outputDir}`);
  console.log(`Verbose:  ${verbose}`);
  console.log(`Stream:   ${stream ? "yes" : "no"}`);
  console.log(`Limit:    ${limit || "none"}`);
  console.log(`Level:    ${levelFilter || "all"}`);
  console.log("=".repeat(60));
  console.log("Providers:");
  console.log(`  Search:  ${providers?.search || "tavily"}`);
  console.log(`  Sandbox: ${providers?.sandbox || "e2b"}`);
  console.log(`  Browser: ${providers?.browser || "steel"}`);
  console.log(`  Memory:  ${providers?.memory || "mem0"} (optional)`);
  console.log(`${"=".repeat(60)}\n`);

  // Load wrong answers collection
  const collection = await loadWrongAnswers(outputDir);
  const wrongTaskIds = Object.keys(collection.tasks);

  if (wrongTaskIds.length === 0) {
    console.log("🎉 No wrong answers found! All previous tasks passed.");
    console.log(
      "   Run regular benchmark to generate wrong answers: pnpm benchmark --limit 10",
    );
    process.exit(0);
  }

  // Display summary
  await displayWrongAnswersSummary(outputDir);

  // Download full dataset to get task details
  console.log("📥 Downloading validation dataset...");
  const allTasks = await downloadGaiaDataset("validation");

  // Filter to only wrong answer tasks
  let tasks = allTasks.filter((task) => wrongTaskIds.includes(task.id));

  // Apply level filter if specified
  if (levelFilter) {
    tasks = tasks.filter((task) => task.level === levelFilter);
    console.log(`🔍 Filtered to ${tasks.length} tasks (Level ${levelFilter})`);
  }

  // Apply limit if specified
  if (limit && limit < tasks.length) {
    tasks = tasks.slice(0, limit);
    console.log(`🔍 Limited to ${limit} tasks`);
  }

  console.log(`\n🚀 Running benchmark on ${tasks.length} wrong answers...\n`);

  // Create agent
  const model = getOpenAIModel();
  const gaiaAgent = providers
    ? createGaiaAgent({ model, providers })
    : createGaiaAgent({ model });

  const results: GaiaBenchmarkResult[] = [];

  // Run tasks sequentially
  for (const [index, task] of tasks.entries()) {
    const entry = collection.tasks[task.id];
    console.log(`[${index + 1}/${tasks.length}] Retrying ${task.id}...`);
    console.log(`   Previous attempts: ${entry.attemptCount}`);
    console.log(`   Last failed: ${new Date(entry.lastFailedAt).toLocaleString()}`);

    const result = await evaluateTask(task, gaiaAgent, {
      verbose,
      stream,
    });
    results.push(result);

    // Show immediate result
    if (result.correct) {
      console.log(`   ✅ CORRECT! Removed from wrong answers.\n`);
    } else {
      console.log(`   ❌ Still incorrect. Updated attempt count.\n`);
    }

    // Add delay to avoid rate limits
    if (index < tasks.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Display summary
  displaySummary(results);

  // Save results and update wrong answers
  await saveResults(results, tasks, outputDir, "validation-wrong-answers");

  // Show updated wrong answers summary
  console.log("\n");
  await displayWrongAnswersSummary(outputDir);

  console.log("✅ Wrong answers benchmark completed!");
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
