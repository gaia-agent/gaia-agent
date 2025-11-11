# Wrong Answers Collection

Automatic error tracking and retry system for GAIA benchmark tasks.

## Overview

The wrong answers collection automatically tracks failed tasks and provides an easy way to retry them. This helps you:

- 🎯 **Focus on difficult tasks** - Retry only the tasks that failed
- 📊 **Track progress** - See attempt counts and when tasks first/last failed
- 🔄 **Improve iteratively** - Keep retrying until all tasks pass
- 📈 **Monitor improvement** - Track which tasks you've fixed over time

## How It Works

### Automatic Tracking

Every time you run a benchmark, the system automatically:

1. **Adds failed tasks** to `benchmark-results/wrong-answers.json` with metadata
2. **Updates attempt counts** for tasks that fail again
3. **Removes tasks** that now pass correctly

### Wrong Answers File Structure

```json
{
  "metadata": {
    "totalWrong": 2,
    "lastUpdated": "2025-11-11T13:58:27.277Z"
  },
  "tasks": {
    "task-id-123": {
      "taskId": "task-id-123",
      "question": "What year was X founded?",
      "expectedAnswer": "1927",
      "agentAnswer": "1928",
      "level": 2,
      "firstFailedAt": "2025-11-11T13:00:00.000Z",
      "lastFailedAt": "2025-11-11T13:58:27.277Z",
      "attemptCount": 2,
      "error": "Optional error message if task threw an error"
    }
  }
}
```

### Field Descriptions

- **taskId**: Unique identifier for the GAIA task
- **question**: Full question text
- **expectedAnswer**: The correct answer from GAIA dataset
- **agentAnswer**: What the agent actually answered
- **level**: Difficulty level (1-3)
- **firstFailedAt**: ISO timestamp of first failure
- **lastFailedAt**: ISO timestamp of most recent failure
- **attemptCount**: Number of times this task has failed
- **error**: Optional - error message if task threw an exception

## Commands

### Run All Wrong Answers

Retry all previously failed tasks:

```bash
pnpm benchmark:wrong
```

### With Options

```bash
# Detailed output showing agent thinking
pnpm benchmark:wrong --verbose

# Stream mode (real-time agent thinking)
pnpm benchmark:wrong --stream

# Limit to first 5 wrong answers
pnpm benchmark:wrong --limit 5

# Only retry level 1 wrong answers
pnpm benchmark:wrong --level 1

# Combine options
pnpm benchmark:wrong --level 2 --limit 3 --verbose --stream
```

## Workflow Examples

### Basic Workflow

```bash
# 1. Run initial benchmark
pnpm benchmark --limit 20

# Output:
# 📚 Wrong answers collection: 3 tasks
#    File: benchmark-results/wrong-answers.json

# 2. Check wrong answers
cat benchmark-results/wrong-answers.json

# 3. Retry only failed tasks
pnpm benchmark:wrong --verbose

# 4. Keep retrying until all pass
pnpm benchmark:wrong
# → "🎉 No wrong answers! All previous tasks passed."
```

### Iterative Improvement

```bash
# Day 1: Run full validation set
pnpm benchmark

# Result: 100 tasks, 15 wrong answers

# Day 2: Fix agent prompts, retry wrong answers
pnpm benchmark:wrong --verbose

# Result: 15 retried, 8 now correct, 7 still wrong

# Day 3: Improve tools, retry remaining wrong answers
pnpm benchmark:wrong --stream

# Result: 7 retried, 5 now correct, 2 still wrong

# Day 4: Final fixes
pnpm benchmark:wrong

# Result: 🎉 All tasks now pass!
```

### Focus on Specific Difficulty

```bash
# Run benchmark and collect wrong answers
pnpm benchmark --limit 50

# Retry only level 1 wrong answers (easier tasks)
pnpm benchmark:wrong --level 1

# Then retry level 2 wrong answers
pnpm benchmark:wrong --level 2

# Finally retry level 3 wrong answers (hardest)
pnpm benchmark:wrong --level 3
```

## Viewing Wrong Answers

### Command Line

```bash
# View full wrong answers file
cat benchmark-results/wrong-answers.json

# Pretty print with jq
cat benchmark-results/wrong-answers.json | jq

# Count wrong answers
cat benchmark-results/wrong-answers.json | jq '.metadata.totalWrong'

# Show tasks by attempt count (most attempted first)
cat benchmark-results/wrong-answers.json | jq '.tasks | to_entries | sort_by(.value.attemptCount) | reverse'
```

