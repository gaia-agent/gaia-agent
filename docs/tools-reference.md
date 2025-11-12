# Tools Reference

Complete reference for all 16+ built-in tools in GAIA Agent.

## Overview

GAIA Agent provides production-ready tools organized by category:

| Category | Count | Providers |
|----------|-------|-----------|
| 🧮 Core | 2 | Built-in |
| 🔍 Search | 3 | Tavily, Exa |
| 🛡️ Sandbox | 2 | E2B, Sandock |
| 🖥️ Browser | 3 | Steel, BrowserUse, AWS |
| 🧠 Memory | 5 | Mem0, AWS AgentCore |

**Total:** 15 tools across 5 categories

---

## 🧮 Core Tools

Built-in tools that don't require external providers.

### `calculator`

Perform mathematical calculations.

**Usage:**
```typescript
const result = await agent.generate({
  prompt: 'Calculate 15 * 23',
});
// Uses calculator tool automatically
```

**Parameters:**
- `expression` (string) - Mathematical expression to evaluate

**Example:**
```typescript
// The agent will automatically use this tool
"What is 123 + 456?"
"Calculate the square root of 144"
"15 * 23 - 10"
```

**Provider:** Built-in (no API key required)

---

### `httpRequest`

Make HTTP requests to external APIs.

**Usage:**
```typescript
const result = await agent.generate({
  prompt: 'Fetch data from https://api.example.com/users',
});
```

**Parameters:**
- `url` (string) - The URL to request
- `method` (string) - HTTP method (GET, POST, etc.)
- `headers` (object, optional) - Request headers
- `body` (string, optional) - Request body

**Example:**
```typescript
"Get the response from https://api.github.com/users/octocat"
"POST to https://api.example.com with JSON body {name: 'test'}"
```

**Provider:** Built-in (no API key required)

---

## 🔍 Search Tools

Web search and content retrieval.

### `tavilySearch`

AI-powered search with Tavily (default provider).

**Usage:**
```typescript
const agent = createGaiaAgent({
  providers: { search: 'tavily' } // Default
});

const result = await agent.generate({
  prompt: 'Search for the latest AI news',
});
```

**Parameters:**
- `query` (string) - Search query

**Example:**
```typescript
"Search for Python asyncio best practices"
"Find the latest news about GPT-4"
"What is the population of Tokyo?"
```

**Provider:** Tavily  
**API Key:** `TAVILY_API_KEY`  
**Free Tier:** Yes (1000 requests/month)  
**Get Key:** https://tavily.com

---

### `exaSearch`

Neural search with Exa for semantic understanding.

**Usage:**
```typescript
const agent = createGaiaAgent({
  providers: { search: 'exa' }
});

const result = await agent.generate({
  prompt: 'Find research papers about transformers',
});
```

**Parameters:**
- `query` (string) - Search query
- `numResults` (number, optional) - Number of results (default: 10)
- `useAutoprompt` (boolean, optional) - Use Exa's autoprompt feature

**Example:**
```typescript
"Find academic papers about reinforcement learning"
"Search for company information about OpenAI"
"What are the latest developments in quantum computing?"
```

**Provider:** Exa  
**API Key:** `EXA_API_KEY`  
**Free Tier:** Yes (1000 requests/month)  
**Get Key:** https://exa.ai

---

### `exaGetContents`

Retrieve full content from URLs found via Exa search.

**Usage:**
```typescript
const result = await agent.generate({
  prompt: 'Search for AI news and get the full content of the top result',
});
```

**Parameters:**
- `ids` (string[]) - Document IDs from previous search
- `text` (boolean, optional) - Include text content

**Example:**
```typescript
// Usually called automatically after exaSearch
"Search for the latest AI paper and summarize it"
```

**Provider:** Exa  
**API Key:** `EXA_API_KEY`

---

## 🛡️ Sandbox Tools

Code execution in secure environments.

### `e2bSandbox`

Cloud sandbox by E2B (default provider).

