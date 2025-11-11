# Quick Start Guide

Get started with GAIA Agent in 5 minutes.

## Prerequisites

- **Node.js** v18+ (v22.16.0 recommended)
- **pnpm** (or npm/yarn)
- **OpenAI API key** ([Get one here](https://platform.openai.com/api-keys))
- **Provider API keys** (at least one of: Tavily, E2B, Steel)

## Step 1: Installation

```bash
# Install the package
npm install @gaia-agent/sdk ai @ai-sdk/openai zod

# Or with pnpm
pnpm add @gaia-agent/sdk ai @ai-sdk/openai zod
```

## Step 2: Get API Keys

You need API keys for the default providers:

### Required
- **OpenAI**: https://platform.openai.com/api-keys

### Recommended (pick at least one for each category)
- **Search**: [Tavily](https://tavily.com) (free tier available)
- **Sandbox**: [E2B](https://e2b.dev) (free tier available)
- **Browser**: [Steel](https://steel.dev) (free trial available)

### Optional
- **Memory**: [Mem0](https://mem0.ai) (optional, not required for basic usage)

## Step 3: Environment Variables

Create a `.env` file in your project root:

```bash
# Required
OPENAI_API_KEY=sk-...

# Default providers (recommended)
TAVILY_API_KEY=tvly-...
E2B_API_KEY=...
STEEL_API_KEY=steel_live_...

# Optional
MEM0_API_KEY=...
```

**Don't have all API keys yet?** No problem! Start with just OpenAI + one provider:

```bash
# Minimal setup (OpenAI + Search only)
OPENAI_API_KEY=sk-...
TAVILY_API_KEY=tvly-...
```

📖 **[See complete environment setup →](./environment-variables.md)**

## Step 4: Your First Agent

Create `index.ts`:

```typescript
import { createGaiaAgent } from '@gaia-agent/sdk';

// Create the agent (reads from .env)
const agent = createGaiaAgent();

// Ask a question
const result = await agent.generate({
  prompt: 'What is 15 * 23?',
});

console.log(result.text); // "The result is 345"
```

Run it:

```bash
tsx index.ts
# or
node --loader tsx index.ts
```

## Step 5: Try Different Tasks

### Math Calculation

```typescript
const result = await agent.generate({
  prompt: 'Calculate the square root of 144',
});
```

### Web Search

```typescript
const result = await agent.generate({
  prompt: 'Search for the latest AI news and summarize',
});
```

### Code Execution

```typescript
const result = await agent.generate({
  prompt: 'Write and execute Python code to calculate fibonacci(10)',
});
```

### Browser Automation

```typescript
const result = await agent.generate({
  prompt: 'Navigate to example.com and get the page title',
});
```

### Combined Tasks

```typescript
const result = await agent.generate({
  prompt: 'Search for the population of Tokyo, then calculate what 10% of that number is',
});
```

## Step 6: Customize Your Agent

### Use Different Model

```typescript
import { createGaiaAgent } from '@gaia-agent/sdk';
import { openai } from '@ai-sdk/openai';

const agent = createGaiaAgent({
  model: openai('gpt-4-turbo'),
});
```

### Swap Providers

```typescript
const agent = createGaiaAgent({
  providers: {
    search: 'exa',        // Use Exa instead of Tavily
    browser: 'browseruse', // Use BrowserUse instead of Steel
  },
});
```

### Custom Instructions

```typescript
const agent = createGaiaAgent({
  instructions: 'You are a helpful research assistant. Always cite your sources.',
});
```

### Add Custom Tools

```typescript
import { tool } from 'ai';
import { z } from 'zod';

const agent = createGaiaAgent({
  tools: {
    weatherTool: tool({
      description: 'Get current weather',
      parameters: z.object({ city: z.string() }),
      execute: async ({ city }) => {
        // Your weather API call
        return { temp: 72, condition: 'sunny' };
      },
    }),
  },
});
```

## Step 7: Run GAIA Benchmark

Test your agent against the official GAIA benchmark:

```bash
# Install project dependencies first
git clone https://github.com/gaia-agent/gaia-agent
cd gaia-agent
pnpm install

# Run benchmark
pnpm benchmark:random           # Test with 1 random task
pnpm benchmark --limit 5        # Test with 5 tasks
pnpm benchmark:quick            # Test with 5 tasks (verbose)
```

📖 **[See full benchmark guide →](./gaia-benchmark.md)**

## Common Issues

### "API key not found"

Make sure your `.env` file is in the project root and contains valid API keys.

```bash
# Check if .env exists
cat .env

# Make sure it's loaded (if using tsx)
node --env-file=.env your-script.ts
```

### "Provider not configured"

You need API keys for the default providers. Either:
1. Add the missing API key to `.env`
2. Switch to a different provider you have configured

```typescript
// Example: Use Exa if you don't have Tavily key
const agent = createGaiaAgent({
  providers: { search: 'exa' }
});
```

### "Tool not available"

Some tools require specific providers. Check the error message:

```
Error: Browser tool requires Steel, BrowserUse, or AWS provider
```

Install the required provider or disable that capability.

📖 **[See troubleshooting guide →](./environment-variables.md#troubleshooting)**

## Next Steps

🎯 **[Run GAIA Benchmark](./gaia-benchmark.md)** - Test against official tasks  
🔧 **[Explore All Tools](./tools-reference.md)** - See all 16+ built-in tools  
🔄 **[Compare Providers](./providers.md)** - Choose the best providers  
📖 **[Advanced Usage](./advanced-usage.md)** - Custom agents, patterns, tips  
🧪 **[Testing](./testing.md)** - Unit tests with Vitest

## Example Projects

Check out example implementations:

- **Research Agent** - Searches papers and summarizes findings
- **Data Analysis Agent** - Processes spreadsheets and generates reports
- **Web Scraper Agent** - Navigates websites and extracts data
- **Code Assistant** - Writes, tests, and debugs code

📁 **[See examples folder →](../examples)** (coming soon)

## Get Help

- 📖 [Full Documentation](./README.md)
- 💬 [GitHub Discussions](https://github.com/gaia-agent/gaia-agent/discussions)
- 🐛 [Report Issues](https://github.com/gaia-agent/gaia-agent/issues)
- 🐦 [Follow Updates](https://twitter.com/yourusername)

---

**Ready to build?** Start with the [API Reference](./api-reference.md) →
