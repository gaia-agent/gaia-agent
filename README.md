<div align="center">
  <img src="docs/logo.svg" alt="GAIA Agent Logo" width="200" height="200">
  
  # GAIA Super Agent SDK
  
  ### 🤖 Build GAIA-Benchmark-ready Super AI Agents in seconds, not weeks
  
  **Production-ready Super AI agent with 16+ tools and swappable providers**  
  Built on AI SDK v6 ToolLoopAgent & ToolSDK.ai
  
  [![npm version](https://img.shields.io/npm/v/@gaia-agent/sdk.svg?style=flat-square)](https://www.npmjs.com/package/@gaia-agent/sdk)
  [![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat-square)](LICENSE)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
  [![AI SDK](https://img.shields.io/badge/AI_SDK-v6-purple.svg?style=flat-square)](https://sdk.vercel.ai/)
  
  [Quick Start](#-quick-start) · [Features](#-features) · [GAIA Benchmark](#-gaia-benchmark) · [Documentation](#-documentation)
  
</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🚀 Zero Configuration
Pre-configured agent ready for GAIA benchmarks out of the box

### 🔧 16+ Built-in Tools
Organized by category with official SDKs (Tavily, Exa, E2B, BrowserUse, Steel)

### 🔄 Swappable Providers
Easy provider switching for sandbox, browser, search, and memory

### 🌐 AI-Powered Search
Integrated Tavily and Exa for intelligent web search

</td>
<td width="50%">

### 🛡️ Secure Sandbox
E2B cloud sandbox with code execution + filesystem operations

### 🖥️ Browser Automation
Steel, BrowserUse or AWS AgentCore for web interactions

### 🧠 Agent Memory
Persistent memory with Mem0 or AWS AgentCore

### 📦 Tree-Shaking Friendly
ESM with granular exports, TypeScript-first

</td>
</tr>
</table>

---

## 🎯 Why GAIA Agent?

### 🌟 Our Mission
**Empower developers to build world-class Super AI Agents in minutes, not months.**

Whether you're creating a production-ready AI assistant for your product or competing in GAIA benchmarks, GAIA Agent provides the enterprise-grade foundation you need.

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

**Result:** A world-class, production-ready Super Agent that rivals top AI systems

### 🌟 What is the GAIA Benchmark?
The [GAIA Benchmark](https://huggingface.co/datasets/gaia-benchmark/GAIA) is a comprehensive evaluation suite designed to test the capabilities of AI agents across a wide range of tasks, including reasoning, search, code execution, and browser automation.

📖 **[Read more about GAIA →](https://arxiv.org/abs/2311.12983)**

---

## 🚀 Quick Start

### Installation

```bash
npm install @gaia-agent/sdk ai @ai-sdk/openai zod
```

### Basic Usage

```typescript
import { createGaiaAgent } from '@gaia-agent/sdk';

// Create the agent - reads from environment variables
const agent = createGaiaAgent();

const result = await agent.generate({
  prompt: 'Calculate 15 * 23 and search for the latest AI papers',
});

console.log(result.text);
```

### Environment Setup

Create a `.env` file:

```bash
# Required
OPENAI_API_KEY=sk-...

# Default providers (at least one required)
TAVILY_API_KEY=tvly-...      # Search
E2B_API_KEY=...              # Sandbox
STEEL_API_KEY=steel_live_... # Browser
```

📖 **[Complete environment variables guide →](./docs/environment-variables.md)**

---

## 🛠️ Built-in Tools

| Category | Tools | Providers |
|----------|-------|-----------|
| 🧮 **Core** | calculator, httpRequest | Built-in |
| 🔍 **Search** | tavilySearch, exaSearch, exaGetContents | Tavily (default), Exa |
| 🛡️ **Sandbox** | e2bSandbox, sandockExecute | E2B (default), Sandock |
| 🖥️ **Browser** | steelBrowser, browserUseTool, awsBrowser | Steel (default), BrowserUse, AWS |
| 🧠 **Memory** | mem0Remember, mem0Recall, memoryStore | Mem0 (default), AWS AgentCore |

📖 **[Full tools documentation →](./docs/tools-reference.md)**  
📖 **[Provider comparison →](./docs/providers.md)**

---

## 🔄 Swap Providers

Switch providers with one line:

```typescript
import { createGaiaAgent } from '@gaia-agent/sdk';

const agent = createGaiaAgent({
  providers: {
    search: 'exa',              // Use Exa instead of Tavily
    sandbox: 'sandock',         // Use Sandock instead of E2B
    browser: 'browseruse',      // Use BrowserUse instead of Steel
  },
});
```

Or set via environment variables:

```bash
GAIA_AGENT_SEARCH_PROVIDER=exa
GAIA_AGENT_SANDBOX_PROVIDER=sandock
GAIA_AGENT_BROWSER_PROVIDER=browseruse
```

---

## 🎯 GAIA Benchmark

Run official GAIA benchmarks with enhanced results tracking:

```bash
# Basic benchmark
pnpm benchmark                  # Run validation set
pnpm benchmark --limit 10       # Test with 10 tasks

# Resume interrupted runs
pnpm benchmark --resume         # Continue from checkpoint

# Filter by capability
pnpm benchmark:files            # Tasks with file attachments
pnpm benchmark:code             # Code execution tasks
pnpm benchmark:search           # Web search tasks
pnpm benchmark:browser          # Browser automation tasks

# Stream mode (real-time thinking)
pnpm benchmark:random --stream  # Watch agent think in real-time

# Wrong answers collection
pnpm benchmark:wrong            # Retry only failed tasks
```

### 📚 Wrong Answers Collection

Automatically track and retry failed tasks:

```bash
# 1. Run benchmark (auto-creates wrong-answers.json)
pnpm benchmark --limit 20

# 2. View wrong answers
cat benchmark-results/wrong-answers.json

# 3. Retry only failed tasks
pnpm benchmark:wrong --verbose

# 4. Keep retrying until all pass
pnpm benchmark:wrong
# → "🎉 No wrong answers! All previous tasks passed."
```

📖 **[Wrong answers guide →](./docs/wrong-answers.md)**  
📖 **[Resume feature guide →](./docs/resume-feature.md)**  
📖 **[Benchmark module docs →](./docs/benchmark.md)**  
📖 **[GAIA setup guide →](./docs/gaia-benchmark.md)**

---

## 📊 Enhanced Benchmark Results

Benchmark results now include full task details:

```json
{
  "taskId": "abc123",
  "question": "What year was X founded?",
  "level": 2,
  "files": ["image.png"],
  "answer": "1927",
  "expectedAnswer": "1927",
  "correct": true,
  "durationMs": 5234,
  "steps": 3,
  "toolsUsed": ["search", "browser"],
  "summary": {
    "totalToolCalls": 5,
    "uniqueTools": ["search", "browser", "calculator"],
    "hadError": false
  },
  "stepDetails": [ /* ... */ ]
}
```

Easier to analyze and debug! 🎉

---

## 🧪 Testing

Run unit tests with Vitest:

```bash
pnpm test                # Run all tests
pnpm test:watch          # Watch mode
pnpm test:coverage       # Coverage report
```

📖 **[Testing guide →](./docs/testing.md)**

---

## 🎯 Advanced Usage

### Custom Tools

```typescript
import { createGaiaAgent, getDefaultTools } from '@gaia-agent/sdk';
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
import { GAIAAgent } from '@gaia-agent/sdk';

class ResearchAgent extends GAIAAgent {
  constructor() {
    super({
      instructions: 'Research assistant specialized in AI papers',
      additionalTools: { /* custom tools */ },
    });
  }
}
```

📖 **[Advanced usage guide →](./docs/advanced-usage.md)**  
📖 **[API reference →](./docs/api-reference.md)**

---

## 📚 Documentation

<table>
<tr>
<td width="50%">

### 📖 Guides
- **[Quick Start Guide](./docs/quick-start.md)** - Get started in 5 minutes
- **[Environment Variables](./docs/environment-variables.md)** - Complete configuration guide
- **[GAIA Benchmark](./docs/gaia-benchmark.md)** - Requirements, setup, tips
- **[Wrong Answers Collection](./docs/wrong-answers.md)** - Error tracking and retry
- **[Provider Comparison](./docs/providers.md)** - Detailed provider comparison

</td>
<td width="50%">

### 🔧 Reference
- **[API Reference](./docs/api-reference.md)** - Complete API documentation
- **[Tools Reference](./docs/tools-reference.md)** - All available tools
- **[Advanced Usage](./docs/advanced-usage.md)** - Extension examples, patterns
- **[Benchmark Module](./docs/benchmark.md)** - Modular architecture
- **[Testing Guide](./docs/testing.md)** - Unit tests with Vitest

</td>
</tr>
</table>

---

## 🤝 Contributing

This project uses automated NPM publishing. When changes are merged to `main`:

1. ✅ Tests run automatically
2. 📦 Version bumps to next patch (e.g., 0.1.0 → 0.1.1)
3. 📝 Changelog created in `changelog/`
4. 🚀 Published to NPM
5. 🏷️ Git tag created

For manual version bumps (minor/major), see [docs/NPM_PUBLISH_SETUP.md](./docs/NPM_PUBLISH_SETUP.md).

---

## 📄 License

Apache License 2.0

---

<div align="center">
  <p>Made with ❤️ for the AI community</p>
</div>
