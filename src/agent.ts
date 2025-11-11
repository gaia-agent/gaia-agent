/**
 * GAIAAgent - Main agent class for GAIA benchmarks
 * Extends ToolLoopAgent from AI SDK v6
 */

import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { stepCountIs, ToolLoopAgent } from "ai";
import { DEFAULT_INSTRUCTIONS } from "./config/defaults.js";
import { getDefaultTools } from "./config/tools.js";
import type { ProviderConfig } from "./types.js";

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
 *         browser: 'aws-bedrock-agentcore',
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
 *     browser: 'aws-bedrock-agentcore',  // Use AWS AgentCore for browser automation
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
