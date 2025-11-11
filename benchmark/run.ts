#!/usr/bin/env node

/**
 * GAIA Benchmark Runner
 *
 * Downloads GAIA benchmark dataset from Hugging Face and evaluates gaia-agent performance.
 *
 * Usage:
 *   pnpm run benchmark                    # Run validation set (default)
 *   pnpm run benchmark --test             # Run test set
 *   pnpm run benchmark --level 1          # Filter by difficulty level (1-3)
 *   pnpm run benchmark --category files   # Filter by capability category
 *   pnpm run benchmark --limit 10         # Limit number of tasks
 *   pnpm run benchmark --random           # Random single task
 *   pnpm run benchmark --stream           # Stream agent thinking in real-time
 *   pnpm run benchmark --verbose          # Detailed output
 *   pnpm run benchmark --resume           # Resume from last checkpoint (latest.json)
 *
 * Categories:
 *   files      - Tasks with file attachments (images, PDFs, etc.)
 *   code       - Tasks requiring code execution or mathematical calculations
 *   search     - Tasks requiring web search
 *   browser    - Tasks requiring browser automation
 *   reasoning  - Pure reasoning/logic tasks
 *
 * Examples:
 *   pnpm benchmark:files --limit 5 --verbose    # Test file handling capability
 *   pnpm benchmark:search --stream              # Test search with streaming
 *   pnpm benchmark:code --random --verbose      # Random code execution task
 *   pnpm benchmark --resume                     # Resume interrupted benchmark
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
import { createOpenAI } from "@ai-sdk/openai";
import { readFile } from "node:fs/promises";
import { createGaiaAgent } from "../src/index.js";
import type { GaiaTask, ProviderConfig } from "../src/types.js";
import { downloadGaiaDataset } from "./downloader.js";
import { evaluateTask } from "./evaluator.js";
import { displaySummary, saveResults } from "./reporter.js";
import type { BenchmarkConfig, GaiaBenchmarkResult } from "./types.js";

/**
 * Load checkpoint from latest.json if it exists
 */
async function loadCheckpoint(
  outputDir: string,
  dataset: string,
): Promise<{ results: GaiaBenchmarkResult[]; completedTaskIds: Set<string> } | null> {
  const checkpointPath = join(outputDir, `gaia-${dataset}-latest.json`);

  if (!existsSync(checkpointPath)) {
    return null;
  }

  try {
    const content = await readFile(checkpointPath, "utf-8");
    const checkpoint = JSON.parse(content);

    if (!checkpoint.results || !Array.isArray(checkpoint.results)) {
      return null;
    }

    const completedTaskIds = new Set<string>(
      checkpoint.results.map((r: GaiaBenchmarkResult) => r.taskId),
    );

    console.log(`📂 Found checkpoint with ${checkpoint.results.length} completed tasks`);
    console.log(`   File: ${checkpointPath}`);

    return {
      results: checkpoint.results,
      completedTaskIds,
    };
  } catch (error) {
    console.warn(`⚠️  Failed to load checkpoint: ${error}`);
    return null;
  }
}

/**
 * Get OpenAI model from environment or use default
 */
function getOpenAIModel() {
  const modelName = process.env.OPENAI_MODEL || "gpt-4o";
  return createOpenAI({
    baseURL: process.env.OPENAI_BASE_URL,
    apiKey: process.env.OPENAI_API_KEY,
  })(modelName);
}

/**
 * Get provider configuration from environment variables
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
    if (provider === "browseruse" || provider === "aws-bedrock-agentcore") {
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
 * Categorize task based on question content and files
 */
function categorizeTask(task: GaiaTask): string[] {
  const categories: string[] = [];
  const questionLower = task.question.toLowerCase();

  // Files: Has attachments
  if (task.files && task.files.length > 0) {
    categories.push("files");
  }

  // Code/Math: Contains code, calculation, or math keywords
  if (
    questionLower.includes("calculate") ||
    questionLower.includes("compute") ||
    questionLower.includes("code") ||
    questionLower.includes("program") ||
    questionLower.includes("equation") ||
    questionLower.includes("formula") ||
    questionLower.includes("algorithm") ||
    /\d+\s*[\+\-\*\/]\s*\d+/.test(questionLower)
  ) {
    categories.push("code");
  }

  // Search: Contains search, find, article, web, website, URL keywords
  if (
    questionLower.includes("search") ||
    questionLower.includes("find") ||
    questionLower.includes("article") ||
    questionLower.includes("website") ||
    questionLower.includes("url") ||
    questionLower.includes("arxiv") ||
    questionLower.includes("wikipedia") ||
    questionLower.includes("published") ||
    questionLower.includes("journal")
  ) {
    categories.push("search");
  }

  // Browser: Contains browser, navigate, click, screenshot keywords
  if (
    questionLower.includes("browser") ||
    questionLower.includes("navigate") ||
    questionLower.includes("click") ||
    questionLower.includes("screenshot") ||
    questionLower.includes("webpage") ||
    questionLower.includes("web page")
  ) {
    categories.push("browser");
  }

  // Reasoning: Pure logic/reasoning tasks (no other category)
  if (categories.length === 0) {
    categories.push("reasoning");
  }

  return categories;
}

