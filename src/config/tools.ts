/**
 * Default tools configuration
 * Get all GAIA tools with swappable providers
 */

import type { ToolSet } from "ai";
import { createBrowserTools } from "../tools/browser/index.js";
import { calculator, httpRequest, planner, verifier } from "../tools/index.js";
import { createMemoryTools } from "../tools/memory/index.js";
import { createSandboxTools } from "../tools/sandbox/index.js";
import { createSearchTools } from "../tools/search/index.js";
import type { ProviderConfig } from "../types.js";
import { DEFAULT_PROVIDERS } from "./defaults.js";
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
 * // Uses default providers: OpenAI search, E2B sandbox, Steel browser, Mem0 memory
 * ```
 *
 * @example Custom providers
 * ```typescript
 * import { getDefaultTools, createGaiaAgent } from 'gaia-agent';
 *
 * const tools = getDefaultTools({
 *   browser: 'aws-bedrock-agentcore',  // Use AWS instead of Steel
 *   sandbox: 'sandock',         // Use Sandock instead of E2B
 *   search: 'exa',              // Use Exa instead of OpenAI
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
      : mergedConfig?.browser || DEFAULT_PROVIDERS.browser;

  const sandboxProvider =
    mergedConfig && "sandbox" in mergedConfig && mergedConfig.sandbox === undefined
      ? undefined
      : mergedConfig?.sandbox || DEFAULT_PROVIDERS.sandbox;

  const searchProvider =
    mergedConfig && "search" in mergedConfig && mergedConfig.search === undefined
      ? undefined
      : mergedConfig?.search || DEFAULT_PROVIDERS.search;

  const memoryProvider =
    mergedConfig && "memory" in mergedConfig && mergedConfig.memory === undefined
      ? undefined
      : mergedConfig?.memory || DEFAULT_PROVIDERS.memory;

  let tools: ToolSet = {
    calculator,
    httpRequest,
    planner,
    verifier,
  };

  // Add search tools based on provider using factory pattern (skip if explicitly disabled)
  if (searchProvider !== undefined) {
    const searchTools = createSearchTools(searchProvider);
    tools = { ...tools, ...searchTools };
  }

  // Add sandbox tools based on provider using factory pattern (skip if explicitly disabled)
  if (sandboxProvider !== undefined) {
    const sandboxTools = createSandboxTools(sandboxProvider);
    tools = { ...tools, ...sandboxTools };
  }

  // Add browser tools based on provider using factory pattern (skip if explicitly disabled)
  if (browserProvider !== undefined) {
    const browserTools = createBrowserTools(browserProvider);
    tools = { ...tools, ...browserTools };
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
      tools = { ...tools, ...memoryTools };
    }
    // Silently skip memory tools if no API key (memory is optional)
  }

  return tools;
}
