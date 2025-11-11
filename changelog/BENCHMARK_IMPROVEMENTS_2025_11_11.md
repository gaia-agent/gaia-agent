# Benchmark Improvements - Stream Mode & Incremental Saving

Date: November 11, 2025

## Overview

Enhanced benchmark runner with real-time tool call visibility, incremental result saving, and enriched wrong answers tracking.

## Changes

### 1️⃣ Real-time Tool Call Display in Stream Mode

**Problem:** When using `--stream` flag, only the final text output was streamed. Tool executions were hidden until the end.

**Solution:** Added real-time tool call monitoring that polls and displays tool executions as they happen.

**Implementation:**
- `benchmark/evaluator.ts`: Added step polling mechanism in stream mode
- Shows tool name as soon as it's called
- Shows tool result preview when completed
- Updates every 500ms while streaming

**Example Output:**
```bash
🤖 Agent thinking (streaming)...

Wojciech.
🔧 Tool Execution (Step 1):
  └─ search
  ✓ search: [object]

🔧 Tool Execution (Step 2):
  └─ search
  ✓ search: [object]
```

**Benefits:**
- ✅ See what tools the agent is using in real-time
- ✅ Better understanding of agent's reasoning process
- ✅ Early detection of wrong tool usage
- ✅ More engaging user experience

---

### 2️⃣ Incremental Result Saving

**Problem:** Results were only saved after ALL tasks completed. If the benchmark crashed or was interrupted, all progress was lost.

**Solution:** Save results after each task to a "latest" file, with final timestamped file at the end.

**Implementation:**
- `benchmark/run.ts`: Call `saveResults()` after each task with `incremental=true`
- `benchmark/reporter.ts`: Added `incremental` parameter to control file naming and output
- Incremental saves use `gaia-validation-latest.json` (overwritten each task)
- Final save uses timestamped filename `gaia-validation-2025-11-11T15-38-06-951Z.json`

**File Behavior:**
```
During run:
  benchmark-results/gaia-validation-latest.json  (updated after each task)

After completion:
  benchmark-results/gaia-validation-2025-11-11T15-38-06-951Z.json  (final timestamped)
  benchmark-results/gaia-validation-latest.json  (kept for reference)
```

**Progress Indicator:**
```
💾 Progress saved: 1 tasks completed
💾 Progress saved: 2 tasks completed
💾 Progress saved: 3 tasks completed
...
```

**Benefits:**
- ✅ No progress lost on crashes or interruptions
- ✅ Can monitor progress by watching `latest.json` file
- ✅ Real-time analysis of results while benchmark runs
- ✅ Minimal console noise (single line updates)

---

### 3️⃣ Enhanced Wrong Answers Collection

**Problem:** `wrong-answers.json` only tracked basic info (question, answer). No visibility into HOW the agent failed.

**Solution:** Added `steps`, `toolsUsed`, and `summary` fields to wrong answer entries.

**Implementation:**
- `benchmark/wrong-answers.ts`: Updated `WrongAnswerEntry` interface
- Added fields: `steps`, `toolsUsed`, `summary`
- Automatically populated from `GaiaBenchmarkResult`

**New Fields:**
```typescript
interface WrongAnswerEntry {
  taskId: string;
  question: string;
  expectedAnswer?: string;
  agentAnswer: string;
  level: number;
  firstFailedAt: string;
  lastFailedAt: string;
  attemptCount: number;
  error?: string;
  
  // ✨ NEW
  steps?: number;
  toolsUsed?: string[];
  summary?: {
    totalToolCalls: number;
    uniqueTools: string[];
    hadError: boolean;
  };
}
```

**Example Entry:**
```json
{
  "taskId": "2dfc4c37-fec1-4518-84a7-10095d30ad75",
  "question": "According to Box Office Mojo...",
  "expectedAnswer": "5",
  "agentAnswer": "6",
  "level": 2,
  "attemptCount": 1,
  "steps": 2,
  "toolsUsed": ["browser", "browser"],
  "summary": {
    "totalToolCalls": 2,
    "uniqueTools": ["browser"],
    "hadError": false
  }
}
```

**Benefits:**
- ✅ Understand which tools were used in failed attempts
- ✅ Identify if agent used wrong tools
- ✅ See execution complexity (steps, tool calls)
- ✅ Better debugging and analysis
- ✅ Track tool usage patterns in failures

---

## Usage Examples

### Stream Mode with Real-time Tool Display
```bash
pnpm benchmark --random --stream --verbose
# Shows:
# - Real-time text generation
# - Tool calls as they happen
# - Tool results as they complete
# - Detailed execution summary
```

