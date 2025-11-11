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
 */

// Load .env BEFORE importing anything else
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { join } from "node:path";

const envPath = join(process.cwd(), ".env");
if (existsSync(envPath)) {
  config({ path: envPath });
  console.log("✅ Loaded environment variables from .env file");
} else {
  console.warn("⚠️  .env file not found. Please copy .env.example to .env and configure your API keys.");
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
import { mkdir, writeFile } from "node:fs/promises";
import { parquetRead } from "hyparquet";
import { createGaiaAgent } from "./index.js";
import type { GaiaBenchmarkResult, GaiaTask } from "./types.js";

// Create agent AFTER env is loaded
const gaiaAgent = createGaiaAgent();

interface BenchmarkConfig {
  dataset: "validation" | "test";
  level?: 1 | 2 | 3;
  limit?: number;
  random?: boolean;
  outputDir: string;
  verbose: boolean;
}

interface HuggingFaceTask {
  task_id: string;
  Level: number;
  Question: string;
  Final_answer?: string;
  file_name?: string;
  file_path?: string;
  Annotator_Metadata?: Record<string, unknown>;
}

/**
 * Download GAIA dataset from Hugging Face
 * Updated to use Parquet format (metadata.parquet instead of .jsonl)
 */
async function downloadGaiaDataset(dataset: "validation" | "test"): Promise<GaiaTask[]> {
  const datasetUrl =
    dataset === "validation"
      ? "https://huggingface.co/datasets/gaia-benchmark/GAIA/resolve/main/2023/validation/metadata.parquet"
      : "https://huggingface.co/datasets/gaia-benchmark/GAIA/resolve/main/2023/test/metadata.parquet";

  console.log(`📥 Downloading ${dataset} dataset from Hugging Face (Parquet format)...`);

  try {
    // Add Hugging Face token if available for authentication
    const headers: Record<string, string> = {};
    if (process.env.HUGGINGFACE_TOKEN) {
      headers.Authorization = `Bearer ${process.env.HUGGINGFACE_TOKEN}`;
    }

    const response = await fetch(datasetUrl, { headers });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(
          `HTTP 401: Unauthorized - GAIA dataset requires Hugging Face authentication.\n` +
            `Please set HUGGINGFACE_TOKEN in your .env file.\n` +
            `Get your token from: https://huggingface.co/settings/tokens`
        );
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Read Parquet file using hyparquet
    const arrayBuffer = await response.arrayBuffer();
    
    let tasks: GaiaTask[] = [];

    // Read Parquet file with hyparquet (rowFormat: 'object' returns rows as objects)
    await parquetRead({
      file: arrayBuffer,
      rowFormat: "object",
      onComplete: (data: unknown[]) => {
        tasks = data.map((row: unknown): GaiaTask => {
          const r = row as Record<string, unknown>;
          const levelNum = Number.parseInt(String(r.Level), 10) || 1;
          const level = (levelNum >= 1 && levelNum <= 3 ? levelNum : 1) as 1 | 2 | 3;
          
          return {
            id: String(r.task_id || ""),
            question: String(r.Question || ""),
            level,
            answer: String(r.Final_answer || ""),
            files: r.file_name
              ? [
                  {
                    name: String(r.file_name),
                    path: String(r.file_path || ""),
                    type: "unknown",
                  },
                ]
              : undefined,
            metadata: (r.Annotator_Metadata as Record<string, unknown>) || {},
          };
        });
      },
    });

    console.log(`✅ Downloaded ${tasks.length} tasks`);
    return tasks;
  } catch (error) {
    console.error("❌ Failed to download dataset:", error);
    console.error("   Note: GAIA benchmark now uses Parquet format instead of JSONL");
    throw error;
  }
}

/**
 * Normalize answer for comparison (remove whitespace, lowercase, etc.)
 */
function normalizeAnswer(answer: string): string {
  return answer
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "");
}

/**
 * Evaluate a single task
 */
async function evaluateTask(task: GaiaTask, verbose: boolean): Promise<GaiaBenchmarkResult> {
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
    const result = await gaiaAgent.generate({
      prompt: task.question,
    });

    const durationMs = Date.now() - startTime;
    const answer = result.text || "";

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

/**
 * Run benchmark on all tasks
 */
async function runBenchmark(config: BenchmarkConfig): Promise<GaiaBenchmarkResult[]> {
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
    console.log(`   Question: ${selectedTask.question.substring(0, 100)}${selectedTask.question.length > 100 ? "..." : ""}`);
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

    const result = await evaluateTask(task, config.verbose);
    results.push(result);

    // Add small delay to avoid rate limits
    if (index < tasks.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Calculate and display summary statistics
 */
function displaySummary(results: GaiaBenchmarkResult[]): void {
  const total = results.length;
  const correct = results.filter((r) => r.correct).length;
  const errors = results.filter((r) => r.error).length;
  const accuracy = total > 0 ? (correct / total) * 100 : 0;

  const avgDuration = results.reduce((sum, r) => sum + r.durationMs, 0) / total || 0;
  const avgSteps = results.reduce((sum, r) => sum + r.steps, 0) / total || 0;

  console.log(`\n${"=".repeat(60)}`);
  console.log("📊 GAIA Benchmark Results");
  console.log("=".repeat(60));
  console.log(`Total tasks:     ${total}`);
  console.log(`Correct:         ${correct} (${accuracy.toFixed(2)}%)`);
  console.log(`Incorrect:       ${total - correct - errors}`);
  console.log(`Errors:          ${errors}`);
  console.log(`Avg duration:    ${avgDuration.toFixed(0)}ms`);
  console.log(`Avg steps:       ${avgSteps.toFixed(1)}`);
  console.log(`${"=".repeat(60)}\n`);
}

/**
 * Save results to JSON file
 */
async function saveResults(
  results: GaiaBenchmarkResult[],
  outputDir: string,
  dataset: string,
): Promise<void> {
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `gaia-${dataset}-${timestamp}.json`;
  const filepath = join(outputDir, filename);

  const total = results.length;
  const correct = results.filter((r) => r.correct).length;
  const accuracy = total > 0 ? (correct / total) * 100 : 0;

  const output = {
    metadata: {
      dataset,
      timestamp: new Date().toISOString(),
      total,
      correct,
      accuracy: Number.parseFloat(accuracy.toFixed(2)),
      agent: "gaia-agent",
      model: process.env.OPENAI_MODEL || "gpt-4o",
    },
    results,
  };

  await writeFile(filepath, JSON.stringify(output, null, 2));
  console.log(`💾 Results saved to: ${filepath}`);
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
  };

  console.log("🤖 GAIA Benchmark Runner");
  console.log("=".repeat(60));
  console.log(`Dataset:  ${config.dataset}`);
  console.log(`Level:    ${config.level || "all"}`);
  console.log(`Limit:    ${config.limit || "none"}`);
  console.log(`Random:   ${config.random ? "yes" : "no"}`);
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
