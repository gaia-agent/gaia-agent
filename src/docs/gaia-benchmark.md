# GAIA Benchmark Guide

## Overview

The GAIA (General AI Assistants) benchmark tests AI agents on real-world tasks requiring multiple capabilities: web search, code execution, file manipulation, and reasoning.

## Core Requirements

To successfully run GAIA benchmarks, your agent needs:

### 1. Essential Tools (Non-Swappable)
- ✅ **calculator** - Mathematical calculations
- ✅ **httpRequest** - HTTP API calls

### 2. Swappable Provider Tools

#### Sandbox (Code Execution) - **Required**
Choose one:

| Provider | SDK | Capabilities | When to Use |
|----------|-----|--------------|-------------|
| **E2B** ⭐ | `e2b` | Python, JavaScript, filesystem, package installation | Production use, reliable cloud sandbox |
| **Sandock** | TBD | Python, JS, Bash, browser automation | Self-hosted, more control |

**Recommendation**: Use E2B for production GAIA benchmarks.

```typescript
import { createGaiaAgent } from '@gaia-agent/sdk';
import { e2bSandbox } from '@gaia-agent/sdk/tools/sandbox';

const agent = createGaiaAgent({
  tools: {
    sandbox: e2bSandbox,  // Swap sandbox provider
  },
});
```

#### Browser Automation - **Highly Recommended**
Choose one:

| Provider | SDK | Capabilities | When to Use |
|----------|-----|--------------|-------------|
| **BrowserUse** ⭐ | `browser-use-sdk` | Navigate, extract content, interact with elements | Modern, AI-optimized browser automation |
| **AWS AgentCore** | REST API | Navigate, click, type, screenshot | AWS infrastructure, enterprise |

**Recommendation**: Use BrowserUse for better AI integration.

```typescript
import { browserUseTool } from '@gaia-agent/sdk/tools/browser';

const agent = createGaiaAgent({
  tools: {
    browser: browserUseTool,  // Swap browser provider
  },
});
```

#### Search - **Highly Recommended**
Choose one or both:

| Provider | SDK | Capabilities | When to Use |
|----------|-----|--------------|-------------|
| **Tavily** | `@tavily/core` | AI-optimized search, automatic answers | Fact-checking, Q&A tasks |
| **Exa** | `exa-js` | Neural semantic search, content extraction | Research, academic papers, deep content |

**Recommendation**: Use Tavily for general tasks, add Exa for research-heavy benchmarks.

```typescript
import { tavilySearch } from '@gaia-agent/sdk/tools/search';
import { exaSearch, exaGetContents } from '@gaia-agent/sdk/tools/search';

const agent = createGaiaAgent({
  tools: {
    search: tavilySearch,      // Or use both
    exaSearch,
    exaGetContents,
  },
});
```

#### Memory - **Optional**
| Provider | SDK | Capabilities | When to Use |
|----------|-----|--------------|-------------|
| **Mem0** | REST API | Persistent agent memory | Multi-step tasks requiring context |

## Running GAIA Benchmarks

### Prerequisites

```bash
# Required
export OPENAI_API_KEY=sk-...

# Choose your providers
export E2B_API_KEY=...              # For E2B sandbox
export BROWSERUSE_API_KEY=...       # For BrowserUse
export TAVILY_API_KEY=...           # For Tavily search
export EXA_API_KEY=...              # For Exa search (optional)
```

### Run Benchmarks

```bash
# Full validation set
pnpm run benchmark

# Test set
pnpm run benchmark:test

# Filter by difficulty level (1-3)
pnpm run benchmark:level2

# Quick test (5 tasks)
pnpm run benchmark:quick
```

### Example Configuration for GAIA

```typescript
import { createGaiaAgent, getDefaultTools } from '@gaia-agent/sdk';
import { e2bSandbox } from '@gaia-agent/sdk/tools/sandbox';
import { browserUseTool } from '@gaia-agent/sdk/tools/browser';
import { tavilySearch, exaSearch } from '@gaia-agent/sdk/tools/search';

// Optimized for GAIA benchmarks
const agent = createGaiaAgent({
  model: openai('gpt-4o'),
  maxSteps: 20,  // Allow complex multi-step reasoning
  tools: {
    // Core (always included)
    ...getDefaultTools(),
    
    // Swap to preferred providers
    sandbox: e2bSandbox,      // E2B for reliable code execution
    browser: browserUseTool,   // BrowserUse for modern automation
    search: tavilySearch,      // Tavily for Q&A
    exaSearch,                 // Exa for research tasks
  },
});
```

## Expected Results

GAIA benchmark levels:
- **Level 1**: 30-40% accuracy (simple tasks)
- **Level 2**: 15-25% accuracy (moderate complexity)
- **Level 3**: 5-15% accuracy (hard tasks)

With optimal tool configuration (E2B + BrowserUse + Tavily + Exa):
- Overall accuracy: **20-30%** (competitive with baseline agents)
- Average steps: **3-5 steps per task**
- Average duration: **30-60 seconds per task**

## Troubleshooting

### Common Issues

**"Sandbox execution failed"**
- Ensure `E2B_API_KEY` is set
- Check E2B quota/credits
- Try Sandock as fallback

**"Browser automation timeout"**
- Increase maxSteps in agent config
- Check BROWSERUSE_API_KEY or AWS credentials
- Some sites may block automation

**"Search returned no results"**
- Verify TAVILY_API_KEY or EXA_API_KEY
- Check API rate limits
- Use httpRequest tool as fallback

## Best Practices

1. **Use E2B for Sandbox** - Most reliable for code execution
2. **Enable Both Search Providers** - Tavily for Q&A, Exa for research
3. **Set maxSteps = 20+** - GAIA tasks can be complex
4. **Monitor API Usage** - Search and sandbox can consume credits
5. **Save Results** - Use `--output` to save detailed logs

## See Also

- [Provider Comparison](./providers.md) - Detailed provider feature comparison
- [Tools Reference](./tools-reference.md) - Complete tool API documentation
- [Advanced Usage](./advanced-usage.md) - Custom agents and tool development
