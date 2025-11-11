# Resume Feature - Checkpoint & Recovery

Date: November 11, 2025

## Overview

Added checkpoint recovery feature to resume interrupted benchmark runs without losing progress.

## Features

### 1️⃣ Automatic Checkpointing

**How it works:**
- Every task completion saves to `gaia-{dataset}-latest.json`
- File is continuously updated with all completed results
- No performance impact (async writes)

**Checkpoint File:**
```json
{
  "metadata": {
    "dataset": "validation",
    "timestamp": "2025-11-11T15:48:28.520Z",
    "total": 3,
    "correct": 2,
    "accuracy": 66.67,
    "incremental": true
  },
  "results": [
    { "taskId": "...", "correct": true, ... },
    { "taskId": "...", "correct": false, ... },
    { "taskId": "...", "correct": true, ... }
  ]
}
```

---

### 2️⃣ Resume from Checkpoint

**Usage:**
```bash
# Initial run (interrupted at 3/10)
pnpm benchmark --limit 10

# Resume from checkpoint
pnpm benchmark --resume

# Or use shortcut
pnpm benchmark:resume
```

**What happens:**
1. Load `gaia-validation-latest.json`
2. Extract completed task IDs
3. Filter out completed tasks from dataset
4. Continue with remaining tasks
5. Merge results from checkpoint + new results

**Example Output:**
```bash
🤖 GAIA Benchmark Runner
Resume:   yes
📂 Found checkpoint with 3 completed tasks
   File: benchmark-results/gaia-validation-latest.json
🔄 Resuming: Skipping 3 completed tasks, 162 remaining
🚀 Running benchmark on 5 tasks...

[4/8] Evaluating task-004...  # Continues from task 4
[5/8] Evaluating task-005...
...
```

---

### 3️⃣ Works with All Filters

Resume works seamlessly with other options:

**Level Filter:**
```bash
pnpm benchmark --level 2 --limit 20
# ... interrupted at 10/20
pnpm benchmark --resume --level 2
# → Resumes level 2 tasks only
```

**Category Filter:**
```bash
pnpm benchmark:search --limit 30
# ... interrupted at 15/30
pnpm benchmark:search --resume
# → Resumes search tasks only
```

**Combined:**
```bash
pnpm benchmark --level 3 --category code --limit 50
# ... interrupted
pnpm benchmark --resume --level 3 --category code
# → Resumes level 3 code tasks
```

---

## Implementation Details

### Files Modified

1. **benchmark/run.ts**
   - Added `loadCheckpoint()` function
   - Added `--resume` flag parsing
   - Filter out completed tasks
   - Merge checkpoint results with new results
   - Track progress as `[4/8]` (completed+current / total)

2. **benchmark/types.ts**
   - Added `resume?: boolean` to `BenchmarkConfig`

3. **package.json**
   - Added `"benchmark:resume"` script
   - Already had `"benchmark:test"` for test set

### Checkpoint Loading Logic

```typescript
async function loadCheckpoint(outputDir: string, dataset: string) {
  const checkpointPath = join(outputDir, `gaia-${dataset}-latest.json`);
  
  if (!existsSync(checkpointPath)) {
    return null; // No checkpoint found
  }
  
  const checkpoint = JSON.parse(await readFile(checkpointPath, 'utf-8'));
  const completedTaskIds = new Set(checkpoint.results.map(r => r.taskId));
  
  return {
    results: checkpoint.results,
    completedTaskIds
  };
}
```

### Task Filtering

```typescript
// Load checkpoint
const checkpoint = await loadCheckpoint(config.outputDir, config.dataset);

// Download full dataset
let tasks = await downloadGaiaDataset(config.dataset);

// Apply user filters (level, category)
if (config.level) {
  tasks = tasks.filter(task => task.level === config.level);
}

// Filter out completed tasks
if (checkpoint) {
  tasks = tasks.filter(task => !checkpoint.completedTaskIds.has(task.id));
  console.log(`🔄 Resuming: Skipping ${checkpoint.results.length} completed tasks`);
}
```

### Result Merging

```typescript
// Start with checkpoint results
const results = checkpoint ? [...checkpoint.results] : [];

// Add new results as tasks complete
for (const task of tasks) {
  const result = await evaluateTask(task, agent, options);
  results.push(result);
  
  // Save all results (checkpoint + new)
  await saveResults(results, allTasks, outputDir, dataset, true);
}
```

---

## Use Cases

### 1. Long-Running Benchmarks

**Scenario:** Running full validation set (165 tasks) takes hours.

**Solution:**
```bash
# Start full benchmark
pnpm benchmark

# If interrupted (crash, network issue, rate limit)
pnpm benchmark --resume

# Continues from last completed task
```

---

### 2. Rate Limiting

**Scenario:** API rate limits force you to stop and wait.

**Solution:**
```bash
# Run until rate limit
pnpm benchmark --limit 100

# Wait for rate limit reset (e.g., 1 hour)
# Then resume
pnpm benchmark --resume --limit 100

# Skips completed, runs remaining
```

---

### 3. Iterative Testing

**Scenario:** Test incrementally, analyze results, continue.