**Usage:**
```typescript
const agent = createGaiaAgent({
  providers: { sandbox: 'e2b' } // Default
});

const result = await agent.generate({
  prompt: 'Run Python code to calculate fibonacci(10)',
});
```

**Parameters:**
- `code` (string) - Code to execute
- `language` (string, optional) - Programming language (default: python)

**Example:**
```typescript
"Execute Python code: print('Hello World')"
"Write and run a Node.js script that reads a file"
"Calculate factorial(5) using Python"
```

**Provider:** E2B  
**API Key:** `E2B_API_KEY`  
**Free Tier:** Yes (sandbox hours included)  
**Get Key:** https://e2b.dev

**Features:**
- ✅ Python, Node.js, Bash support
- ✅ Filesystem operations
- ✅ Package installation (pip, npm)
- ✅ Persistent sessions

---

### `sandockExecute`

Code execution via Sandock API.

**Usage:**
```typescript
const agent = createGaiaAgent({
  providers: { sandbox: 'sandock' }
});

const result = await agent.generate({
  prompt: 'Run a Python script',
});
```

**Parameters:**
- `code` (string) - Code to execute
- `language` (string, optional) - Programming language

**Provider:** Sandock  
**API Key:** `SANDOCK_API_KEY`  
**Get Key:** https://sandock.io

---

## 🖥️ Browser Tools

Web automation and browser control.

### `steelBrowser`

Browser automation with Steel (default provider).

**Usage:**
```typescript
const agent = createGaiaAgent({
  providers: { browser: 'steel' } // Default
});

const result = await agent.generate({
  prompt: 'Navigate to example.com and get the page title',
});
```

**Parameters:**
- `action` (string) - Action to perform (navigate, click, type, screenshot)
- `url` (string, optional) - URL to navigate to
- `selector` (string, optional) - CSS selector for element
- `text` (string, optional) - Text to type

**Example:**
```typescript
"Go to https://github.com and screenshot the page"
"Navigate to example.com, click the login button"
"Type 'search query' in the search box on google.com"
```

**Provider:** Steel  
**API Key:** `STEEL_API_KEY`  
**Free Trial:** Yes  
**Get Key:** https://steel.dev

**Features:**
- ✅ Playwright-based CDP control
- ✅ Screenshots
- ✅ Element interaction (click, type, select)
- ✅ JavaScript execution
- ✅ Wait for elements

---

### `browserUseTool`

Browser automation with BrowserUse SDK.

**Usage:**
```typescript
const agent = createGaiaAgent({
  providers: { browser: 'browseruse' }
});

const result = await agent.generate({
  prompt: 'Navigate to a website and extract data',
});
```

**Parameters:**
- `task` (string) - Natural language task description

**Example:**
```typescript
"Go to GitHub and find the top trending repository"
"Navigate to Wikipedia and search for 'AI'"
```

**Provider:** BrowserUse  
**API Key:** `BROWSERUSE_API_KEY` (may require OpenAI key)  
**Get Key:** https://browseruse.com

**Features:**
- ✅ Natural language control
- ✅ Smart element detection
- ✅ Multi-step tasks

---

### `awsBrowser`

Browser automation via AWS AgentCore.

**Usage:**
```typescript
const agent = createGaiaAgent({
  providers: { browser: 'aws' }
});
```

**Parameters:**
- `action` (string) - Browser action
- `params` (object) - Action parameters

**Provider:** AWS AgentCore  
**API Keys:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`  
**Get Key:** https://aws.amazon.com/bedrock

**Status:** ⚠️ Placeholder implementation (requires AWS SDK)

---

## 🧠 Memory Tools

Persistent agent memory across sessions.

### `mem0Remember`

Store information in Mem0 (default provider).

**Usage:**
```typescript
const agent = createGaiaAgent({
  providers: { memory: 'mem0' } // Default
});

