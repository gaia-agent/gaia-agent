/**
 * GAIA Agent - GAIA Benchmark Agent using AI SDK v6
 *
 * Simple, pre-configured ToolLoopAgent for running GAIA benchmarks.
 * No complex classes or wrappers - just use AI SDK v6 directly.
 *
 * @example Basic Usage
 * ```typescript
 * import { createGaiaAgent } from 'gaia-agent';
 *
 * // Create the agent
 * const agent = createGaiaAgent();
 *
 * const result = await agent.generate({
 *   prompt: 'What is 15 * 23?',
 * });
 *
 * console.log(result.text); // Agent's response
 * ```
 *
 * @example Extend with Custom Tools
 * ```typescript
 * import { createGaiaAgent, getDefaultTools } from 'gaia-agent';
 * import { tool } from 'ai';
 * import { z } from 'zod';
 *
 * // Add ToolSDK or custom tools
 * const myAgent = createGaiaAgent({
 *   tools: {
 *     ...getDefaultTools(),
 *     customTool: tool({
 *       description: 'My custom tool',
 *       parameters: z.object({ input: z.string() }),
 *       execute: async ({ input }) => ({ result: input }),
 *     }),
 *   },
 * });
 * ```
 *
 * @example Extend GAIAAgent Class
 * ```typescript
 * import { GAIAAgent } from 'gaia-agent';
 * import { tool } from 'ai';
 *
 * class MyCustomAgent extends GAIAAgent {
 *   constructor() {
 *     super({
 *       instructions: 'Custom instructions',
 *       additionalTools: {
 *         myTool: tool({ ... }),
 *       },
 *     });
 *   }
 * }
 * ```
 */

import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { stepCountIs, ToolLoopAgent } from "ai";
import {
  // Browser tools temporarily disabled until APIs are updated
  // browserClick,
  // browserGetContent,
  // browserNavigate,
  // browserScreenshot,
  // browserType,
  // browserUseTool,
  calculator,
  e2bSandbox,
  exaFindSimilar,
  exaGetContents,
  exaSearch,
  httpRequest,
  sandockExecute,
  tavilySearch,
} from "./tools/index.js";
import { createMemoryTools } from "./tools/memory/index.js";
import type { ProviderConfig } from "./types.js";

/**
 * Validate required API keys for providers
 */
function validateProviderConfig(providers?: ProviderConfig): void {
  // Determine which providers are enabled
  // Default to tavily/e2b unless explicitly set to undefined or a different provider
  const searchProvider =
    providers && "search" in providers && providers.search === undefined
      ? undefined
      : providers?.search || "tavily";

  const sandboxProvider =
    providers && "sandbox" in providers && providers.sandbox === undefined
      ? undefined
      : providers?.sandbox || "e2b";

  // Validate search provider (skip if explicitly disabled)
  if (
    searchProvider === "tavily" &&
    (!process.env.TAVILY_API_KEY || process.env.TAVILY_API_KEY.trim() === "")
  ) {
    throw new Error(
      "TAVILY_API_KEY environment variable is required for Tavily search.\n" +
        "Get your API key at https://tavily.com\n" +
        "Or disable search: createGaiaAgent({ providers: { search: undefined } })",
    );
  }

  if (
    searchProvider === "exa" &&
    (!process.env.EXA_API_KEY || process.env.EXA_API_KEY.trim() === "")
  ) {
    throw new Error(
      "EXA_API_KEY environment variable is required for Exa search.\n" +
        "Get your API key at https://exa.ai\n" +
        "Or disable search: createGaiaAgent({ providers: { search: undefined } })",
    );
  }

  // Validate sandbox provider (skip if explicitly disabled)
  if (
    sandboxProvider === "e2b" &&
    (!process.env.E2B_API_KEY || process.env.E2B_API_KEY.trim() === "")
  ) {
    throw new Error(
      "E2B_API_KEY environment variable is required for E2B sandbox.\n" +
        "Get your API key at https://e2b.dev\n" +
        "Or disable sandbox: createGaiaAgent({ providers: { sandbox: undefined } })",
    );
  }

  if (
    sandboxProvider === "sandock" &&
    (!process.env.SANDOCK_API_KEY || process.env.SANDOCK_API_KEY.trim() === "")
  ) {
    throw new Error(
      "SANDOCK_API_KEY environment variable is required for Sandock sandbox.\n" +
        "Get your API key at https://sandock.ai\n" +
        "Or disable sandbox: createGaiaAgent({ providers: { sandbox: undefined } })",
    );
  }
}

/**
 * Default GAIA agent configuration
 */
