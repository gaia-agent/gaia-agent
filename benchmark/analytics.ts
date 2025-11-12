/**
 * Analysis tools for GAIA benchmark performance
 * Phase 2: Automated weakness detection, tool usage analytics, pattern recognition
 */

import type { GaiaBenchmarkResult, GaiaTask } from "./types.js";

/**
 * Categorize task based on question content and files
 */
export function categorizeTask(task: GaiaTask): string[] {
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
    /\d+\s*[+\-*/]\s*\d+/.test(questionLower)
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
 * Weakness detection - identify weak areas in performance
 */
export interface WeaknessAnalysis {
  category: string;
  totalTasks: number;
  correctTasks: number;
  accuracy: number;
  commonErrors: string[];
  failedTaskIds: string[];
  recommendation: string;
}

export function detectWeaknesses(
  results: GaiaBenchmarkResult[],
  tasks: GaiaTask[],
): WeaknessAnalysis[] {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const categoryStats = new Map<string, { total: number; correct: number; failed: string[] }>();

  // Analyze by category
  for (const result of results) {
    const task = taskMap.get(result.taskId);
    if (!task) continue;

    const categories = categorizeTask(task);
    for (const category of categories) {
      const stats = categoryStats.get(category) || { total: 0, correct: 0, failed: [] };
      stats.total++;
      if (result.correct) {
        stats.correct++;
      } else {
        stats.failed.push(result.taskId);
      }
      categoryStats.set(category, stats);
    }
  }

  // Generate weakness analysis
  const weaknesses: WeaknessAnalysis[] = [];
  for (const [category, stats] of categoryStats.entries()) {
    const accuracy = (stats.correct / stats.total) * 100;

    // Only flag as weakness if accuracy < 60%
    if (accuracy < 60) {
      const recommendation = getRecommendation(category, accuracy);
      weaknesses.push({
        category,
        totalTasks: stats.total,
        correctTasks: stats.correct,
        accuracy: Number.parseFloat(accuracy.toFixed(2)),
        commonErrors: [],
        failedTaskIds: stats.failed,
        recommendation,
      });
    }
  }

  return weaknesses.sort((a, b) => a.accuracy - b.accuracy);
}

function getRecommendation(category: string, accuracy: number): string {
  const recommendations: Record<string, string> = {
    files:
      "Consider using sandbox with appropriate libraries (pandas for CSV, PyPDF2 for PDF, PIL for images)",
    code: "Use sandbox with Python for calculations. Verify results with calculator tool.",
    search:
      "Cross-verify facts from multiple sources. Use searchGetContents for detailed information.",
    browser:
      "Wait for JavaScript to load. Take screenshots to verify. Try multiple selectors if first fails.",
    reasoning: "Break down into clear steps. Use memory to track multi-step reasoning.",
  };

  const baseRec = recommendations[category] || "Review task patterns and adjust strategy";

  if (accuracy < 30) {
    return `CRITICAL: ${baseRec}. Consider using ReAct planner with iterative mode.`;
  } else if (accuracy < 50) {
    return `MODERATE: ${baseRec}. Enable reflection for better verification.`;
  }
  return `MINOR: ${baseRec}`;
}

/**
 * Tool usage analytics - track which tools are used and their effectiveness
 */
export interface ToolAnalytics {
  toolName: string;
  usageCount: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  avgStepsWhenUsed: number;
  commonlyUsedWith: string[];
}

export function analyzeToolUsage(results: GaiaBenchmarkResult[]): ToolAnalytics[] {
  const toolStats = new Map<
    string,
    {
      count: number;
      success: number;
      failure: number;
      totalSteps: number;
      coOccurrence: Map<string, number>;
    }
  >();

  for (const result of results) {
    const tools = result.toolsUsed || [];
    const uniqueTools = [...new Set(tools)];

    for (const tool of uniqueTools) {
      const stats = toolStats.get(tool) || {
        count: 0,
        success: 0,
        failure: 0,
        totalSteps: 0,
        coOccurrence: new Map(),
      };

      stats.count++;
      if (result.correct) {
        stats.success++;
      } else {
        stats.failure++;
      }
      stats.totalSteps += result.steps;

      // Track co-occurrence
      for (const otherTool of uniqueTools) {
        if (otherTool !== tool) {
          stats.coOccurrence.set(otherTool, (stats.coOccurrence.get(otherTool) || 0) + 1);
        }
      }

      toolStats.set(tool, stats);
    }
  }

  // Convert to analytics
  const analytics: ToolAnalytics[] = [];
  for (const [toolName, stats] of toolStats.entries()) {
    const successRate = (stats.success / stats.count) * 100;
    const avgSteps = stats.totalSteps / stats.count;

    // Get top 3 commonly used together tools
    const commonlyUsedWith = Array.from(stats.coOccurrence.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((e) => e[0]);

    analytics.push({
      toolName,
      usageCount: stats.count,
      successCount: stats.success,
      failureCount: stats.failure,
      successRate: Number.parseFloat(successRate.toFixed(2)),
      avgStepsWhenUsed: Number.parseFloat(avgSteps.toFixed(1)),
      commonlyUsedWith,
    });
  }

  return analytics.sort((a, b) => b.usageCount - a.usageCount);
}

/**
 * Pattern recognition in failures - identify common patterns in failed tasks
 */
export interface FailurePattern {
  pattern: string;
  occurrences: number;
  affectedTasks: string[];
  description: string;
  suggestedFix: string;
}

export function recognizeFailurePatterns(
  results: GaiaBenchmarkResult[],
  tasks: GaiaTask[],
): FailurePattern[] {
  const failedResults = results.filter((r) => !r.correct && !r.error);
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const patterns: FailurePattern[] = [];

  // Pattern 1: No tools used
  const noToolsUsed = failedResults.filter((r) => !r.toolsUsed || r.toolsUsed.length === 0);
  if (noToolsUsed.length > 0) {
    patterns.push({
      pattern: "no_tools_used",
      occurrences: noToolsUsed.length,
      affectedTasks: noToolsUsed.map((r) => r.taskId),
      description: "Tasks failed without using any tools",
      suggestedFix:
        "Agent may need better prompting to use tools. Enable ReAct planner for structured reasoning.",
    });
  }

  // Pattern 2: Too many steps without success
  const tooManySteps = failedResults.filter((r) => r.steps > 10);
  if (tooManySteps.length > 0) {
    patterns.push({
      pattern: "excessive_steps",
      occurrences: tooManySteps.length,
      affectedTasks: tooManySteps.map((r) => r.taskId),
      description: "Tasks failed after using many steps (>10)",
      suggestedFix:
        "Agent may be stuck in loops. Consider using reflection to verify approach earlier.",
    });
  }

  // Pattern 3: File processing failures
  const fileFailures = failedResults.filter((r) => {
    const task = taskMap.get(r.taskId);
    return task && task.files && task.files.length > 0;
  });
  if (fileFailures.length > 0) {
    patterns.push({
      pattern: "file_processing_failure",
      occurrences: fileFailures.length,
      affectedTasks: fileFailures.map((r) => r.taskId),
      description: "Tasks with file attachments failed",
      suggestedFix:
        "Ensure sandbox is properly configured. Use appropriate libraries (pandas, PyPDF2, PIL).",
    });
  }

  // Pattern 4: Search without verification
  const searchNoVerification = failedResults.filter((r) => {
    const tools = r.toolsUsed || [];
    return tools.includes("search") && !tools.includes("searchGetContents");
  });
  if (searchNoVerification.length > 0) {
    patterns.push({
      pattern: "search_without_verification",
      occurrences: searchNoVerification.length,
      affectedTasks: searchNoVerification.map((r) => r.taskId),
      description: "Failed after search without content verification",
      suggestedFix:
        "Use searchGetContents to verify search results. Enable reflection for cross-checking.",
    });
  }

  // Pattern 5: Level-specific failures
  const level3Failures = failedResults.filter((r) => r.level === 3);
  if (level3Failures.length > 5) {
    patterns.push({
      pattern: "level_3_difficulty",
      occurrences: level3Failures.length,
      affectedTasks: level3Failures.map((r) => r.taskId),
      description: "High failure rate on Level 3 (hard) tasks",
      suggestedFix:
        "Use iterative mode with reflection. Break down into smaller steps. Use memory to track progress.",
    });
  }

  return patterns.sort((a, b) => b.occurrences - a.occurrences);
}

/**
 * Category-specific performance breakdown
 */
export interface CategoryPerformance {
  category: string;
  totalTasks: number;
  correctTasks: number;
  accuracy: number;
  avgSteps: number;
  avgDuration: number;
  commonTools: string[];
  level1Accuracy?: number;
  level2Accuracy?: number;
  level3Accuracy?: number;
}

export function analyzeCategoryPerformance(
  results: GaiaBenchmarkResult[],
  tasks: GaiaTask[],
): CategoryPerformance[] {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const categoryData = new Map<
    string,
    {
      total: number;
      correct: number;
      steps: number;
      duration: number;
      tools: Map<string, number>;
      byLevel: Map<number, { total: number; correct: number }>;
    }
  >();

  for (const result of results) {
    const task = taskMap.get(result.taskId);
    if (!task) continue;

    const categories = categorizeTask(task);
    for (const category of categories) {
      const data = categoryData.get(category) || {
        total: 0,
        correct: 0,
        steps: 0,
        duration: 0,
        tools: new Map(),
        byLevel: new Map(),
      };

      data.total++;
      if (result.correct) data.correct++;
      data.steps += result.steps;
      data.duration += result.durationMs;

      // Track tool usage
      const uniqueTools = [...new Set(result.toolsUsed || [])];
      for (const tool of uniqueTools) {
        data.tools.set(tool, (data.tools.get(tool) || 0) + 1);
      }

      // Track by level
      const levelStats = data.byLevel.get(result.level) || { total: 0, correct: 0 };
      levelStats.total++;
      if (result.correct) levelStats.correct++;
      data.byLevel.set(result.level, levelStats);

      categoryData.set(category, data);
    }
  }

  // Convert to performance metrics
  const performance: CategoryPerformance[] = [];
  for (const [category, data] of categoryData.entries()) {
    const accuracy = (data.correct / data.total) * 100;
    const avgSteps = data.steps / data.total;
    const avgDuration = data.duration / data.total;

    // Get top 3 commonly used tools
    const commonTools = Array.from(data.tools.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((e) => e[0]);

    // Calculate level-specific accuracy
    const level1Stats = data.byLevel.get(1);
    const level2Stats = data.byLevel.get(2);
    const level3Stats = data.byLevel.get(3);

    performance.push({
      category,
      totalTasks: data.total,
      correctTasks: data.correct,
      accuracy: Number.parseFloat(accuracy.toFixed(2)),
      avgSteps: Number.parseFloat(avgSteps.toFixed(1)),
      avgDuration: Number.parseFloat(avgDuration.toFixed(0)),
      commonTools,
      level1Accuracy: level1Stats
        ? Number.parseFloat(((level1Stats.correct / level1Stats.total) * 100).toFixed(2))
        : undefined,
      level2Accuracy: level2Stats
        ? Number.parseFloat(((level2Stats.correct / level2Stats.total) * 100).toFixed(2))
        : undefined,
      level3Accuracy: level3Stats
        ? Number.parseFloat(((level3Stats.correct / level3Stats.total) * 100).toFixed(2))
        : undefined,
    });
  }

  return performance.sort((a, b) => b.totalTasks - a.totalTasks);
}

/**
 * Generate comprehensive analysis report
 */
export interface AnalysisReport {
  summary: {
    totalTasks: number;
    correct: number;
    accuracy: number;
    avgSteps: number;
    avgDuration: number;
  };
  weaknesses: WeaknessAnalysis[];
  toolAnalytics: ToolAnalytics[];
  failurePatterns: FailurePattern[];
  categoryPerformance: CategoryPerformance[];
  recommendations: string[];
}

export function generateAnalysisReport(
  results: GaiaBenchmarkResult[],
  tasks: GaiaTask[],
): AnalysisReport {
  const total = results.length;
  const correct = results.filter((r) => r.correct).length;
  const accuracy = (correct / total) * 100;
  const avgSteps = results.reduce((sum, r) => sum + r.steps, 0) / total;
  const avgDuration = results.reduce((sum, r) => sum + r.durationMs, 0) / total;

  const weaknesses = detectWeaknesses(results, tasks);
  const toolAnalytics = analyzeToolUsage(results);
  const failurePatterns = recognizeFailurePatterns(results, tasks);
  const categoryPerformance = analyzeCategoryPerformance(results, tasks);

  // Generate recommendations
  const recommendations: string[] = [];

  // Overall accuracy recommendations
  if (accuracy < 50) {
    recommendations.push(
      "Overall accuracy is low (<50%). Enable ReAct planner with --react flag for structured reasoning.",
    );
  }
  if (accuracy < 70) {
    recommendations.push(
      "Consider using iterative mode (--iterative) to retry low-confidence answers.",
    );
  }

  // Weakness-based recommendations
  for (const weakness of weaknesses.slice(0, 3)) {
    recommendations.push(`${weakness.category}: ${weakness.recommendation}`);
  }

  // Pattern-based recommendations
  for (const pattern of failurePatterns.slice(0, 2)) {
    recommendations.push(`${pattern.pattern}: ${pattern.suggestedFix}`);
  }

  // Tool-based recommendations
  const lowPerformanceTools = toolAnalytics.filter((t) => t.successRate < 50 && t.usageCount > 3);
  if (lowPerformanceTools.length > 0) {
    recommendations.push(
      `Low-performing tools: ${lowPerformanceTools.map((t) => t.toolName).join(", ")}. Review tool usage patterns.`,
    );
  }

  return {
    summary: {
      totalTasks: total,
      correct,
      accuracy: Number.parseFloat(accuracy.toFixed(2)),
      avgSteps: Number.parseFloat(avgSteps.toFixed(1)),
      avgDuration: Number.parseFloat(avgDuration.toFixed(0)),
    },
    weaknesses,
    toolAnalytics,
    failurePatterns,
    categoryPerformance,
    recommendations,
  };
}

/**
 * Display analysis report in console
 */
export function displayAnalysisReport(report: AnalysisReport): void {
  console.log("\n" + "=".repeat(80));
  console.log("📊 COMPREHENSIVE ANALYSIS REPORT");
  console.log("=".repeat(80));

  // Summary
  console.log("\n📈 Summary:");
  console.log(`  Total Tasks: ${report.summary.totalTasks}`);
  console.log(`  Correct: ${report.summary.correct} (${report.summary.accuracy}%)`);
  console.log(`  Avg Steps: ${report.summary.avgSteps}`);
  console.log(`  Avg Duration: ${report.summary.avgDuration}ms`);

  // Weaknesses
  if (report.weaknesses.length > 0) {
    console.log("\n⚠️  Weaknesses Detected:");
    for (const weakness of report.weaknesses) {
      console.log(
        `  • ${weakness.category}: ${weakness.accuracy}% accuracy (${weakness.correctTasks}/${weakness.totalTasks})`,
      );
      console.log(`    → ${weakness.recommendation}`);
    }
  } else {
    console.log("\n✅ No significant weaknesses detected (all categories >60% accuracy)");
  }

  // Tool Analytics
  if (report.toolAnalytics.length > 0) {
    console.log("\n🔧 Tool Usage Analytics:");
    for (const tool of report.toolAnalytics.slice(0, 5)) {
      console.log(
        `  • ${tool.toolName}: ${tool.usageCount} uses, ${tool.successRate}% success rate`,
      );
      if (tool.commonlyUsedWith.length > 0) {
        console.log(`    Often used with: ${tool.commonlyUsedWith.join(", ")}`);
      }
    }
  }

  // Failure Patterns
  if (report.failurePatterns.length > 0) {
    console.log("\n🔍 Failure Patterns:");
    for (const pattern of report.failurePatterns) {
      console.log(`  • ${pattern.pattern}: ${pattern.occurrences} occurrences`);
      console.log(`    ${pattern.description}`);
      console.log(`    → ${pattern.suggestedFix}`);
    }
  } else {
    console.log("\n✅ No common failure patterns detected");
  }

  // Category Performance
  if (report.categoryPerformance.length > 0) {
    console.log("\n📋 Category Performance:");
    for (const cat of report.categoryPerformance) {
      console.log(`  • ${cat.category}: ${cat.accuracy}% (${cat.correctTasks}/${cat.totalTasks})`);
      console.log(`    Avg steps: ${cat.avgSteps}, Duration: ${cat.avgDuration}ms`);
      if (cat.commonTools.length > 0) {
        console.log(`    Common tools: ${cat.commonTools.join(", ")}`);
      }
      // Show level breakdown if available
      const levelInfo = [];
      if (cat.level1Accuracy !== undefined) levelInfo.push(`L1: ${cat.level1Accuracy}%`);
      if (cat.level2Accuracy !== undefined) levelInfo.push(`L2: ${cat.level2Accuracy}%`);
      if (cat.level3Accuracy !== undefined) levelInfo.push(`L3: ${cat.level3Accuracy}%`);
      if (levelInfo.length > 0) {
        console.log(`    By level: ${levelInfo.join(", ")}`);
      }
    }
  }

  // Recommendations
  if (report.recommendations.length > 0) {
    console.log("\n💡 Recommendations:");
    for (const rec of report.recommendations) {
      console.log(`  • ${rec}`);
    }
  }

  console.log("\n" + "=".repeat(80) + "\n");
}
