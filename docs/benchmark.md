# Benchmark Module

Modular GAIA benchmark runner with streaming support.

## Structure

```
benchmark/
├── types.ts        # Type definitions for benchmark
├── downloader.ts   # Dataset downloader (Parquet from Hugging Face)
├── evaluator.ts    # Task evaluation logic with streaming support
├── reporter.ts     # Results reporting and summary
└── run.ts          # Main CLI runner
```

## Usage

### Basic Benchmark

```bash
pnpm benchmark                  # Run validation set
pnpm benchmark --test           # Run test set
pnpm benchmark --level 1        # Filter by difficulty (1-3)
pnpm benchmark --limit 10       # Limit tasks
```

### Advanced Options

```bash
# Random single task
pnpm benchmark --random

# Stream mode (real-time agent thinking)
pnpm benchmark --stream --random

# Verbose output
pnpm benchmark --verbose

# Combine options
pnpm benchmark --random --stream --verbose
```

### Convenience Scripts

```bash
pnpm benchmark:quick            # 5 tasks with verbose output
pnpm benchmark:random           # Random task with verbose
pnpm benchmark:level1           # Level 1 tasks only
```

**Note:** Use `--stream` flag with any command for real-time output:
```bash
pnpm benchmark:random --stream  # Random task with streaming
```

## Stream Mode

The `--stream` flag enables real-time output of the agent's thinking process:

```bash
pnpm benchmark --stream --random
```

**Example output:**
```
🤖 Agent thinking (streaming)...

I need to search for information about...
Let me calculate 15 * 23...
The result is 345...
```

This helps you understand the agent's reasoning in real-time.

## Module Details

### `downloader.ts`

Downloads GAIA dataset from Hugging Face in Parquet format:

```typescript
import { downloadGaiaDataset } from './downloader.js';

const tasks = await downloadGaiaDataset('validation');
// Returns: GaiaTask[]
```

### `evaluator.ts`

Evaluates individual tasks with optional streaming:

```typescript
import { evaluateTask } from './evaluator.js';

const result = await evaluateTask(task, agent, {
  verbose: true,
  stream: true,
});
// Returns: GaiaBenchmarkResult
```

### `reporter.ts`

Generates summary statistics and saves results:

```typescript
import { displaySummary, saveResults } from './reporter.js';

displaySummary(results);
await saveResults(results, './output', 'validation');
```

## Environment Variables

Required:
- `OPENAI_API_KEY` - OpenAI API key

Optional:
- `OPENAI_BASE_URL` - Custom OpenAI endpoint
- `OPENAI_MODEL` - Model name (default: gpt-4o)
- `HUGGINGFACE_TOKEN` - Hugging Face authentication
- Provider API keys (E2B_API_KEY, TAVILY_API_KEY, etc.)

## TypeScript Configuration

The benchmark folder is excluded from main compilation:

```json
{
  "exclude": ["benchmark/**/*", "test/**/*"]
}
```

This keeps the benchmark code separate from the library source.
