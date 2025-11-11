# Benchmark Module

Modular GAIA benchmark runner with streaming support and automatic wrong answers tracking.

## Structure

```
benchmark/
├── types.ts              # Type definitions for benchmark
├── downloader.ts         # Dataset downloader (Parquet from Hugging Face)
├── evaluator.ts          # Task evaluation logic with streaming support
├── reporter.ts           # Results reporting and summary
├── wrong-answers.ts      # Wrong answers collection manager
├── run.ts                # Main CLI runner
└── run-wrong-answers.ts  # Wrong answers retry runner
```

## Usage

### Basic Benchmark

```bash
pnpm benchmark                  # Run validation set
pnpm benchmark --test           # Run test set
pnpm benchmark --level 1        # Filter by difficulty (1-3)
pnpm benchmark --limit 10       # Limit tasks
```

### Test by Capability

Filter tasks by required skills using category filters:

```bash
pnpm benchmark:files            # Tasks with file attachments (images, PDFs, etc.)
pnpm benchmark:code             # Code execution & mathematical calculations
pnpm benchmark:search           # Web search & information retrieval
pnpm benchmark:browser          # Browser automation (navigation, clicks, etc.)
pnpm benchmark:reasoning        # Pure reasoning/logic tasks
```

**Category detection** - Tasks are automatically categorized based on:
- **files**: Has file attachments (images, PDFs, spreadsheets, etc.)
- **code**: Contains keywords like "calculate", "compute", "code", "equation", "algorithm"
- **search**: Contains keywords like "search", "find", "article", "website", "arxiv", "wikipedia"
- **browser**: Contains keywords like "browser", "navigate", "click", "webpage"
- **reasoning**: Pure logic/reasoning tasks (no other category matches)

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

**Category filters support all flags:**
```bash
pnpm benchmark:files --limit 5 --verbose      # Test file handling
pnpm benchmark:search --stream                # Search with streaming
pnpm benchmark:code --random --verbose        # Random code task
pnpm benchmark --category search --level 2    # Advanced search tasks
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

### Wrong Answers Collection

Automatically track and retry failed tasks:

```bash
# Run benchmark (automatically creates wrong-answers.json)
pnpm benchmark --limit 20

# View wrong answers
cat benchmark-results/wrong-answers.json

# Retry only failed tasks
pnpm benchmark:wrong

# With options
pnpm benchmark:wrong --verbose --stream --limit 5 --level 1
```

📖 **[See full wrong answers documentation →](./wrong-answers.md)**

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

Generates summary statistics, saves results, and updates wrong answers:

```typescript
import { displaySummary, saveResults } from './reporter.js';

displaySummary(results);
await saveResults(results, tasks, './output', 'validation');
// Automatically updates wrong-answers.json
```

### `wrong-answers.ts`

Manages wrong answers collection:

```typescript
import { 
  loadWrongAnswers, 
  updateWrongAnswers,
  displayWrongAnswersSummary 
} from './wrong-answers.js';

// Load wrong answers
const collection = await loadWrongAnswers('./benchmark-results');

// Update with new results
await updateWrongAnswers(results, tasks, './benchmark-results');

// Display summary
await displayWrongAnswersSummary('./benchmark-results');
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