const DEFAULT_INSTRUCTIONS = `You are a highly capable AI assistant designed to solve complex tasks from the GAIA benchmark.

You have access to various tools:
- calculator: For mathematical calculations
- httpRequest: For making HTTP requests to APIs
- tavilySearch: AI-optimized web search via Tavily (official @tavily/core SDK)
- exaSearch: Neural web search via Exa (official exa-js SDK)
- exaGetContents: Retrieve full content from Exa search results
- exaFindSimilar: Find similar content using Exa
- e2bSandbox: Execute code in E2B cloud sandbox (official e2b SDK) - Python, JavaScript, includes filesystem operations
- sandockExecute: Execute code in Sandock sandbox (https://sandock.ai)
- browserUseTool: Browser automation via BrowserUse (official browser-use-sdk)
- browserNavigate/browserGetContent/browserClick/browserType/browserScreenshot: Browser automation via AWS Bedrock AgentCore
- mem0Remember/mem0Recall: Store and retrieve information from memory (Mem0)
- memoryStore/memoryRetrieve/memoryDelete: Store, retrieve, and delete information from memory (AWS AgentCore Memory)

Note: File operations (readFile, writeFile) are available within the E2B sandbox environment.

Approach tasks systematically:
1. Break down complex problems into smaller steps
2. Use tools effectively to gather information and perform operations
3. Think step by step and explain your reasoning
4. Provide clear, concise answers

When you have completed the task, provide a final answer.`;

/**
 * Get default GAIA tools
 * Useful for extending the agent with additional tools
 *
 * @param providers - Optional provider configuration to select specific implementations
 * @returns Object containing all default GAIA tools
 *
 * @example Default providers
 * ```typescript
 * import { getDefaultTools } from 'gaia-agent';
 *
 * const tools = getDefaultTools();
 * // Uses default providers: E2B sandbox, BrowserUse, Tavily search, Mem0
 * ```
 *
 * @example Custom providers
 * ```typescript
 * import { getDefaultTools, createGaiaAgent } from 'gaia-agent';
 *
 * const tools = getDefaultTools({
 *   browser: 'aws-agentcore',  // Use AWS instead of BrowserUse
 *   sandbox: 'sandock',         // Use Sandock instead of E2B
 *   search: 'exa',              // Use Exa instead of Tavily
 * });
 *
 * const agent = createGaiaAgent({ tools });
 * ```
 */
export function getDefaultTools(providers?: ProviderConfig) {
  // Validate provider configuration before creating tools
  validateProviderConfig(providers);

  // Determine which providers are enabled
  // Default to recommended providers unless explicitly set to undefined or a different provider
  const _browserProvider =
    providers && "browser" in providers && providers.browser === undefined
      ? undefined
      : providers?.browser || "browseruse";

  const sandboxProvider =
    providers && "sandbox" in providers && providers.sandbox === undefined
      ? undefined
      : providers?.sandbox || "e2b";

  const searchProvider =
    providers && "search" in providers && providers.search === undefined
      ? undefined
      : providers?.search || "tavily";

  const memoryProvider =
    providers && "memory" in providers && providers.memory === undefined
      ? undefined
      : providers?.memory || "mem0";

  const tools: Record<string, unknown> = {
    calculator,
    httpRequest,
  };

  // Add search tools based on provider (skip if explicitly disabled)
  if (searchProvider === "tavily") {
    tools.search = tavilySearch;
  } else if (searchProvider === "exa") {
    tools.search = exaSearch;
    tools.searchGetContents = exaGetContents;
    tools.searchFindSimilar = exaFindSimilar;
  }

  // Add sandbox tools based on provider (skip if explicitly disabled)
  if (sandboxProvider === "e2b") {
    tools.sandbox = e2bSandbox;
  } else if (sandboxProvider === "sandock") {
    tools.sandbox = sandockExecute;
  }

  // Add browser tools based on provider
  // Temporarily disabled until browser APIs are updated
  /*
  if (browserProvider === "browseruse") {
    tools.browser = browserUseTool;
  } else if (browserProvider === "aws-agentcore") {
    tools.browserNavigate = browserNavigate;
    tools.browserGetContent = browserGetContent;
    tools.browserClick = browserClick;
    tools.browserType = browserType;
    tools.browserScreenshot = browserScreenshot;
  }
  */

  // Add memory tools based on provider using factory pattern (skip if explicitly disabled or no API key)
  if (memoryProvider !== undefined) {
    // Check if memory provider has required API key
    const hasMemoryKey =
      (memoryProvider === "mem0" &&
        process.env.MEM0_API_KEY &&
        process.env.MEM0_API_KEY.trim() !== "") ||
      (memoryProvider === "agentcore" &&
        process.env.AWS_ACCESS_KEY_ID &&
        process.env.AWS_ACCESS_KEY_ID.trim() !== "");

    if (hasMemoryKey) {
      const memoryTools = createMemoryTools(memoryProvider);
      Object.assign(tools, memoryTools);
    }
    // Silently skip memory tools if no API key (memory is optional)
  }

  return tools;
}

