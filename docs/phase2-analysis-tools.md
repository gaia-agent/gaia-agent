# Phase 2: Analysis Tools - Documentation

## Overview

Phase 2 implements comprehensive analysis tools to help identify weaknesses, track tool usage, recognize failure patterns, and provide category-specific performance breakdowns. These analytics are automatically generated after each benchmark run.

## Features Implemented

### 1. Automated Weakness Detection

Identifies categories where performance is below 60% accuracy.

**Output Example:**
```
⚠️  Weaknesses Detected:
  • files: 45% accuracy (9/20)
    → Consider using sandbox with appropriate libraries (pandas for CSV, PyPDF2 for PDF, PIL for images)
  • browser: 52% accuracy (13/25)
    → MODERATE: Wait for JavaScript to load. Take screenshots to verify...
```

**API:**
```typescript
import { detectWeaknesses } from './benchmark/analytics.js';

const weaknesses = detectWeaknesses(results, tasks);
// Returns: WeaknessAnalysis[]
```

### 2. Tool Usage Analytics

Tracks which tools are used, their success rates, and co-occurrence patterns.

**Output Example:**
```
🔧 Tool Usage Analytics:
  • search: 45 uses, 67% success rate
    Often used with: searchGetContents, calculator, sandbox
  • sandbox: 32 uses, 81% success rate
    Often used with: calculator, search
  • calculator: 28 uses, 89% success rate
    Often used with: sandbox, search
```

**API:**
```typescript
import { analyzeToolUsage } from './benchmark/analytics.js';

const analytics = analyzeToolUsage(results);
// Returns: ToolAnalytics[]
```

### 3. Pattern Recognition in Failures

Identifies common patterns in failed tasks to help diagnose systematic issues.

**Detected Patterns:**
- `no_tools_used`: Tasks failed without using any tools
- `excessive_steps`: Tasks failed after using many steps (>10)
- `file_processing_failure`: Tasks with file attachments failed
- `search_without_verification`: Failed after search without content verification
- `level_3_difficulty`: High failure rate on Level 3 (hard) tasks

**Output Example:**
```
🔍 Failure Patterns:
  • search_without_verification: 8 occurrences
    Failed after search without content verification
    → Use searchGetContents to verify search results...
  • excessive_steps: 5 occurrences
    Tasks failed after using many steps (>10)
    → Agent may be stuck in loops. Consider using reflection...
```

**API:**
```typescript
import { recognizeFailurePatterns } from './benchmark/analytics.js';

const patterns = recognizeFailurePatterns(results, tasks);
// Returns: FailurePattern[]
```

### 4. Category-Specific Performance Breakdown

Detailed performance metrics by category (files, code, search, browser, reasoning).

**Output Example:**
```
📋 Category Performance:
  • search: 67% (30/45)
    Avg steps: 4.2, Duration: 8234ms
    Common tools: search, searchGetContents, calculator
    By level: L1: 85%, L2: 65%, L3: 42%
  • code: 78% (35/45)
    Avg steps: 3.8, Duration: 6521ms
    Common tools: calculator, sandbox, search
    By level: L1: 92%, L2: 76%, L3: 56%
```

**API:**
```typescript
import { analyzeCategoryPerformance } from './benchmark/analytics.js';

const performance = analyzeCategoryPerformance(results, tasks);
// Returns: CategoryPerformance[]
```

### 5. Comprehensive Analysis Report

Combines all analytics into a single comprehensive report with actionable recommendations.

**API:**
```typescript
import { generateAnalysisReport, displayAnalysisReport } from './benchmark/analytics.js';

const report = generateAnalysisReport(results, tasks);
displayAnalysisReport(report);
```

**Report Structure:**
```typescript
interface AnalysisReport {
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
```

## Integration with Benchmark Runner

The analysis tools are automatically integrated into the benchmark runner. After each benchmark run:

1. Basic summary is displayed (existing functionality)
2. **NEW:** Comprehensive analysis report is generated and displayed
3. **NEW:** Analysis report is saved to `benchmark-results/gaia-{dataset}-analysis.json`

**Example Usage:**
```bash
# Run benchmark - analysis is automatic
pnpm benchmark --limit 20

# Output:
# 📊 GAIA Benchmark Results (basic summary)
# 🔬 Generating comprehensive analysis...
# 📊 COMPREHENSIVE ANALYSIS REPORT (detailed)
#   - Summary
#   - Weaknesses Detected
#   - Tool Usage Analytics
#   - Failure Patterns
#   - Category Performance
#   - Recommendations
# 📊 Analysis report saved to: benchmark-results/gaia-validation-analysis.json
```

## Recommendations Engine

The system automatically generates actionable recommendations based on:

1. **Overall accuracy** - Suggests ReAct planner, iterative mode if accuracy < 70%
2. **Category weaknesses** - Specific guidance for weak categories
3. **Failure patterns** - Targeted fixes for common failure modes
4. **Tool performance** - Identifies low-performing tools

