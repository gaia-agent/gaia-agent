# GAIA Agent

Build a GAIA-benchmark-ready super agent in seconds, not days or weeks.
🤖 **GAIA-benchmark-ready Headless AI agent with 16+ tools and swappable providers** - Built on AI SDK v6 ToolLoopAgent & ToolSDK.ai

```typescript
import { createGaiaAgent } from 'gaia-agent';

const agent = createGaiaAgent();

const result = await agent.generate({
  prompt: 'Search for recent AI breakthroughs and summarize the top 3',
});
```

[![npm version](https://img.shields.io/npm/v/gaia-agent.svg)](https://www.npmjs.com/package/gaia-agent)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Features

- 🚀 **Zero Config** - Pre-configured agent ready for GAIA benchmarks
- 🔧 **16 Built-in Tools** - Organized by category with official SDKs
- 🔄 **Swappable Providers** - Choose sandbox (E2B/Sandock), browser (BrowserUse/AWS), search (Tavily/Exa)
- 🌐 **AI-Powered Search** - Integrated Tavily (@tavily/core) and Exa (exa-js) SDKs
- 🛡️ **Secure Sandbox** - E2B cloud sandbox (e2b SDK) with code execution + filesystem
- 🖥️ **Browser Automation** - BrowserUse (browser-use-sdk) or AWS AgentCore
- 🧠 **Agent Memory** - Persistent memory with Mem0
- 📦 **Tree-Shaking Friendly** - ESM with granular exports
- 🏗️ **TypeScript First** - Built and compiled, full type safety
- 🔌 **ToolSDK Ready** - Easy integration with custom tools

## Why?

Building AI agents usually means:
- ❌ Days/weeks setting up APIs for search, code execution, memory
- ❌ Writing tool wrappers and error handling for each service
- ❌ Figuring out which providers to use and how to swap them

**With gaia-agent:**
- ✅ **16 tools ready** with official SDKs (Tavily, Exa, E2B, BrowserUse)
- ✅ **GAIA benchmark ready** - Run benchmarks immediately with `pnpm run benchmark`
- ✅ **Swap providers easily** - Change sandbox/browser/search with one line
- ✅ **AI SDK v6 native** - Built on `ToolLoopAgent`, no wrappers
- ✅ **Tree-shakeable** - Only bundle what you use

**Time savings:** From weeks of infrastructure setup → 3 lines of code

## Quick Start

### Installation

```bash
npm install gaia-agent ai @ai-sdk/openai zod
```

### Basic Usage

```typescript
import { createGaiaAgent } from 'gaia-agent';

// Create the agent - reads from environment variables
const agent = createGaiaAgent();

const result = await agent.generate({
  prompt: 'Calculate 15 * 23 and search for the latest AI papers',
});

console.log(result.text);
```

### Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...

# Required - Default providers (can be swapped)
TAVILY_API_KEY=...           # Search provider (default: Tavily)
E2B_API_KEY=...              # Sandbox provider (default: E2B)
BROWSERUSE_API_KEY=...       # Browser provider (default: BrowserUse)

# Optional - Alternative providers
EXA_API_KEY=...              # Alternative search (Exa)
SANDOCK_API_KEY=...          # Alternative sandbox (Sandock)

# Optional - Memory (not required for basic usage)
MEM0_API_KEY=...             # Memory provider (Mem0)
AWS_ACCESS_KEY_ID=...        # Alternative memory (AWS AgentCore)
AWS_SECRET_ACCESS_KEY=...
```

### Default Providers

**gaia-agent** comes with pre-configured providers optimized for GAIA benchmarks:

| Category | Default Provider | Required | Alternative Options |
|----------|-----------------|----------|---------------------|
| 🔍 **Search** | Tavily | ✅ Yes | Exa |
| 🛡️ **Sandbox** | E2B | ✅ Yes | Sandock |
| 🖥️ **Browser** | BrowserUse | ✅ Yes | AWS AgentCore |
| 🧠 **Memory** | Mem0 | ❌ Optional | AWS AgentCore |

**Why these defaults?**
- **Tavily**: AI-optimized search with best Q&A results
- **E2B**: Cloud sandbox with full filesystem + multi-language support
- **BrowserUse**: Modern browser automation with best reliability
- **Mem0**: Simple memory API (optional, not required for most tasks)

## Built-in Tools

### Core
- **calculator** - Math calculations
- **httpRequest** - HTTP API calls

### Search (Swappable)
- **tavilySearch** - AI-optimized Q&A ([@tavily/core](https://tavily.com))
- **exaSearch/exaGetContents/exaFindSimilar** - Neural search ([exa-js](https://exa.ai))

### Sandbox (Swappable)
- **e2bSandbox** - Cloud code execution + filesystem ([e2b](https://e2b.dev)) ⭐
- **sandockExecute** - Alternative sandbox ([Sandock](https://sandock.ai))

### Browser (Swappable)
- **browserUseTool** - Modern automation ([browser-use-sdk](https://browseruse.com)) ⭐
- **browserNavigate/GetContent/Click/Type/Screenshot** - AWS AgentCore

### Memory
- **mem0Remember/mem0Recall** - Persistent memory ([Mem0](https://mem0.ai))

## Swap Providers

You can easily switch between providers or use alternative implementations:

```typescript
import { createGaiaAgent } from 'gaia-agent';

// Use alternative providers
const agent = createGaiaAgent({
  providers: {
    search: 'exa',              // Use Exa instead of Tavily
    sandbox: 'sandock',         // Use Sandock instead of E2B
    memory: 'agentcore',        // Use AWS AgentCore instead of Mem0
  },
});
```

**Or customize individual tools:**

```typescript
import { createGaiaAgent, getDefaultTools } from 'gaia-agent';
import { exaSearch } from 'gaia-agent/tools/search';
import { sandockExecute } from 'gaia-agent/tools/sandbox';

const agent = createGaiaAgent({
  tools: {
    ...getDefaultTools(),
    search: exaSearch,          // Override search tool
    sandbox: sandockExecute,    // Override sandbox tool
  },
});
```

📖 **[See full provider comparison →](./docs/providers.md)**

## GAIA Benchmark

Run official GAIA benchmarks with modular architecture and streaming support:

```bash
pnpm run benchmark           # Validation set
pnpm run benchmark:test      # Test set
pnpm run benchmark:level2    # Filter by difficulty
pnpm run benchmark:quick     # 5 tasks (testing)
pnpm run benchmark:random    # Random 1 task with verbose output
```

**Stream mode** shows agent's thinking process in real-time:
```bash
pnpm benchmark --stream --random

# Or use with other commands
pnpm benchmark:random --stream

# Output:
# 🤖 Agent thinking (streaming)...
# I need to search for information about...
# Let me calculate 15 * 23...
# The result is 345...
```

**Custom options:**
```bash
pnpm benchmark --random --verbose   # Random task with detailed logs
pnpm benchmark:random --stream      # Streaming + random task
pnpm benchmark --limit 3 --verbose  # 3 tasks with detailed logs
pnpm benchmark --level 1 --random   # Random Level 1 task
```

📖 **[See GAIA requirements and setup →](./docs/gaia-benchmark.md)**
📖 **[See benchmark module documentation →](./docs/benchmark.md)**

## Testing

Run unit tests with vitest:

```bash
pnpm test                # Run all tests
pnpm test:watch          # Watch mode
pnpm test:ui             # Interactive UI
pnpm test:coverage       # Coverage report
```

## Project Structure

```
gaia-agent/
├── src/                 # Library source code
│   ├── index.ts         # Main exports
│   ├── types.ts         # Type definitions
│   └── tools/           # Tool implementations
├── benchmark/           # Modular benchmark runner (excluded from build)
│   ├── types.ts         # Benchmark types
│   ├── downloader.ts    # Dataset downloader
│   ├── evaluator.ts     # Task evaluator with streaming
│   ├── reporter.ts      # Results reporter
│   └── run.ts           # CLI entry point
├── test/                # Unit tests (vitest)
└── dist/                # Compiled output
```

## Advanced Usage

### Custom Tools

```typescript
import { createGaiaAgent, getDefaultTools } from 'gaia-agent';
import { tool } from 'ai';
import { z } from 'zod';

const agent = createGaiaAgent({
  tools: {
    ...getDefaultTools(),
    weatherTool: tool({
      description: 'Get weather',
      parameters: z.object({ city: z.string() }),
      execute: async ({ city }) => ({ temp: 72, condition: 'sunny' }),
    }),
  },
});
```

### Extend GAIAAgent Class

```typescript
import { GAIAAgent } from 'gaia-agent';

class ResearchAgent extends GAIAAgent {
  constructor() {
    super({
      instructions: 'Research assistant specialized in AI papers',
      additionalTools: { /* custom tools */ },
    });
  }
}
```

📖 **[See advanced patterns →](./docs/advanced-usage.md)**

## Documentation

- **[GAIA Benchmark Guide](./docs/gaia-benchmark.md)** - Requirements, setup, provider recommendations
- **[Provider Comparison](./docs/providers.md)** - Detailed comparison of E2B/Sandock, BrowserUse/AWS, Tavily/Exa
- **[Tools Reference](./docs/tools-reference.md)** - Complete tool API documentation
- **[Advanced Usage](./docs/advanced-usage.md)** - Extension examples, custom agents, ToolSDK integration

## API Reference

### `gaiaAgent`

Pre-configured ToolLoopAgent ready to use:

```typescript
import { gaiaAgent } from 'gaia-agent';
const result = await gaiaAgent.generate({ prompt: '...' });
```

### `createGaiaAgent(config?)`

Create custom agent with your configuration:

```typescript
import { createGaiaAgent } from 'gaia-agent';
import { openai } from '@ai-sdk/openai';

const agent = createGaiaAgent({
  model: openai('gpt-4-turbo'),
  instructions: 'Custom instructions',
  maxSteps: 20,
  tools: { /* custom tools */ },
});
```

### `GAIAAgent`

Extensible base class:

```typescript
import { GAIAAgent } from 'gaia-agent';

class MyAgent extends GAIAAgent {
  constructor() {
    super({ instructions: '...', additionalTools: { ... } });
  }
}
```

### `getDefaultTools()`

Get all default tools for modification:

```typescript
import { getDefaultTools } from 'gaia-agent';

const tools = {
  ...getDefaultTools(),
  customTool: tool({ ... }),
};
```

## Package Exports

```typescript
import { gaiaAgent, createGaiaAgent, GAIAAgent, getDefaultTools } from 'gaia-agent';
import type { GaiaTask, AgentConfig } from 'gaia-agent/types';

// Subpath imports for granular control
import { calculator, httpRequest } from 'gaia-agent/tools/core';
import { tavilySearch, exaSearch } from 'gaia-agent/tools/search';
import { e2bSandbox, sandockExecute } from 'gaia-agent/tools/sandbox';
import { browserUseTool } from 'gaia-agent/tools/browser';
import { mem0Remember, mem0Recall } from 'gaia-agent/tools/memory';
```

## Dependencies

- `ai@^6.0.0-beta.1` - Vercel AI SDK 6 beta
- `@ai-sdk/openai@^2.0.32` - OpenAI provider
- `zod@^4.1.11` - Schema validation
- `@tavily/core@^0.5.12` - Tavily search SDK
- `exa-js@^2.0.0` - Exa search SDK
- `e2b@^2.6.3` - E2B sandbox SDK
- `browser-use-sdk@^2.0.4` - BrowserUse SDK
- `apache-arrow@^21.1.0` - Parquet support for GAIA

## License

MIT

## Contributing

This project uses automated NPM publishing. When changes are merged to `main`:

1. ✅ Tests run automatically
2. 📦 Version bumps to next patch (e.g., 0.1.0 → 0.1.1)
3. 📝 Changelog created in `changelog/`
4. 🚀 Published to NPM
5. 🏷️ Git tag created

For manual version bumps (minor/major), see [docs/NPM_PUBLISH_SETUP.md](./docs/NPM_PUBLISH_SETUP.md).

## Links

- [Tavily](https://tavily.com) - AI-optimized web search
- [Exa](https://exa.ai) - Neural semantic search
- [E2B](https://e2b.dev) - Cloud code sandboxes
- [BrowserUse](https://browseruse.com) - AI browser automation
- [AWS Bedrock AgentCore](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/browser-tool.html) - AWS browser tools
- [Sandock](https://sandock.ai) - Code execution sandbox
- [Mem0](https://mem0.ai) - Agent memory
- [GAIA Benchmark](https://huggingface.co/datasets/gaia-benchmark/GAIA) - Official dataset