/**
 * GAIAAgent - Extensible class for creating custom GAIA agents
 *
 * Extends ToolLoopAgent from AI SDK v6 with GAIA-specific defaults.
 * Developers can extend this class to create specialized agents.
 *
 * @example Basic Extension
 * ```typescript
 * import { GAIAAgent } from 'gaia-agent';
 * import { tool } from 'ai';
 * import { z } from 'zod';
 *
 * class MyAgent extends GAIAAgent {
 *   constructor() {
 *     super({
 *       instructions: 'You are a specialized agent...',
 *       additionalTools: {
 *         weatherTool: tool({
 *           description: 'Get weather',
 *           parameters: z.object({ city: z.string() }),
 *           execute: async ({ city }) => {
 *             // Call weather API
 *             return { temp: 72, condition: 'sunny' };
 *           },
 *         }),
 *       },
 *     });
 *   }
 * }
 *
 * const agent = new MyAgent();
 * const result = await agent.generate({ prompt: 'What is the weather in SF?' });
 * ```
 *
 * @example With Provider Selection
 * ```typescript
 * import { GAIAAgent } from 'gaia-agent';
 *
 * class CustomAgent extends GAIAAgent {
 *   constructor() {
 *     super({
 *       providers: {
 *         browser: 'aws-agentcore',
 *         sandbox: 'sandock',
 *         search: 'exa',
 *       },
 *     });
 *   }
 * }
 * ```
 */
export class GAIAAgent extends ToolLoopAgent {
  constructor(config?: {
    model?: LanguageModel;
    instructions?: string;
    maxSteps?: number;
    apiKey?: string;
    providers?: ProviderConfig;
    additionalTools?: Record<string, unknown>;
    tools?: Record<string, unknown>;
  }) {
    const defaultTools = getDefaultTools(config?.providers);
    const tools = config?.tools || {
      ...defaultTools,
      ...config?.additionalTools,
    };

    super({
      model:
        config?.model ||
        createOpenAI({
          baseURL: process.env.OPENAI_BASE_URL,
          apiKey: process.env.OPENAI_API_KEY,
        })(process.env.OPENAI_MODEL || "gpt-4o"),
      instructions: config?.instructions || DEFAULT_INSTRUCTIONS,
      tools,
      stopWhen: stepCountIs(config?.maxSteps || 15),
    });
  }
}

/**
 * Create a custom GAIA agent with specific configuration
 *
 * @param config - Agent configuration including provider selection
 * @returns Configured ToolLoopAgent instance
 *
 * @example Basic Configuration
 * ```typescript
 * import { createGaiaAgent } from 'gaia-agent';
 * import { openai } from '@ai-sdk/openai';
 *
 * const agent = createGaiaAgent({
 *   model: openai('gpt-4-turbo'),
 *   instructions: 'Custom instructions...',
 *   maxSteps: 20,
 * });
 *
 * const result = await agent.generate({
 *   prompt: 'Task...',
 * });
 * ```
 *
 * @example With Provider Selection
 * ```typescript
 * import { createGaiaAgent } from 'gaia-agent';
 *
 * const agent = createGaiaAgent({
 *   providers: {
 *     browser: 'aws-agentcore',  // Use AWS AgentCore for browser automation
 *     sandbox: 'sandock',         // Use Sandock for code execution
 *     search: 'exa',              // Use Exa for semantic search
 *   },
 * });
 * ```
 *
 * @example With Additional Tools
 * ```typescript
 * import { createGaiaAgent, getDefaultTools } from 'gaia-agent';
 * import { tool } from 'ai';
 * import { z } from 'zod';
 *
 * const agent = createGaiaAgent({
 *   providers: {
 *     sandbox: 'e2b',  // Use E2B
 *     browser: undefined, // Disable browser automation
 *   },
 *   additionalTools: {
 *     customTool: tool({
 *       description: 'Custom tool',
 *       parameters: z.object({ input: z.string() }),
 *       execute: async ({ input }) => ({ result: input }),
 *     }),
 *   },
 * });
 * ```
 */
export function createGaiaAgent(config?: {
  model?: LanguageModel;
  instructions?: string;
  maxSteps?: number;
  apiKey?: string;
  providers?: ProviderConfig;
  tools?: Record<string, unknown>;
  additionalTools?: Record<string, unknown>;
}) {
  return new GAIAAgent(config);
}

/**
 * Export types for TypeScript users
 */
export type { LanguageModel, ToolLoopAgent } from "ai";
/**
 * Export tools for custom agent configuration
 */
export {
  // Browser tools temporarily disabled until APIs are updated
  // browserClick,
  // browserGetContent,
  // browserNavigate,
  // browserScreenshot,
  // browserType,
  // browserUseTool,
  calculator,
  e2bSandbox,
  exaFindSimilar,
  exaGetContents,
  exaSearch,
  httpRequest,
  sandockExecute,
  tavilySearch,
} from "./tools/index.js";

// Export memory tools factory
export { createMemoryTools } from "./tools/memory/index.js";

export type {
  BrowserProvider,
  GaiaBenchmarkResult,
  GaiaTask,
  MemoryProvider,
  ProviderConfig,
  SandboxProvider,
  SearchProvider,
} from "./types.js";
