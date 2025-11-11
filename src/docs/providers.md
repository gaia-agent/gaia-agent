# Provider Comparison and Swapping Guide

## Overview

gaia-agent uses a provider pattern for tool categories, allowing you to swap implementations based on your needs:

- **Sandbox**: Code execution environment
- **Browser**: Web automation
- **Search**: Web search and content retrieval
- **Memory**: Agent memory persistence

## Sandbox Providers

### E2B (Recommended)

**SDK**: `e2b@^2.6.3`

**Features**:
- Cloud-based code interpreter
- Python, JavaScript/TypeScript support
- Filesystem operations (readFile, writeFile)
- Package installation (pip, npm)
- Persistent environments
- Production-ready reliability

**When to Use**:
- Production deployments
- GAIA benchmarks
- Reliable code execution needed
- Don't want to manage infrastructure

**Setup**:
```typescript
import { e2bSandbox } from '@gaia-agent/sdk/tools/sandbox';

const agent = createGaiaAgent({
  tools: { sandbox: e2bSandbox },
});

// Environment
// E2B_API_KEY=your-e2b-key
```

### Sandock (Alternative)

**SDK**: Placeholder (awaiting official SDK)

**Features**:
- Self-hosted option
- Python, JavaScript, Bash
- Browser automation included
- Shell command execution

**When to Use**:
- Self-hosted deployments
- Need full control
- Browser + code in same sandbox

**Setup**:
```typescript
import { sandockExecute } from '@gaia-agent/sdk/tools/sandbox';

const agent = createGaiaAgent({
  tools: { sandbox: sandockExecute },
});

// Environment
// SANDOCK_API_KEY=your-sandock-key
```

## Browser Providers

### BrowserUse (Recommended)

**SDK**: `browser-use-sdk@^2.0.4`

**Features**:
- AI-optimized browser automation
- Modern Chrome automation
- Element extraction
- Screenshot capture
- TypeScript SDK

**When to Use**:
- Modern web scraping
- AI-driven interactions
- Need TypeScript SDK
- Production browser automation

**Setup**:
```typescript
import { browserUseTool } from '@gaia-agent/sdk/tools/browser';

const agent = createGaiaAgent({
  tools: { browser: browserUseTool },
});

// Environment
// BROWSERUSE_API_KEY=your-browseruse-key
```

### AWS AgentCore Browser (Alternative)

**SDK**: REST API (no npm package)

**Features**:
- AWS Bedrock integration
- Navigate, click, type, screenshot
- Enterprise-grade reliability
- AWS ecosystem integration

**When to Use**:
- Already using AWS infrastructure
- Enterprise deployments
- Need AWS compliance/security

**Setup**:
```typescript
import {
  browserNavigate,
  browserGetContent,
  browserClick,
  browserType,
  browserScreenshot,
} from '@gaia-agent/sdk/tools/browser';

const agent = createGaiaAgent({
  tools: {
    browserNavigate,
    browserGetContent,
    browserClick,
    browserType,
    browserScreenshot,
  },
});

// Environment
// AWS_ACCESS_KEY_ID=your-aws-key
// AWS_SECRET_ACCESS_KEY=your-aws-secret
```

## Search Providers

### Tavily (Recommended for Q&A)

**SDK**: `@tavily/core@^0.5.12`

**Features**:
- AI-optimized search
- Automatic answer generation
- Source verification
- Domain filtering
- Search depth control

**When to Use**:
- Fact-checking
- Q&A tasks
- Current events
- Need cited sources

**Setup**:
```typescript
import { tavilySearch } from '@gaia-agent/sdk/tools/search';

const agent = createGaiaAgent({
  tools: { search: tavilySearch },
});

// Environment
// TAVILY_API_KEY=your-tavily-key
```

### Exa (Recommended for Research)

**SDK**: `exa-js@^2.0.0`

**Features**:
- Neural semantic search
- Content extraction (full text)
- Find similar content by URL
- Category filtering (research papers, news, etc.)
- Date filtering

**When to Use**:
- Academic research
- Deep content analysis
- Finding similar content
- Need full text extraction

**Setup**:
```typescript
import { exaSearch, exaGetContents, exaFindSimilar } from '@gaia-agent/sdk/tools/search';

const agent = createGaiaAgent({
  tools: {
    exaSearch,
    exaGetContents,
    exaFindSimilar,
  },
});

// Environment
// EXA_API_KEY=your-exa-key
```