**Example Recommendations:**
```
💡 Recommendations:
  • Overall accuracy is low (<50%). Enable ReAct planner with --react flag...
  • files: Consider using sandbox with appropriate libraries...
  • search_without_verification: Use searchGetContents to verify search results...
  • Low-performing tools: browser, httpRequest. Review tool usage patterns.
```

## Saved Analysis Files

After benchmark completion, two files are saved:

1. **Results file**: `gaia-{dataset}-{timestamp}.json`
   - Contains all task results
   - Same as before (Phase 1)

2. **Analysis file** (NEW): `gaia-{dataset}-analysis.json`
   - Contains comprehensive analysis report
   - Includes all analytics and recommendations
   - Can be loaded for offline analysis

## Using Analysis Data

### Load and Analyze Offline

```typescript
import { readFile } from 'fs/promises';

const analysisData = JSON.parse(
  await readFile('benchmark-results/gaia-validation-analysis.json', 'utf-8')
);

console.log('Overall accuracy:', analysisData.summary.accuracy);
console.log('Weaknesses:', analysisData.weaknesses);
console.log('Recommendations:', analysisData.recommendations);
```

### Compare Multiple Runs

```typescript
const baseline = JSON.parse(await readFile('baseline-analysis.json', 'utf-8'));
const withReAct = JSON.parse(await readFile('react-analysis.json', 'utf-8'));

console.log('Improvement:', 
  withReAct.summary.accuracy - baseline.summary.accuracy
);
```

## Benefits

1. **Automated Diagnosis**: Identifies problems without manual analysis
2. **Actionable Insights**: Provides specific recommendations for improvement
3. **Performance Tracking**: Track metrics over time to measure improvements
4. **Tool Optimization**: Understand which tools work best and when
5. **Category Focus**: Prioritize improvements for weak categories

## Future Enhancements

Potential extensions for Phase 2:

- **Trend analysis**: Compare multiple benchmark runs over time
- **Visualization**: Generate charts and graphs from analytics data
- **Custom metrics**: Define custom success criteria
- **Export formats**: Support CSV, HTML reports
- **Real-time monitoring**: Live analytics during long benchmark runs

## API Reference

All analytics functions are exported from `benchmark/analytics.ts`:

```typescript
// Category classification
export function categorizeTask(task: GaiaTask): string[];

// Analytics functions
export function detectWeaknesses(results, tasks): WeaknessAnalysis[];
export function analyzeToolUsage(results): ToolAnalytics[];
export function recognizeFailurePatterns(results, tasks): FailurePattern[];
export function analyzeCategoryPerformance(results, tasks): CategoryPerformance[];

// Report generation
export function generateAnalysisReport(results, tasks): AnalysisReport;
export function displayAnalysisReport(report: AnalysisReport): void;
```

## Example Output

Complete example from a benchmark run:

```
📊 GAIA Benchmark Results
============================================================
Total tasks:     50
Correct:         32 (64.00%)
Incorrect:       16
Errors:          2
Avg duration:    7234ms
Avg steps:       4.8
============================================================

🔬 Generating comprehensive analysis...

================================================================================
📊 COMPREHENSIVE ANALYSIS REPORT
================================================================================

📈 Summary:
  Total Tasks: 50
  Correct: 32 (64.0%)
  Avg Steps: 4.8
  Avg Duration: 7234ms

⚠️  Weaknesses Detected:
  • files: 45.0% accuracy (9/20)
    → MODERATE: Consider using sandbox with appropriate libraries...
  • browser: 52.0% accuracy (13/25)
    → MODERATE: Wait for JavaScript to load...

🔧 Tool Usage Analytics:
  • search: 45 uses, 67.0% success rate
    Often used with: searchGetContents, calculator
  • sandbox: 32 uses, 81.0% success rate
    Often used with: calculator, search
  • calculator: 28 uses, 89.0% success rate
    Often used with: sandbox

🔍 Failure Patterns:
  • search_without_verification: 8 occurrences
    Failed after search without content verification
    → Use searchGetContents to verify search results...
  • file_processing_failure: 7 occurrences
    Tasks with file attachments failed
    → Ensure sandbox is properly configured...

📋 Category Performance:
  • search: 67.0% (30/45)
    Avg steps: 4.2, Duration: 8234ms
    Common tools: search, searchGetContents, calculator
    By level: L1: 85.0%, L2: 65.0%, L3: 42.0%
  • code: 78.0% (35/45)
    Avg steps: 3.8, Duration: 6521ms
    Common tools: calculator, sandbox, search
    By level: L1: 92.0%, L2: 76.0%, L3: 56.0%

💡 Recommendations:
  • Consider using iterative mode (--iterative) to retry low-confidence answers.
  • files: MODERATE: Consider using sandbox with appropriate libraries...
  • search_without_verification: Use searchGetContents to verify search results...

================================================================================

📊 Analysis report saved to: benchmark-results/gaia-validation-analysis.json
```

## Conclusion

Phase 2 Analysis Tools provide comprehensive, automated performance analysis to help identify and fix weaknesses in GAIA benchmark performance. The analytics are integrated seamlessly into the benchmark runner and provide actionable insights for continuous improvement.
