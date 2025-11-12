# Benchmark Runner with ReAct Planner Integration

## New Command-Line Options

The GAIA benchmark runner now supports the Enhanced ReAct Planner and related strategies.

### Basic ReAct Planner

Enable structured reasoning (Think → Plan → Act → Observe → Reflect):

```bash
pnpm benchmark --react --limit 10
```

### ReAct with Reflection

Enable ReAct planner with reflection mechanism (self-verification):

```bash
pnpm benchmark --react --reflection --limit 10
```

### ReAct with Iterative Answering

Enable confidence-based retry with automatic attempt on low-confidence answers:

```bash
pnpm benchmark --react --iterative --limit 10
```

### Advanced Options

Customize retry behavior:

```bash
# Set maximum retry attempts (default: 2)
pnpm benchmark --react --iterative --max-attempts 3

# Set confidence threshold for retry (default: 70%)
pnpm benchmark --react --iterative --confidence 80

# Combine all features
pnpm benchmark --react --iterative --reflection --max-attempts 3 --confidence 80 --limit 10
```

## Complete Examples

### Test ReAct on Level 1 tasks
```bash
pnpm benchmark --react --level 1 --limit 20 --verbose
```

### Test ReAct with iterative mode on code tasks
```bash
pnpm benchmark --react --iterative --category code --limit 10 --verbose
```

### Full feature test with streaming output
```bash
pnpm benchmark --react --iterative --reflection --limit 5 --stream --verbose
```

### Production run on validation set
```bash
pnpm benchmark --react --iterative --confidence 75 --max-attempts 3
```

## Command-Line Flags Reference

| Flag | Description | Default |
|------|-------------|---------|
| `--react` | Enable Enhanced ReAct Planner | `false` |
| `--reflection` | Enable reflection mechanism (requires `--react`) | `false` |
| `--iterative` | Enable iterative answering with retry (requires `--react`) | `false` |
| `--max-attempts` | Maximum retry attempts for iterative mode | `2` |
| `--confidence` | Confidence threshold (0-100) for retry decision | `70` |

## How It Works

### Standard Mode (without `--react`)
- Uses default instructions
- Single-pass evaluation
- No confidence estimation

### ReAct Mode (`--react`)
- Uses Enhanced ReAct Planner instructions
- Structured 5-phase reasoning
- Task pattern detection (factual, math, code, browser, files)
- Pattern-specific tool recommendations

### Reflection Mode (`--react --reflection`)
- ReAct planner + self-verification
- Agent analyzes its own answer
- Detects low confidence
- Recommends retry if confidence < threshold

### Iterative Mode (`--react --iterative`)
- ReAct planner + automatic retry
- Estimates confidence heuristically
- Retries on low confidence with different approach
- Returns best attempt across all retries
- Tracks metadata (attempts, confidence, reflection)

## Performance Expectations

Based on `docs/improving-gaia-scores.md`:

| Configuration | Expected Improvement |
|--------------|---------------------|
| `--react` | +10-15% |
| `--react --reflection` | +12-18% |
| `--react --iterative` | +15-25% |
| `--react --iterative --reflection` | +15-25% |

## Output Differences

### Standard Mode
```json
{
  "taskId": "task-123",
  "answer": "2003",
  "correct": true,
  "steps": 3,
  "durationMs": 5234
}
```

### Iterative Mode
```json
{
  "taskId": "task-123",
  "answer": "2003",
  "correct": true,
  "steps": 0,
  "durationMs": 0,
  "metadata": {
    "attempts": 2,
    "confidence": 85,
    "finalReflection": "High confidence in answer..."
  }
}
```

## Notes

1. **Reflection requires ReAct**: `--reflection` only works with `--react` flag
2. **Iterative requires ReAct**: `--iterative` only works with `--react` flag
3. **Streaming disabled in iterative mode**: `--stream` is ignored when using `--iterative`
4. **No step tracking in iterative mode**: `steps` and `durationMs` are not tracked
5. **Metadata included**: Results include `attempts`, `confidence`, and `finalReflection` in metadata

## Troubleshooting

### Reflection not working
- Ensure `--react` flag is enabled
- Reflection uses additional LLM calls (may increase cost and time)

### Iterative mode slow
- Each retry makes additional LLM calls
- Reduce `--max-attempts` or increase `--confidence` threshold
- Use `--verbose` to see retry decisions

### High API costs
- Start with small `--limit` values
- Use `--confidence 80` to reduce retries
- Disable `--reflection` if not needed

## See Also

- [ReAct Planner Guide](../docs/react-planner.md) - Complete documentation
- [Improving GAIA Scores](../docs/improving-gaia-scores.md) - Performance strategies
- [Benchmark Module](../docs/benchmark.md) - Benchmark architecture