const result = await agent.generate({
  prompt: 'Remember that my favorite color is blue',
});
```

**Parameters:**
- `messages` (array) - Messages to store with role and content

**Example:**
```typescript
"Remember my name is John"
"Store that I prefer dark mode"
"Remember my birthday is January 1st"
```

**Provider:** Mem0  
**API Key:** `MEM0_API_KEY`  
**Get Key:** https://mem0.ai

---

### `mem0Recall`

Retrieve stored memories from Mem0.

**Usage:**
```typescript
const result = await agent.generate({
  prompt: 'What is my favorite color?',
});
```

**Parameters:**
- `query` (string) - Search query for memories

**Example:**
```typescript
"What is my name?"
"Recall my preferences"
"What did I tell you about my birthday?"
```

**Provider:** Mem0  
**API Key:** `MEM0_API_KEY`

---

### `memoryStore` (AWS AgentCore)

Store information in AWS AgentCore Memory.

**Usage:**
```typescript
const agent = createGaiaAgent({
  providers: { memory: 'agentcore' }
});

const result = await agent.generate({
  prompt: 'Store in session-123: User prefers concise answers',
});
```

**Parameters:**
- `sessionId` (string) - Session identifier
- `content` (string) - Content to store
- `metadata` (object, optional) - Additional metadata

**Provider:** AWS AgentCore  
**API Keys:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

**Features:**
- ✅ Session-based isolation
- ✅ Metadata support
- ✅ Query-based retrieval

---

### `memoryRetrieve` (AWS AgentCore)

Retrieve memories from AWS AgentCore.

**Usage:**
```typescript
const result = await agent.generate({
  prompt: 'Retrieve all memories for session-123',
});
```

**Parameters:**
- `sessionId` (string) - Session identifier
- `query` (string, optional) - Search query

**Provider:** AWS AgentCore

---

### `memoryDelete` (AWS AgentCore)

Delete specific memories from AWS AgentCore.

**Usage:**
```typescript
const result = await agent.generate({
  prompt: 'Delete memory with id abc123 from session-123',
});
```

**Parameters:**
- `sessionId` (string) - Session identifier
- `memoryId` (string) - Memory identifier to delete

**Provider:** AWS AgentCore

---

## Tool Selection

Tools are automatically selected by the AI model based on the task. You can also manually specify which tools to use:

### Use Specific Tools

```typescript
import { createGaiaAgent } from '@gaia-agent/sdk';
import { tavilySearch, calculator } from '@gaia-agent/sdk/tools/search';

const agent = createGaiaAgent({
  tools: {
    tavilySearch,
    calculator,
  },
});
```

### Disable Specific Categories

```typescript
const agent = createGaiaAgent({
  providers: {
    memory: null, // Disable memory tools
  },
});
```

---

## Tool Execution Flow

1. **User sends prompt** to agent
2. **Agent analyzes** the task
3. **Agent selects** appropriate tool(s)
4. **Tool executes** with inputSchema
5. **Result returned** to agent
6. **Agent synthesizes** final response

**Example multi-tool execution:**

```
User: "Search for Python tutorials and calculate 15 * 23"

1. Agent calls tavilySearch({ query: "Python tutorials" })
2. Agent calls calculator({ expression: "15 * 23" })
3. Agent synthesizes: "I found Python tutorials at... and 15 * 23 = 345"
```

---

## Custom Tools

Add your own tools:

```typescript
import { tool } from 'ai';
import { z } from 'zod';

const weatherTool = tool({
  description: 'Get current weather for a city',
  inputSchema: z.object({
    city: z.string().describe('City name'),
  }),
  execute: async ({ city }) => {
    // Your weather API call
    return { temp: 72, condition: 'sunny' };
  },
});

const agent = createGaiaAgent({
  tools: { weatherTool },
});
```

📖 **[See advanced usage →](./advanced-usage.md)**

---

## Provider Comparison

See detailed comparison of all providers:

📖 **[Provider comparison guide →](./providers.md)**

---

## Next Steps

- 🚀 **[Run GAIA Benchmark](./gaia-benchmark.md)** - Test your agent
- 📖 **[API Reference](./api-reference.md)** - Complete API docs
- 🔧 **[Advanced Usage](./advanced-usage.md)** - Patterns and tips
- 🌐 **[Environment Variables](./environment-variables.md)** - Configuration guide
