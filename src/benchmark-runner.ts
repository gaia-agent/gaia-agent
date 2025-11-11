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

import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tableFromIPC } from "apache-arrow";
import { gaiaAgent } from "./index.js";
import type { GaiaBenchmarkResult, GaiaTask } from "./types.js";

interface BenchmarkConfig {
  dataset: "validation" | "test";
  level?: 1 | 2 | 3;
  limit?: number;
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
    const response = await fetch(datasetUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Read Parquet file using Apache Arrow
    const buffer = await response.arrayBuffer();
    const table = tableFromIPC(new Uint8Array(buffer));
    
    const tasks: GaiaTask[] = [];
    
    // Convert Arrow table to GaiaTask format
    for (let i = 0; i < table.numRows; i++) {
      const row = table.get(i);
      if (!row) continue;
      
      const task: GaiaTask = {
        id: row.task_id?.toString() || `task-${i}`,
        level: (Number(row.Level) as 1 | 2 | 3) || 1,
        question: row.Question?.toString() || "",
        answer: row.Final_answer?.toString(),
        files: row.file_name
          ? [
              {
                name: row.file_name.toString(),
                path: row.file_path?.toString() || "",
                type: row.file_name.toString().split(".").pop() || "unknown",
              },
            ]
          : undefined,
        metadata: row.Annotator_Metadata ? JSON.parse(row.Annotator_Metadata.toString()) : undefined,
      };
      
      tasks.push(task);
    }

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
    console.log(`\n📋 Task ${task.id} (Level ${task.level})`);
    console.log(`Question: ${task.question.slice(0, 100)}...`);
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
      console.log(`Agent answer: ${answer.slice(0, 100)}...`);
      console.log(`Expected: ${task.answer || "N/A"}`);
      console.log(`Result: ${correct ? "✅ CORRECT" : "❌ WRONG"}`);
      console.log(`Duration: ${durationMs}ms`);
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

  // Limit number of tasks if specified
  if (config.limit) {
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
