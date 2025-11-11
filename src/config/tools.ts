/**
 * Default tools configuration
 * Get all GAIA tools with swappable providers
 */

import {
  calculator,
  e2bSandbox,
  exaFindSimilar,
  exaGetContents,
  exaSearch,
  httpRequest,
  sandockExecute,
  tavilySearch,
} from "../tools/index.js";
import { createBrowserTools } from "../tools/browser/index.js";
import { createMemoryTools } from "../tools/memory/index.js";
import type { ProviderConfig } from "../types.js";
import { loadProviderConfigFromEnv, validateProviderConfig } from "./providers.js";

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
 *   browser: 'aws-bedrock-agentcore',  // Use AWS instead of BrowserUse
 *   sandbox: 'sandock',         // Use Sandock instead of E2B
 *   search: 'exa',              // Use Exa instead of Tavily
 * });
 *
 * const agent = createGaiaAgent({ tools });
 * ```
 *
 * @example Using environment variables
 * ```typescript
 * // Set in .env file:
 * // GAIA_AGENT_SEARCH_PROVIDER=exa
 * // GAIA_AGENT_SANDBOX_PROVIDER=sandock
 *
 * const tools = getDefaultTools();
 * // Automatically uses providers from environment variables
 * ```
 */
export function getDefaultTools(providers?: ProviderConfig) {
  // Merge environment config with explicit config (explicit takes precedence)
  const envConfig = loadProviderConfigFromEnv();
  const mergedConfig = { ...envConfig, ...providers };

  // Validate provider configuration before creating tools
  validateProviderConfig(mergedConfig);

  // Determine which providers are enabled
  // Default to recommended providers unless explicitly set to undefined or a different provider
  const browserProvider =
    mergedConfig && "browser" in mergedConfig && mergedConfig.browser === undefined
      ? undefined
      : mergedConfig?.browser || "steel";

  const sandboxProvider =
    mergedConfig && "sandbox" in mergedConfig && mergedConfig.sandbox === undefined
      ? undefined
      : mergedConfig?.sandbox || "e2b";

  const searchProvider =
    mergedConfig && "search" in mergedConfig && mergedConfig.search === undefined
      ? undefined
      : mergedConfig?.search || "tavily";

  const memoryProvider =
    mergedConfig && "memory" in mergedConfig && mergedConfig.memory === undefined
      ? undefined
      : mergedConfig?.memory || "mem0";

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

  // Add browser tools based on provider using factory pattern (skip if explicitly disabled)
  if (browserProvider !== undefined) {
    const browserTools = createBrowserTools(browserProvider);
    Object.assign(tools, browserTools);
  }

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
