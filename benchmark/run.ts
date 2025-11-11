#!/usr/bin/env node

/**
 * GAIA Benchmark Runner
 *
 * Downloads GAIA benchmark dataset from Hugging Face and evaluates gaia-agent performance.
 *
 * Usage:
 *   pnpm run benchmark              # Run validation set (default)
 *   pnpm run benchmark --test       # Run test set
 *   pnpm run benchmark --level 1    # Filter by difficulty level (1-3)
 *   pnpm run benchmark --limit 10   # Limit number of tasks
 *   pnpm run benchmark --random     # Random single task
 *   pnpm run benchmark --stream     # Stream agent thinking in real-time
 *   pnpm run benchmark --verbose    # Detailed output
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
// Load .env BEFORE importing anything else
import { config } from "dotenv";

const envPath = join(process.cwd(), ".env");
if (existsSync(envPath)) {
  config({ path: envPath });
  console.log("✅ Loaded environment variables from .env file");
} else {
  console.warn(
    "⚠️  .env file not found. Please copy .env.example to .env and configure your API keys.",
  );
  console.warn("   Required: OPENAI_API_KEY");
  console.warn("   Optional: E2B_API_KEY, TAVILY_API_KEY, BROWSERUSE_API_KEY, etc.");
  console.warn("");
}

// Validate required environment variables
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ Error: OPENAI_API_KEY is required but not set.");
  console.error("   Please create a .env file (copy from .env.example) and set OPENAI_API_KEY.");
  process.exit(1);
}

// Now import other modules AFTER env is loaded
import { createGaiaAgent } from "../src/index.js";
import { downloadGaiaDataset } from "./downloader.js";
import { evaluateTask } from "./evaluator.js";
import { displaySummary, saveResults } from "./reporter.js";
import type { BenchmarkConfig, GaiaBenchmarkResult } from "./types.js";

/**
 * Run benchmark on all tasks
 */
async function runBenchmark(config: BenchmarkConfig): Promise<GaiaBenchmarkResult[]> {
  // Create agent AFTER env is loaded
  const gaiaAgent = createGaiaAgent();

  // Download dataset
  let tasks = await downloadGaiaDataset(config.dataset);

  // Filter by level if specified
  if (config.level) {
    tasks = tasks.filter((task) => task.level === config.level);
    console.log(`🔍 Filtered to ${tasks.length} tasks (Level ${config.level})`);
  }

  // Random mode: pick one random task
  if (config.random) {
    const randomIndex = Math.floor(Math.random() * tasks.length);
    const selectedTask = tasks[randomIndex];
    tasks = [selectedTask];
    console.log(`🎲 Randomly selected 1 task: ${selectedTask.id} (Level ${selectedTask.level})`);
    console.log(
      `   Question: ${selectedTask.question.substring(0, 100)}${selectedTask.question.length > 100 ? "..." : ""}`,
    );
  }
  // Limit number of tasks if specified
  else if (config.limit) {
    tasks = tasks.slice(0, config.limit);
    console.log(`🔍 Limited to ${config.limit} tasks`);
  }

  console.log(`\n🚀 Running benchmark on ${tasks.length} tasks...\n`);

  const results: GaiaBenchmarkResult[] = [];

  // Run tasks sequentially (to avoid rate limits)
  for (const [index, task] of tasks.entries()) {
    console.log(`[${index + 1}/${tasks.length}] Evaluating ${task.id}...`);

    const result = await evaluateTask(task, gaiaAgent, {
      verbose: config.verbose,
      stream: config.stream,
    });
    results.push(result);

    // Add small delay to avoid rate limits
    if (index < tasks.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Main entry point
 */
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const config: BenchmarkConfig = {
    dataset: args.includes("--test") ? "test" : "validation",
    level: args.includes("--level")
      ? (Number.parseInt(args[args.indexOf("--level") + 1], 10) as 1 | 2 | 3)
      : undefined,
    limit: args.includes("--limit")
      ? Number.parseInt(args[args.indexOf("--limit") + 1], 10)
      : undefined,
    random: args.includes("--random"),
    outputDir: args.includes("--output")
      ? args[args.indexOf("--output") + 1]
      : "./benchmark-results",
    verbose: args.includes("--verbose") || args.includes("-v"),
    stream: args.includes("--stream"),
  };

  console.log("🤖 GAIA Benchmark Runner");
  console.log("=".repeat(60));
  console.log(`Dataset:  ${config.dataset}`);
  console.log(`Level:    ${config.level || "all"}`);
  console.log(`Limit:    ${config.limit || "none"}`);
  console.log(`Random:   ${config.random ? "yes" : "no"}`);
  console.log(`Stream:   ${config.stream ? "yes" : "no"}`);
  console.log(`Output:   ${config.outputDir}`);
  console.log(`Verbose:  ${config.verbose}`);
  console.log(`${"=".repeat(60)}\n`);

  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ Error: OPENAI_API_KEY environment variable not set");
    console.error("   Please set it before running the benchmark:");
    console.error("   export OPENAI_API_KEY=sk-...");
    process.exit(1);
  }

  try {
    // Run benchmark
    const results = await runBenchmark(config);

    // Display summary
    displaySummary(results);

    // Save results
    await saveResults(results, config.outputDir, config.dataset);

    console.log("✅ Benchmark completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Benchmark failed:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