**Solution:**
```bash
# Run 10 tasks
pnpm benchmark --limit 10

# Analyze results
cat benchmark-results/gaia-validation-latest.json | jq '.metadata'

# Run 10 more
pnpm benchmark --resume --limit 20  # Total 20, runs 10 new

# Continue...
pnpm benchmark --resume --limit 30  # Total 30, runs 10 new
```

---

### 4. Parallel Category Testing

**Scenario:** Test different categories separately, then combine.

**Solution:**
```bash
# Run code tasks (no resume needed)
pnpm benchmark:code

# Run search tasks (different checkpoint file)
pnpm benchmark:search

# Each category has its own latest.json
# - gaia-validation-latest.json (shared)
```

**Note:** Currently all categories share one latest.json. Future improvement could support category-specific checkpoints.

---

## Safety & Edge Cases

### Checkpoint Consistency

✅ **Safe:**
- Checkpoint always reflects completed tasks
- Incremental saves atomic (file write is atomic)
- No partial task states

❌ **Unsafe (handled):**
- If task fails mid-execution → Not added to checkpoint
- If process crashes → Last completed task is in checkpoint
- If checkpoint file corrupted → Starts fresh (warns user)

### Duplicate Prevention

```typescript
// Guaranteed no duplicates
const completedTaskIds = new Set(checkpoint.results.map(r => r.taskId));
tasks = tasks.filter(task => !completedTaskIds.has(task.id));
```

### Filter Compatibility

Resume works with all filter combinations:
- ✅ `--level` + `--resume`
- ✅ `--category` + `--resume`
- ✅ `--limit` + `--resume`
- ❌ `--random` + `--resume` (random overrides resume)

---

## Progress Display

### Without Resume
```
[1/10] Evaluating task-001...
[2/10] Evaluating task-002...
...
```

### With Resume (from checkpoint of 3)
```
[4/13] Evaluating task-004...  # 3 from checkpoint + 1 current
[5/13] Evaluating task-005...  # Total = 3 + 10 requested
...
[13/13] Evaluating task-013...
```

---

## Testing

### Test Scenario 1: Basic Resume
```bash
# Run 3 tasks
pnpm benchmark --limit 3 --verbose
# ✓ Creates gaia-validation-latest.json with 3 results

# Resume with 5 more (total 8)
pnpm benchmark --resume --limit 8 --verbose
# ✓ Loads checkpoint
# ✓ Skips 3 completed tasks
# ✓ Runs 5 new tasks
# ✓ Final results have 8 tasks
```

### Test Scenario 2: No Checkpoint
```bash
# First time (no checkpoint)
pnpm benchmark --resume --limit 5
# ✓ Shows "No checkpoint found, starting from beginning"
# ✓ Runs normally
```

### Test Scenario 3: Level Filter
```bash
# Run level 1
pnpm benchmark --level 1 --limit 5

# Resume level 1
pnpm benchmark --resume --level 1 --limit 10
# ✓ Only resumes level 1 tasks
# ✓ Skips completed level 1 tasks
```

---

## Future Improvements

### Category-Specific Checkpoints
```bash
# Each category has its own checkpoint
gaia-validation-latest-search.json
gaia-validation-latest-code.json
gaia-validation-latest-browser.json
```

### Automatic Resume on Failure
```bash
# Detect crash/error and auto-resume
pnpm benchmark --auto-resume
```

### Resume from Specific Task
```bash
# Resume from specific task ID
pnpm benchmark --resume-from task-id-123
```

### Progress Visualization
```bash
# Show progress bar
pnpm benchmark --limit 100 --progress
# [=====>    ] 50/100 tasks (50%)
```

---

## FAQ

**Q: What happens if I change filters and resume?**  
A: Resume only applies to tasks matching current filters. Example: If checkpoint has level 1+2 tasks but you resume with `--level 1`, only level 1 tasks are considered.

**Q: Can I resume a test set run?**  
A: Yes! `pnpm benchmark:test --resume` works. Uses `gaia-test-latest.json`.

**Q: Does resume work with --random?**  
A: No. Random mode picks one task randomly, ignoring checkpoints.

**Q: What if checkpoint is corrupted?**  
A: Warning shown, starts fresh from beginning. No data loss (original timestamped results are preserved).

**Q: Can I manually edit checkpoint?**  
A: Not recommended, but technically possible. Edit `gaia-validation-latest.json` to remove specific task results.

---

## Related Features

- **Incremental Saving** - Base feature that enables resume
- **Wrong Answers Collection** - Tracks failed tasks separately
- **Stream Mode** - Works with resume for better visibility

---

## Summary

Resume feature provides fault-tolerant benchmark execution:

✅ **No progress lost** on crashes or interruptions  
✅ **Seamless continuation** from last completed task  
✅ **Filter-aware** - respects level, category, limit  
✅ **Zero overhead** - checkpoints already exist from incremental saves  
✅ **Safe & reliable** - no duplicate execution, atomic updates

**Key Commands:**
```bash
pnpm benchmark              # Normal run
pnpm benchmark --resume     # Resume from checkpoint
pnpm benchmark:resume       # Shortcut
```

Perfect for long-running evaluations and production benchmarking! 🎉
