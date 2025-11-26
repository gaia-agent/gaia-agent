/**
 * Result reporting utilities
 */

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { BenchmarkConfig, GaiaBenchmarkResult, GaiaTask } from "./types.js";
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
  incremental = false,
  config?: BenchmarkConfig,
): Promise<void> {
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }

  // Use fixed filename for incremental updates, timestamped for final save
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = incremental
    ? `gaia-${dataset}-latest.json`
    : `gaia-${dataset}-${timestamp}.json`;
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
      incremental,
    },
    results,
  };

  await writeFile(filepath, JSON.stringify(output, null, 2));

  if (!incremental) {
    console.log(`💾 Results saved to: ${filepath}`);
  } else {
    // Only show progress indicator for incremental saves
    process.stdout.write(`\r💾 Progress saved: ${results.length} tasks completed`);
  }

  // Update wrong answers collection (only on final save)
  if (!incremental) {
    await updateWrongAnswers(results, tasks, outputDir);
    // Update README.md and detailed results file
    await updateBenchmarkDocs(results, dataset, output.metadata, config);
  }
}

/**
 * Sanitize text for markdown table cells
 * Removes newlines, tabs, and pipes that would break table formatting
 */
function sanitizeMarkdownTableCell(text: string): string {
  return text
    .replace(/\n/g, " ") // Replace newlines with spaces
    .replace(/\r/g, "") // Remove carriage returns
    .replace(/\t/g, " ") // Replace tabs with spaces
    .replace(/\|/g, "\\|") // Escape pipe characters
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim();
}

/**
 * Get provider names from environment variables
 */
function getProviderNames(): { search: string; sandbox: string; browser: string } {
  const search = process.env.GAIA_AGENT_SEARCH_PROVIDER || "tavily";
  const sandbox = process.env.GAIA_AGENT_SANDBOX_PROVIDER || "e2b";
  const browser = process.env.GAIA_AGENT_BROWSER_PROVIDER || "steel";
  return { search, sandbox, browser };
}

/**
 * Determine benchmark command from config
 */
function getBenchmarkCommand(dataset: string, config?: BenchmarkConfig): string {
  if (!config) {
    return dataset === "test" ? "pnpm benchmark --test" : "pnpm benchmark";
  }

  if (config.level) {
    return `pnpm benchmark:level${config.level}`;
  }

  if (config.category) {
    return `pnpm benchmark:${config.category}`;
  }

  if (dataset === "test") {
    return "pnpm benchmark:test";
  }

  return "pnpm benchmark";
}

/**
 * Update README.md with benchmark results
 */
async function updateReadmeTable(
  command: string,
  metadata: {
    timestamp: string;
    total: number;
    correct: number;
    accuracy: number;
    model: string;
  },
  providers: { search: string; sandbox: string; browser: string },
  detailsLink: string,
): Promise<void> {
  const readmePath = join(process.cwd(), "README.md");

  if (!existsSync(readmePath)) {
    console.warn("⚠️  README.md not found, skipping update");
    return;
  }

  const readme = await readFile(readmePath, "utf-8");
  const timestamp = new Date(metadata.timestamp).toISOString().slice(0, 16).replace("T", " ");
  const results = `${metadata.correct}/${metadata.total}`;
  const accuracy = `${metadata.accuracy.toFixed(2)}%`;
  const providerText = `Search: ${providers.search}, Sandbox: ${providers.sandbox}, Browser: ${providers.browser}`;

  const newRow = `| \`${command}\` | ${timestamp} | ${results} | ${accuracy} | ${metadata.model} | ${providerText} | [View Details](${detailsLink}) |`;

  // Find the table in README
  const tableRegex = /(\| Benchmark Command \| Timestamp \| Results \| Accuracy \| Model \| Providers \| Details \|\n\|[^\n]+\|\n)([\s\S]*?)(\n\n|$)/;
  const match = readme.match(tableRegex);

  if (!match) {
    console.warn("⚠️  Benchmark results table not found in README.md");
    return;
  }

  const existingRows = match[2].split("\n").filter((row) => row.trim());
  const commandColumn = existingRows.findIndex((row) => row.includes(`\`${command}\``));

  let newTableRows: string;
  if (commandColumn !== -1) {
    // Update existing row
    existingRows[commandColumn] = newRow;
    newTableRows = existingRows.join("\n");
  } else {
    // Add new row
    newTableRows = [...existingRows, newRow].join("\n");
  }

  const updatedReadme = readme.replace(tableRegex, `$1${newTableRows}$3`);
  await writeFile(readmePath, updatedReadme);

  console.log("📝 Updated README.md benchmark table");
}

/**
 * Update detailed results file in docs/
 */
