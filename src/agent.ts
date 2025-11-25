/**
 * GAIAAgent - Main agent class for GAIA benchmarks
 * Extends ToolLoopAgent from AI SDK v6
 */

import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel, ToolSet } from "ai";
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
 *           inputSchema: z.object({ city: z.string() }),
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
  private _model: LanguageModel;
  private _tools: ToolSet;

  constructor(config?: {
    model?: LanguageModel;
    instructions?: string;
    maxSteps?: number;
    apiKey?: string;
    providers?: ProviderConfig;
    additionalTools?: ToolSet;
    tools?: ToolSet;
    reasoning?: boolean; // Enable OpenAI reasoning mode (o1/o3 models)
  }) {
    const defaultTools = getDefaultTools(config?.providers);
    // unset all undefined tools
    const tools = Object.fromEntries(Object.entries(config?.tools || {
      ...defaultTools,
      ...config?.additionalTools,
    }).filter(([_, value]) => value !== undefined));

    // Determine model to use
    let model: LanguageModel;
    if (config?.model) {
      model = config.model;
    } else {
      const openai = createOpenAI({
        baseURL: process.env.OPENAI_BASE_URL,
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Check if reasoning mode is enabled
      const useReasoning =
        config?.reasoning ||
        process.env.OPENAI_REASONING_MODE === "true" ||
        process.env.OPENAI_REASONING_MODE === "1";

      const modelName = process.env.OPENAI_MODEL || "gpt-4o";

      // Use responses() for reasoning models (o1/o3) when explicitly enabled
      // Note: OpenAI responses API is used for reasoning models
      if (useReasoning || modelName.startsWith("o1") || modelName.startsWith("o3")) {
        model = openai.responses(modelName);
      } else {
        model = openai(modelName);
      }
    }

    super({
      model,
      instructions: config?.instructions || DEFAULT_INSTRUCTIONS,
      tools,
      stopWhen: stepCountIs(config?.maxSteps || 30),
    });

    this._model = model;
    this._tools = tools;
  }

  /**
   * Get the model and tools used by the agent
   */
  public getModelAndTools() {
    return {
      model: this._model,
      tools: this._tools,
    };
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
 *       inputSchema: z.object({ input: z.string() }),
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
  tools?: ToolSet;
  additionalTools?: ToolSet;
  reasoning?: boolean; // Enable OpenAI reasoning mode (o1/o3 models)
}) {
  return new GAIAAgent(config);
}