### Using Both (Recommended)

```typescript
import { tavilySearch } from '@gaia-agent/sdk/tools/search';
import { exaSearch, exaGetContents } from '@gaia-agent/sdk/tools/search';

const agent = createGaiaAgent({
  tools: {
    tavilySearch,  // For Q&A and fact-checking
    exaSearch,     // For research and deep content
    exaGetContents,
  },
});
```

## Memory Providers

### Mem0 (Default)

**SDK**: REST API

**Features**:
- Persistent agent memory
- Context retention across tasks
- Remember/recall operations

**When to Use**:
- Multi-step tasks
- Need context retention
- Building conversational agents

**Setup**:
```typescript
import { mem0Remember, mem0Recall } from '@gaia-agent/sdk/tools/memory';

const agent = createGaiaAgent({
  tools: {
    mem0Remember,
    mem0Recall,
  },
});

// Environment
// MEM0_API_KEY=your-mem0-key
```

## Swapping Patterns

### 1. Simple Swap

```typescript
import { createGaiaAgent } from '@gaia-agent/sdk';
import { e2bSandbox } from '@gaia-agent/sdk/tools/sandbox';

const agent = createGaiaAgent({
  tools: {
    sandbox: e2bSandbox,  // Use E2B instead of default
  },
});
```

### 2. Multiple Swaps

```typescript
import { createGaiaAgent } from '@gaia-agent/sdk';
import { e2bSandbox } from '@gaia-agent/sdk/tools/sandbox';
import { browserUseTool } from '@gaia-agent/sdk/tools/browser';

const agent = createGaiaAgent({
  tools: {
    sandbox: e2bSandbox,
    browser: browserUseTool,
  },
});
```

### 3. Mix Default + Custom

```typescript
import { createGaiaAgent, getDefaultTools } from '@gaia-agent/sdk';
import { e2bSandbox } from '@gaia-agent/sdk/tools/sandbox';

const agent = createGaiaAgent({
  tools: {
    ...getDefaultTools(),  // All default tools
    sandbox: e2bSandbox,   // Override just sandbox
  },
});
```

### 4. Selective Import

```typescript
import { createGaiaAgent } from '@gaia-agent/sdk';
import { calculator, httpRequest } from '@gaia-agent/sdk/tools/core';
import { tavilySearch } from '@gaia-agent/sdk/tools/search';
import { e2bSandbox } from '@gaia-agent/sdk/tools/sandbox';

const agent = createGaiaAgent({
  tools: {
    calculator,
    httpRequest,
    search: tavilySearch,
    sandbox: e2bSandbox,
  },
});
```

## Comparison Table

| Category | Provider | SDK Available | Production Ready | Cost | Self-Hosted |
|----------|----------|---------------|------------------|------|-------------|
| **Sandbox** | E2B | ✅ | ✅ | Pay-per-use | ❌ |
| | Sandock | ⏳ | ⏳ | TBD | ✅ |
| **Browser** | BrowserUse | ✅ | ✅ | Pay-per-use | ❌ |
| | AWS AgentCore | ❌ (REST) | ✅ | AWS pricing | ❌ |
| **Search** | Tavily | ✅ | ✅ | Pay-per-request | ❌ |
| | Exa | ✅ | ✅ | Pay-per-request | ❌ |
| **Memory** | Mem0 | ❌ (REST) | ✅ | Pay-per-use | ❌ |

## Recommended Combinations

### For GAIA Benchmarks
```typescript
{
  sandbox: e2bSandbox,      // Reliable code execution
  browser: browserUseTool,   // Modern browser automation
  search: tavilySearch,      // Q&A tasks
  exaSearch,                 // Research tasks
}
```

### For Production Agents
```typescript
{
  sandbox: e2bSandbox,       // Cloud-managed reliability
  browser: browserUseTool,    // AI-optimized automation
  search: tavilySearch,       // Fast, cited results
  memory: mem0Remember,       // Context retention
}
```

### For Self-Hosted
```typescript
{
  sandbox: sandockExecute,    // Self-hosted sandbox
  browser: awsBrowserTools,   // Enterprise browser (if on AWS)
  search: tavilySearch,       // External search still recommended
}
```

## See Also

- [GAIA Benchmark Guide](./gaia-benchmark.md) - Requirements for benchmarks
- [Tools Reference](./tools-reference.md) - Complete tool API
- [Advanced Usage](./advanced-usage.md) - Custom tool development