### Programmatic Access

```typescript
import { loadWrongAnswers, displayWrongAnswersSummary } from './benchmark/wrong-answers.js';

// Load wrong answers
const collection = await loadWrongAnswers('./benchmark-results');

console.log(`Total wrong: ${collection.metadata.totalWrong}`);

// Display summary
await displayWrongAnswersSummary('./benchmark-results');
```

## Summary Output

When you run `pnpm benchmark:wrong`, you'll see:

```
============================================================
📚 Wrong Answers Collection
============================================================
Total wrong:     3
Last updated:    11/11/2025, 9:58:27 PM

By difficulty level:
  Level 1: 0 tasks
  Level 2: 2 tasks
  Level 3: 1 tasks

Top 5 most attempted:
  [3x] 04a04a9b... - If we assume all articles published by Nature in 2020...
  [2x] d8152ad6... - I have the Standard plan in the image below...
  [1x] abc123... - What is the population of Tokyo?

============================================================
```

## Automatic Updates

The wrong answers collection updates automatically:

### Task Fails

```bash
pnpm benchmark --limit 10
# Task abc123 fails → Added to wrong-answers.json
```

### Task Fails Again

```bash
pnpm benchmark:wrong
# Task abc123 fails again → attemptCount incremented to 2
```

### Task Passes

```bash
pnpm benchmark:wrong
# Task abc123 passes → Removed from wrong-answers.json
# Output: "✅ Removed abc123 from wrong answers (now correct)"
```

## Integration with Regular Benchmark

Wrong answers are tracked automatically in all benchmark runs:

```bash
# These all update the wrong answers collection
pnpm benchmark
pnpm benchmark --test
pnpm benchmark:level1
pnpm benchmark:files
pnpm benchmark:random
pnpm benchmark:wrong
```

## Tips & Best Practices

### 1. Start Small

```bash
# Don't run full 165 task validation set first time
pnpm benchmark --limit 10

# This creates a manageable wrong answers collection
```

### 2. Use Verbose Mode for Debugging

```bash
# See exactly what the agent is doing wrong
pnpm benchmark:wrong --verbose
```

### 3. Stream Mode for Understanding

```bash
# Watch the agent's thinking process in real-time
pnpm benchmark:wrong --stream --verbose
```

### 4. Focus on High Attempt Counts

Tasks with high attempt counts need special attention:

```bash
# View tasks sorted by attempt count
cat benchmark-results/wrong-answers.json | jq '.tasks | to_entries | sort_by(.value.attemptCount) | reverse | .[0:3]'
```

### 5. Track Progress Over Time

```bash
# Save snapshots of wrong answers
cp benchmark-results/wrong-answers.json wrong-answers-backup-$(date +%Y%m%d).json

# Compare later
diff wrong-answers-backup-20251111.json benchmark-results/wrong-answers.json
```

## Troubleshooting

### No Wrong Answers File

If `benchmark-results/wrong-answers.json` doesn't exist:

```bash
# Run a benchmark first to create it
pnpm benchmark --limit 5
```

### Wrong Answers Not Updating

Make sure you're using the updated code:

```bash
# Rebuild the project
pnpm build

# Run benchmark
pnpm benchmark --limit 5
```

### Want to Reset Wrong Answers

```bash
# Delete the file to start fresh
rm benchmark-results/wrong-answers.json

# Next benchmark run will create a new one
pnpm benchmark --limit 10
```

## File Location

Wrong answers are stored in:

```
benchmark-results/
├── wrong-answers.json          # Current wrong answers collection
├── gaia-validation-*.json      # Historical benchmark results
└── gaia-test-*.json            # Test set results
```

## Future Enhancements

Potential improvements:

- [ ] Wrong answers by category (files, code, search, browser, reasoning)
- [ ] Export wrong answers to CSV/HTML
- [ ] Difficulty scoring based on attempt counts
- [ ] Automatic retry scheduling
- [ ] Compare agent versions on same wrong answers
- [ ] Wrong answer analytics dashboard

## References

- Main documentation: [README.md](../README.md)
- Benchmark module: [docs/benchmark.md](../docs/benchmark.md)
- Implementation: `benchmark/wrong-answers.ts`
- Runner: `benchmark/run-wrong-answers.ts`
