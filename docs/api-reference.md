# API Reference

Complete API documentation for gaia-agent SDK.

## Core Exports

### `gaiaAgent`

Pre-configured ToolLoopAgent ready to use:

```typescript
import { gaiaAgent } from '@gaia-agent/sdk';

const result = await gaiaAgent.generate({
  prompt: 'Calculate 15 * 23'
});

console.log(result.text);
```

**Type:** `ToolLoopAgent`

**Default Configuration:**
- Model: `gpt-4o` (from `OPENAI_MODEL` env var)
- Max steps: 15
- Tools: All default tools (search, sandbox, browser, memory, core)
- Providers: From environment variables or defaults

---

### `createGaiaAgent(config?)`

Create a custom agent with specific configuration:

```typescript
import { createGaiaAgent } from '@gaia-agent/sdk';
import { openai } from '@ai-sdk/openai';

const agent = createGaiaAgent({
  model: openai('gpt-4-turbo'),
  instructions: 'You are a research assistant',
  maxSteps: 20,
  providers: {
    search: 'exa',
    sandbox: 'e2b',
    browser: 'steel',
  },
});
```

**Parameters:**

```typescript
interface Config {
  /** Language model to use */
  model?: LanguageModel;
  
  /** System instructions for the agent */
  instructions?: string;
  
  /** Maximum number of tool execution steps */
  maxSteps?: number;
  
  /** OpenAI API key (overrides env var) */
  apiKey?: string;
  
  /** Provider configuration */
  providers?: ProviderConfig;
  
  /** Custom tool collection (replaces defaults) */
  tools?: Record<string, Tool>;
  
  /** Additional tools (merged with defaults) */
  additionalTools?: Record<string, Tool>;
}
```

**Returns:** `GAIAAgent` (extends `ToolLoopAgent`)

---

### `GAIAAgent`

Extensible base class for custom agents:

```typescript
import { GAIAAgent } from '@gaia-agent/sdk';
import { tool } from 'ai';
import { z } from 'zod';

class MyAgent extends GAIAAgent {
  constructor() {
    super({
      instructions: 'Specialized agent instructions',
      additionalTools: {
        weatherTool: tool({
          description: 'Get weather information',
          inputSchema: z.object({ city: z.string() }),
          execute: async ({ city }) => {
            // Call weather API
            return { temp: 72, condition: 'sunny' };
          },
        }),
      },
    });
  }
}

const agent = new MyAgent();
```

**Constructor Parameters:** Same as `createGaiaAgent`

**Methods:** Inherits from `ToolLoopAgent`:
- `generate(options)` - Generate response with tools
- `stream(options)` - Stream response with tools

---

### `getDefaultTools()`

Get all default tools for modification:

```typescript
import { getDefaultTools } from '@gaia-agent/sdk';
import { tool } from 'ai';
import { z } from 'zod';

const tools = {
  ...getDefaultTools(),
  customTool: tool({
    description: 'Custom functionality',
    inputSchema: z.object({ input: z.string() }),
    execute: async ({ input }) => {
      return { result: input.toUpperCase() };
    },
  }),
};

const agent = createGaiaAgent({ tools });
```

**Parameters:**

```typescript
function getDefaultTools(
  providers?: ProviderConfig
): Record<string, Tool>
```

**Returns:** Object containing all default tools

**Default Tools:**
- `calculator` - Math calculations
- `httpRequest` - HTTP API calls
- `search` - Web search (Tavily or Exa)
- `sandbox` - Code execution (E2B or Sandock)
- `browser` - Browser automation (Steel, BrowserUse, or AWS)
- Memory tools (optional, Mem0 or AWS AgentCore)

---

## Type Definitions

### `ProviderConfig`

```typescript
interface ProviderConfig {
  /** Browser automation provider */
  browser?: 'steel' | 'browseruse' | 'aws-bedrock-agentcore' | undefined;
  
  /** Code execution sandbox provider */
  sandbox?: 'e2b' | 'sandock' | undefined;
  
  /** Web search provider */
  search?: 'tavily' | 'exa' | undefined;
  
  /** Memory management provider */
  memory?: 'mem0' | 'agentcore' | undefined;
}
```

### `GaiaTask`

```typescript
interface GaiaTask {
  /** Task unique identifier */
  id: string;
  
  /** Task difficulty level (1-3) */
  level: 1 | 2 | 3;
  
  /** Task question/prompt */
  question: string;
  
  /** Expected answer (for validation) */
  answer?: string;
  
  /** Attached files (if any) */
  files?: Array<{
    name: string;
    path: string;
    type: string;
    data?: string; // Base64 data URL
  }>;
  
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}
```

### `GaiaBenchmarkResult`

```typescript
interface GaiaBenchmarkResult {
  /** Task ID */
  taskId: string;
  
  /** Task question */
  question: string;
  
  /** Task difficulty level */
  level: 1 | 2 | 3;
  
  /** File attachments */
  files?: string[];
  
  /** Agent's answer */
  answer: string;
  
  /** Expected answer */
  expectedAnswer?: string;
  
  /** Whether answer is correct */
  correct: boolean;
  
  /** Execution time in ms */
  durationMs: number;
  
  /** Number of steps executed */
  steps: number;
  
  /** Detailed step execution data */
  stepDetails?: StepDetail[];
  
  /** Error message if failed */
  error?: string;
  
  /** Tools used in this task */
  toolsUsed?: string[];
  
  /** Summary of execution */
  summary?: {
    totalToolCalls: number;
    uniqueTools: string[];
    hadError: boolean;
  };
}
```

### `StepDetail`