async function updateDetailedResults(
  command: string,
  results: GaiaBenchmarkResult[],
  metadata: {
    dataset: string;
    timestamp: string;
    total: number;
    correct: number;
    accuracy: number;
    model: string;
  },
  providers: { search: string; sandbox: string; browser: string },
): Promise<void> {
  const docsPath = join(process.cwd(), "docs", "benchmark-results.md");

  if (!existsSync(docsPath)) {
    console.warn("⚠️  docs/benchmark-results.md not found, skipping update");
    return;
  }

  let detailedResults = await readFile(docsPath, "utf-8");

  // Determine section ID from command
  const sectionId = getSectionIdFromCommand(command, metadata.dataset);

  // Generate table rows
  const tableRows = results
    .slice(0, 10) // Show first 10 results
    .map((result) => {
      // Sanitize question text to prevent markdown table breaking
      const questionSanitized = sanitizeMarkdownTableCell(result.question);
      const questionTruncated =
        questionSanitized.length > 100 ? questionSanitized.slice(0, 97) + "..." : questionSanitized;
      const correctIcon = result.correct ? "✅" : "❌";
      const toolsUsed = result.toolsUsed?.join(", ") || "-";
      return `| ${result.taskId} | ${questionTruncated} | ${result.level} | ${correctIcon} | ${result.steps} | ${result.durationMs.toLocaleString()} | ${toolsUsed} |`;
    })
    .join("\n");

  const timestamp = new Date(metadata.timestamp).toISOString().slice(0, 19).replace("T", " ");
  const providerText = `Search: ${providers.search}, Sandbox: ${providers.sandbox}, Browser: ${providers.browser}`;

  const newSection = `## ${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)}

**Command:** \`${command}\`  
**Dataset:** ${metadata.dataset}  
**Timestamp:** ${timestamp} UTC  
**Results:** ${metadata.correct}/${metadata.total} correct (${metadata.accuracy.toFixed(2)}%)  
**Model:** ${metadata.model}  
**Providers:** ${providerText}

| Task ID | Question | Level | Correct | Steps | Duration (ms) | Tools Used |
|---------|----------|-------|---------|-------|---------------|------------|
${tableRows}

*Note: This table shows a sample of results. Full results are available in the JSON files.*

---`;

  // Replace section or add if not exists
  const sectionRegex = new RegExp(`## ${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)}[\\s\\S]*?(?=\\n## |$)`, "i");

  if (sectionRegex.test(detailedResults)) {
    detailedResults = detailedResults.replace(sectionRegex, newSection);
  } else {
    // Find where to insert (before Table of Contents end or at end)
    const tocEnd = detailedResults.indexOf("---\n\n## ");
    if (tocEnd !== -1) {
      const insertPos = detailedResults.indexOf("---", tocEnd + 5);
      if (insertPos !== -1) {
        detailedResults = detailedResults.slice(0, insertPos + 4) + "\n\n" + newSection + "\n" + detailedResults.slice(insertPos + 4);
      }
    }
  }

  // Update "Last Updated" timestamp
  detailedResults = detailedResults.replace(
    /\*\*Last Updated:\*\* .*/,
    `**Last Updated:** ${timestamp} UTC`,
  );

  await writeFile(docsPath, detailedResults);
  console.log("📝 Updated docs/benchmark-results.md");
}

/**
 * Get section ID from command and dataset
 */
function getSectionIdFromCommand(command: string, dataset: string): string {
  if (command.includes("level1")) return "level-1";
  if (command.includes("level2")) return "level-2";
  if (command.includes("level3")) return "level-3";
  if (command.includes("files")) return "files";
  if (command.includes("code")) return "code";
  if (command.includes("search")) return "search";
  if (command.includes("browser")) return "browser";
  if (command.includes("reasoning")) return "reasoning";
  if (dataset === "test") return "test";
  return "validation";
}

/**
 * Update benchmark documentation (README + detailed results)
 */
async function updateBenchmarkDocs(
  results: GaiaBenchmarkResult[],
  dataset: string,
  metadata: {
    timestamp: string;
    total: number;
    correct: number;
    accuracy: number;
    model: string;
  },
  config?: BenchmarkConfig,
): Promise<void> {
  try {
    const command = getBenchmarkCommand(dataset, config);
    const providers = getProviderNames();
    const sectionId = getSectionIdFromCommand(command, dataset);
    const detailsLink = `./docs/benchmark-results.md#${sectionId}`;

    await updateReadmeTable(command, metadata, providers, detailsLink);
    await updateDetailedResults(command, results, { dataset, ...metadata }, providers);
  } catch (error) {
    console.error("❌ Error updating benchmark docs:", error);
  }
}