### Monitor Progress During Long Runs
```bash
# Terminal 1: Run benchmark
pnpm benchmark --limit 50

# Terminal 2: Watch progress
watch -n 1 'cat benchmark-results/gaia-validation-latest.json | jq ".metadata"'
# Shows real-time count of completed tasks
```

### Analyze Wrong Answers by Tool Usage
```bash
# Find all failures that used browser tool
cat benchmark-results/wrong-answers.json | jq '.tasks | 
  to_entries | 
  map(select(.value.toolsUsed | contains(["browser"]))) |
  length'

# Show tool usage summary for all wrong answers
cat benchmark-results/wrong-answers.json | jq '.tasks | 
  to_entries | 
  map({
    id: .value.taskId,
    tools: .value.toolsUsed,
    steps: .value.steps
  })'
```

---

## File Changes Summary

### Modified Files (3)

1. **benchmark/run.ts**
   - Added incremental save call after each task
   - Pass `incremental=true` flag to `saveResults()`

2. **benchmark/reporter.ts**
   - Added `incremental` parameter to `saveResults()`
   - Use `latest.json` filename for incremental saves
   - Show progress indicator instead of full save message
   - Skip wrong answers update for incremental saves

3. **benchmark/evaluator.ts**
   - Added step polling mechanism in stream mode
   - Real-time tool call display
   - Check for new steps every 500ms
   - Show tool names and result previews

4. **benchmark/wrong-answers.ts**
   - Enhanced `WrongAnswerEntry` interface
   - Added `steps`, `toolsUsed`, `summary` fields
   - Populate new fields from benchmark results

---

## Validation

### TypeScript Compilation
```bash
✅ pnpm typecheck - No errors
```

### Actual Run Test
```bash
✅ pnpm benchmark --random --stream --verbose
   - Tool calls appear in real-time
   - Progress saved after completion
   - Results include all new fields

✅ pnpm benchmark --random
   - Incremental save works
   - Wrong answers include tool info
   - Latest file updated correctly
```

### Wrong Answers Format
```bash
✅ New entries include steps, toolsUsed, summary
✅ Old entries preserve existing format
✅ Backward compatible
```

---

## Benefits Summary

### For Users
1. **Better Visibility** - See what's happening in real-time
2. **Progress Safety** - Never lose work due to crashes
3. **Faster Debugging** - Understand failures immediately
4. **Live Monitoring** - Watch benchmark progress in real-time

### For Developers
1. **Tool Usage Analysis** - Track which tools succeed/fail
2. **Performance Insights** - See execution patterns
3. **Debugging Data** - Full context in wrong answers
4. **Iterative Testing** - Resume from latest checkpoint

### For Analysis
1. **Tool Effectiveness** - Correlate tool usage with success
2. **Complexity Metrics** - Track steps and tool calls
3. **Failure Patterns** - Identify common failure modes
4. **Optimization Targets** - Find bottlenecks and issues

---

## Migration Notes

### Backward Compatibility
- ✅ Existing wrong-answers.json entries still work
- ✅ New fields are optional
- ✅ Old benchmark results still load correctly
- ✅ No breaking changes to CLI arguments

### New Behavior
- `latest.json` file created during runs (can be gitignored)
- Progress indicator appears for multi-task runs
- Stream mode shows tool executions inline
- Wrong answers now include execution details

---

## Future Improvements

### Real-time Dashboard
- [ ] Web UI to visualize benchmark progress
- [ ] Live tool call graph
- [ ] Success rate charts
- [ ] Performance metrics

### Advanced Analysis
- [ ] Tool success/failure correlation
- [ ] Optimal tool sequence detection
- [ ] Performance regression tracking
- [ ] Automated failure categorization

### Reliability
- [ ] Resume from checkpoint on crash
- [ ] Parallel task execution (with rate limiting)
- [ ] Automatic retry on transient errors
- [ ] Circuit breaker for failing tools

---

## Related Documentation

- [Benchmark Module](../docs/benchmark.md) - Architecture overview
- [Wrong Answers Guide](../docs/wrong-answers.md) - Error tracking
- [Testing Guide](../docs/testing.md) - Unit tests

---

## Conclusion

These improvements transform the benchmark runner from a batch processor into an interactive, fault-tolerant system with rich debugging capabilities.

**Key Wins:**
- 🎯 Real-time visibility into agent thinking
- 💾 Never lose progress again
- 🔍 Deep insights into failures
- 📊 Rich data for analysis

The benchmark is now production-ready for long-running evaluations with complete observability.