```typescript
interface StepDetail {
  /** Step index */
  stepIndex: number;
  
  /** Tool calls in this step */
  toolCalls?: ToolCallDetail[];
  
  /** Tool results in this step */
  toolResults?: ToolResultDetail[];
  
  /** Text generated in this step */
  text?: string;
}

interface ToolCallDetail {
  toolName: string;
  toolCallId: string;
  args: Record<string, unknown>;
}

interface ToolResultDetail {
  toolName: string;
  toolCallId: string;
  result: unknown;
}
```

---

## Tool Exports

### Subpath Imports

Import specific tools for granular control:

```typescript
// Core tools
import { calculator, httpRequest } from '@gaia-agent/sdk/tools/core';

// Search tools
import { tavilySearch, exaSearch } from '@gaia-agent/sdk/tools/search';

// Sandbox tools
import { e2bSandbox, sandockExecute } from '@gaia-agent/sdk/tools/sandbox';

// Browser tools
import { browserUseTool, steelBrowserTool } from '@gaia-agent/sdk/tools/browser';

// Memory tools
import { mem0Remember, mem0Recall } from '@gaia-agent/sdk/tools/memory';
```

### Factory Functions

For provider-based tool creation:

```typescript
import { createBrowserTools } from '@gaia-agent/sdk/tools/browser';
import { createMemoryTools } from '@gaia-agent/sdk/tools/memory';
import { createSandboxTools } from '@gaia-agent/sdk/tools/sandbox';
import { createSearchTools } from '@gaia-agent/sdk/tools/search';

// Create tools with specific provider
const browserTools = createBrowserTools('steel');
const memoryTools = createMemoryTools('mem0', { apiKey: '...' });
```

---

## Usage Examples

### Basic Agent

```typescript
import { gaiaAgent } from '@gaia-agent/sdk';

const result = await gaiaAgent.generate({
  prompt: 'What is the weather in San Francisco?'
});

console.log(result.text);
```

### Custom Model

```typescript
import { createGaiaAgent } from '@gaia-agent/sdk';
import { openai } from '@ai-sdk/openai';

const agent = createGaiaAgent({
  model: openai('gpt-4-turbo'),
});

const result = await agent.generate({
  prompt: 'Explain quantum computing'
});
```

### Custom Instructions

```typescript
import { createGaiaAgent } from '@gaia-agent/sdk';

const agent = createGaiaAgent({
  instructions: `You are a Python coding expert.
  Always provide complete, runnable code examples.
  Include error handling and type hints.`
});
```

### Provider Selection

```typescript
import { createGaiaAgent } from '@gaia-agent/sdk';

const agent = createGaiaAgent({
  providers: {
    search: 'exa',       // Use Exa for search
    sandbox: 'e2b',      // Use E2B for code execution
    browser: 'steel',    // Use Steel for browser automation
    memory: undefined,   // Disable memory tools
  },
});
```

### Additional Tools

```typescript
import { createGaiaAgent } from '@gaia-agent/sdk';
import { tool } from 'ai';
import { z } from 'zod';

const agent = createGaiaAgent({
  additionalTools: {
    databaseQuery: tool({
      description: 'Query the database',
      inputSchema: z.object({
        sql: z.string(),
      }),
      execute: async ({ sql }) => {
        // Execute SQL query
        return { results: [] };
      },
    }),
  },
});
```

### Custom Tool Collection

```typescript
import { getDefaultTools, createGaiaAgent } from '@gaia-agent/sdk';
import { tool } from 'ai';
import { z } from 'zod';

const defaultTools = getDefaultTools();

const tools = {
  calculator: defaultTools.calculator,  // Keep calculator
  search: defaultTools.search,          // Keep search
  myTool: tool({
    description: 'Custom tool',
    inputSchema: z.object({ input: z.string() }),
    execute: async ({ input }) => ({ result: input }),
  }),
};

const agent = createGaiaAgent({ tools });
```

### Extending GAIAAgent

```typescript
import { GAIAAgent } from '@gaia-agent/sdk';
import { tool } from 'ai';
import { z } from 'zod';

class ResearchAgent extends GAIAAgent {
  constructor(apiKey: string) {
    super({
      instructions: 'Research assistant specialized in academic papers',
      additionalTools: {
        arxivSearch: tool({
          description: 'Search arXiv papers',
          inputSchema: z.object({ query: z.string() }),
          execute: async ({ query }) => {
            // Call arXiv API
            return { papers: [] };
          },
        }),
      },
    });
  }
}

const agent = new ResearchAgent('sk-...');
```

---

## Advanced Usage

### Streaming Responses

```typescript
import { createGaiaAgent } from '@gaia-agent/sdk';

const agent = createGaiaAgent();

const { textStream } = await agent.stream({
  prompt: 'Explain machine learning'
});

for await (const chunk of textStream) {
  process.stdout.write(chunk);
}
```

### Multi-turn Conversations

```typescript
import { createGaiaAgent } from '@gaia-agent/sdk';

const agent = createGaiaAgent();

const result1 = await agent.generate({
  messages: [
    { role: 'user', content: 'What is TypeScript?' }
  ]
});

const result2 = await agent.generate({
  messages: [
    { role: 'user', content: 'What is TypeScript?' },
    { role: 'assistant', content: result1.text },
    { role: 'user', content: 'How is it different from JavaScript?' }
  ]
});
```

### Error Handling

```typescript
import { createGaiaAgent } from '@gaia-agent/sdk';

const agent = createGaiaAgent();

try {
  const result = await agent.generate({
    prompt: 'Complex task that might fail'
  });
  console.log(result.text);
} catch (error) {
  console.error('Agent error:', error);
  // Handle error
}
```

---

## References

- [Environment Variables](./environment-variables.md)
- [Provider Comparison](./providers.md)
- [GAIA Benchmark](./gaia-benchmark.md)
- [Advanced Usage](./advanced-usage.md)
