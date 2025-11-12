/**
 * GAIA Agent - Production-ready AI agent for GAIA benchmarks
 *
 * Built on AI SDK v6 ToolLoopAgent with 16+ tools and swappable providers.
 *
 * @example Basic Usage
 * ```typescript
 * import { createGaiaAgent } from '@gaia-agent/sdk';
 *
 * const agent = createGaiaAgent();
 * const result = await agent.generate({
 *   prompt: 'Calculate 15 * 23 and search for the latest AI papers',
 * });
 * console.log(result.text);
 * ```
 *
 * @example Custom Providers
 * ```typescript
 * import { createGaiaAgent } from '@gaia-agent/sdk';
 *
 * const agent = createGaiaAgent({
 *   providers: {
 *     search: 'exa',
 *     sandbox: 'sandock',
 *     browser: 'browseruse',
 *     memory: 'mem0',
 *   },
 * });
 * ```
 *
 * @example Extend with Custom Tools
 * ```typescript
 * import { createGaiaAgent, getDefaultTools } from '@gaia-agent/sdk';
 * import { tool } from 'ai';
 * import { z } from 'zod';
 *
 * const agent = createGaiaAgent({
 *   additionalTools: {
 *     weatherTool: tool({
 *       description: 'Get weather',
 *       inputSchema: z.object({ city: z.string() }),
 *       execute: async ({ city }) => ({ temp: 72, condition: 'sunny' }),
 *     }),
 *   },
 * });
 * ```
 */

// AI SDK types
export type { LanguageModel, ToolLoopAgent } from "ai";
// Main exports
export { createGaiaAgent, GAIAAgent } from "./agent.js";
// ReAct Planner and enhanced prompts
export {
  CONFIDENCE_ESTIMATION_PROMPT,
  getTaskAwareInstructions,
  REACT_PLANNER_INSTRUCTIONS,
  REFLECTION_PROMPT,
} from "./config/react-planner.js";
// Configuration utilities
export { getDefaultTools } from "./config/tools.js";
// Enhanced strategies for improved GAIA benchmark performance
export {
  createTaskAwareInstructions,
  estimateConfidence,
  iterativeAnswering,
  multiStrategyAnswering,
  reflectOnAnswer,
} from "./strategies/index.js";
// Tool exports
export {
  awsBrowserTool,
  browserUseTool,
  calculator,
  e2bSandbox,
  exaFindSimilar,
  exaGetContents,
  exaSearch,
  httpRequest,
  sandockExecute,
  steelBrowserTool,
  tavilySearch,
} from "./tools/index.js";
// Memory tools factory
export { createMemoryTools } from "./tools/memory/index.js";

// Type exports
export type {
  BrowserProvider,
  GaiaBenchmarkResult,
  GaiaTask,
  MemoryProvider,
  ProviderConfig,
  SandboxProvider,
  SearchProvider,
} from "./types.js";
