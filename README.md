<div align="center">
  <img src="docs/logo.svg" alt="GAIA Agent Logo" width="200" height="200">
  
  # GAIA Agent
  
  ### 🤖 Build GAIA-benchmark-ready AI agents in seconds, not weeks
  
  **Production-ready AI agent with 16+ tools and swappable providers**  
  Built on AI SDK v6 ToolLoopAgent & ToolSDK.ai
  
  [![npm version](https://img.shields.io/npm/v/gaia-agent.svg?style=flat-square)](https://www.npmjs.com/package/gaia-agent)
  [![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
  [![AI SDK](https://img.shields.io/badge/AI_SDK-v6-purple.svg?style=flat-square)](https://sdk.vercel.ai/)
  
  [Quick Start](#quick-start) · [Features](#features) · [Documentation](#documentation) · [Examples](#examples)
  
</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🚀 Zero Configuration
Pre-configured agent ready for GAIA benchmarks out of the box

### 🔧 16+ Built-in Tools
Organized by category with official SDKs (Tavily, Exa, E2B, BrowserUse)

### 🔄 Swappable Providers
Easy provider switching for sandbox, browser, search, and memory

### 🌐 AI-Powered Search
Integrated Tavily and Exa for intelligent web search

</td>
<td width="50%">

### 🛡️ Secure Sandbox
E2B cloud sandbox with code execution + filesystem operations

### 🖥️ Browser Automation
BrowserUse SDK or AWS AgentCore for web interactions

### 🧠 Agent Memory
Persistent memory with Mem0 or AWS AgentCore

### 📦 Tree-Shaking Friendly
ESM with granular exports, TypeScript-first

</td>
</tr>
</table>

---

## 🎯 Why GAIA Agent?

<table>
<tr>
<td>

### ❌ Traditional Approach
- Days/weeks setting up APIs
- Writing tool wrappers manually
- Error handling for each service
- Figuring out which providers to use
- Integration testing headaches

</td>
<td>

### ✅ With GAIA Agent
- **3 lines of code** to get started
- **16 tools ready** with official SDKs
- **GAIA benchmark ready** immediately
- **Swap providers** with one line
- **Production-tested** implementations

</td>
</tr>
</table>

**Time savings:** From weeks of infrastructure setup → 3 lines of code

---

## 🚀 Quick Start

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

---

## 📋 Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...

# Optional - OpenAI Configuration
OPENAI_MODEL=gpt-4o                    # Default model (gpt-4o, gpt-4o-mini, etc.)
OPENAI_BASE_URL=https://api.openai.com/v1  # Custom endpoint

# Optional - Provider Selection
GAIA_AGENT_SEARCH_PROVIDER=tavily      # Search: tavily | exa
GAIA_AGENT_SANDBOX_PROVIDER=e2b        # Sandbox: e2b | sandock
GAIA_AGENT_BROWSER_PROVIDER=browseruse # Browser: browseruse | aws-agentcore
GAIA_AGENT_MEMORY_PROVIDER=mem0        # Memory: mem0 | agentcore (optional)

# Required - Default provider API keys
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

**Provider Configuration Priority:**
1. Code configuration (highest): `createGaiaAgent({ providers: { search: 'exa' } })`
2. Environment variables: `GAIA_AGENT_SEARCH_PROVIDER=exa`
3. Defaults (lowest): `tavily`, `e2b`, `browseruse`, `mem0`

---

## 🎛️ Default Providers

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

---

## 🛠️ Built-in Tools

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

---

## 🔄 Swap Providers

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

**Test by capability** - Filter tasks by required skills:

```bash
pnpm benchmark:files         # Tasks with file attachments (images, PDFs, etc.)
pnpm benchmark:code          # Code execution & mathematical calculations
pnpm benchmark:search        # Web search & information retrieval
pnpm benchmark:browser       # Browser automation (navigation, clicks, etc.)
pnpm benchmark:reasoning     # Pure reasoning/logic tasks
```

**Stream mode** shows agent's thinking process in real-time:
```bash
pnpm benchmark --stream --random

# Or use with other commands
pnpm benchmark:random --stream
pnpm benchmark:search --stream --limit 3

# Output:
# 🤖 Agent thinking (streaming)...
# I need to search for information about...
# Let me calculate 15 * 23...
# The result is 345...
```

**Custom options** - All flags are compatible with category filters:
```bash
pnpm benchmark:files --limit 5 --verbose      # Test file handling
pnpm benchmark:search --stream                # Search with streaming
pnpm benchmark:code --random --verbose        # Random code task
pnpm benchmark --category search --level 2    # Advanced search tasks
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