/**
 * Run benchmark on all tasks
 */
async function runBenchmark(config: BenchmarkConfig): Promise<{
  results: GaiaBenchmarkResult[];
  tasks: GaiaTask[];
}> {
  // Get model and provider configuration from environment
  const model = getOpenAIModel();
  const providers = getProviderConfigFromEnv();

  // Create agent with custom model and providers
  const gaiaAgent = providers
    ? createGaiaAgent({ model, providers })
    : createGaiaAgent({ model });

  // Load checkpoint if resuming
  let checkpoint: { results: GaiaBenchmarkResult[]; completedTaskIds: Set<string> } | null = null;
  if (config.resume) {
    checkpoint = await loadCheckpoint(config.outputDir, config.dataset);
    if (!checkpoint) {
      console.log("📂 No checkpoint found, starting from beginning");
    }
  }

  // Download dataset
  let tasks = await downloadGaiaDataset(config.dataset);

  // Filter by level if specified
  if (config.level) {
    tasks = tasks.filter((task) => task.level === config.level);
    console.log(`🔍 Filtered to ${tasks.length} tasks (Level ${config.level})`);
  }

  // Filter by category if specified
  if (config.category) {
    tasks = tasks.filter((task) => {
      const categories = categorizeTask(task);
      return categories.includes(config.category as string);
    });
    console.log(`🔍 Filtered to ${tasks.length} tasks (Category: ${config.category})`);
  }

  // Filter out completed tasks if resuming
  if (checkpoint) {
    const originalCount = tasks.length;
    tasks = tasks.filter((task) => !checkpoint.completedTaskIds.has(task.id));
    const skipped = originalCount - tasks.length;
    console.log(`🔄 Resuming: Skipping ${skipped} completed tasks, ${tasks.length} remaining`);
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

  // Start with checkpoint results if resuming
  const results: GaiaBenchmarkResult[] = checkpoint ? [...checkpoint.results] : [];
  
  // Keep track of all tasks (for final save)
  const allTasks = await downloadGaiaDataset(config.dataset);

  // Run tasks sequentially (to avoid rate limits)
  for (const [index, task] of tasks.entries()) {
    const totalCompleted = checkpoint ? checkpoint.results.length + index + 1 : index + 1;
    const totalTasks = checkpoint
      ? checkpoint.results.length + tasks.length
      : tasks.length;

    console.log(`[${totalCompleted}/${totalTasks}] Evaluating ${task.id}...`);

    const result = await evaluateTask(task, gaiaAgent, {
      verbose: config.verbose,
      stream: config.stream,
    });
    results.push(result);

    // Save incremental results after each task (with all tasks for context)
    await saveResults(results, allTasks, config.outputDir, config.dataset, true);

    // Add small delay to avoid rate limits
    if (index < tasks.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return { results, tasks: allTasks };
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
    resume: args.includes("--resume"),
    category: args.includes("--category")
      ? (args[args.indexOf("--category") + 1] as
          | "files"
          | "code"
          | "search"
          | "browser"
          | "reasoning")
      : undefined,
  };

  // Get configuration info
  const modelName = process.env.OPENAI_MODEL || "gpt-4o";
  const providers = getProviderConfigFromEnv();
  const searchProvider = providers?.search || "tavily";
  const sandboxProvider = providers?.sandbox || "e2b";
  const browserProvider = providers?.browser || "steel";
  const memoryProvider = providers?.memory || "mem0";

  console.log("🤖 GAIA Benchmark Runner");
  console.log("=".repeat(60));
  console.log(`Model:    ${modelName}`);
  console.log(`Dataset:  ${config.dataset}`);
  console.log(`Level:    ${config.level || "all"}`);
  console.log(`Category: ${config.category || "all"}`);
  console.log(`Limit:    ${config.limit || "none"}`);
  console.log(`Random:   ${config.random ? "yes" : "no"}`);
  console.log(`Stream:   ${config.stream ? "yes" : "no"}`);
  console.log(`Resume:   ${config.resume ? "yes" : "no"}`);
  console.log(`Output:   ${config.outputDir}`);
  console.log(`Verbose:  ${config.verbose}`);
  console.log("=".repeat(60));
  console.log("Providers:");
  console.log(`  Search:  ${searchProvider}`);
  console.log(`  Sandbox: ${sandboxProvider}`);
  console.log(`  Browser: ${browserProvider}`);
  console.log(`  Memory:  ${memoryProvider} (optional)`);
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
    const { results, tasks } = await runBenchmark(config);

    // Display summary
    displaySummary(results);

    // Save results and update wrong answers
    await saveResults(results, tasks, config.outputDir, config.dataset);

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
