/**
 * Result reporting utilities
 */

import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { GaiaBenchmarkResult, GaiaTask } from "./types.js";
import { updateWrongAnswers } from "./wrong-answers.js";

/**
 * Calculate and display summary statistics
 */
export function displaySummary(results: GaiaBenchmarkResult[]): void {
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
 * Save results to JSON file and update wrong answers collection
 */
export async function saveResults(
  results: GaiaBenchmarkResult[],
  tasks: GaiaTask[],
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

  // Update wrong answers collection
  await updateWrongAnswers(results, tasks, outputDir);
}
