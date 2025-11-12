/**
 * Provider configuration utilities
 * Load and validate provider settings from environment variables
 */

import type { ProviderConfig } from "../types.js";

/**
 * Load provider configuration from environment variables
 * Supports: GAIA_AGENT_SEARCH_PROVIDER, GAIA_AGENT_SANDBOX_PROVIDER, etc.
 */
export function loadProviderConfigFromEnv(): ProviderConfig | undefined {
  const envConfig: ProviderConfig = {};
  let hasConfig = false;

  // Search provider
  const searchProvider = process.env.GAIA_AGENT_SEARCH_PROVIDER?.toLowerCase();
  if (searchProvider === "tavily" || searchProvider === "exa") {
    envConfig.search = searchProvider;
    hasConfig = true;
  }

  // Sandbox provider
  const sandboxProvider = process.env.GAIA_AGENT_SANDBOX_PROVIDER?.toLowerCase();
  if (sandboxProvider === "e2b" || sandboxProvider === "sandock") {
    envConfig.sandbox = sandboxProvider;
    hasConfig = true;
  }

  // Browser provider
  const browserProvider = process.env.GAIA_AGENT_BROWSER_PROVIDER?.toLowerCase();
  if (
    browserProvider === "steel" ||
    browserProvider === "browseruse" ||
    browserProvider === "aws-bedrock-agentcore"
  ) {
    envConfig.browser = browserProvider as "steel" | "browseruse" | "aws-bedrock-agentcore";
    hasConfig = true;
  }

  // Memory provider
  const memoryProvider = process.env.GAIA_AGENT_MEMORY_PROVIDER?.toLowerCase();
  if (memoryProvider === "mem0" || memoryProvider === "agentcore") {
    envConfig.memory = memoryProvider as "mem0" | "agentcore";
    hasConfig = true;
  }

  return hasConfig ? envConfig : undefined;
}

/**
 * Validate required API keys for providers
 */
export function validateProviderConfig(providers?: ProviderConfig): void {
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

  // Validate browser provider (skip if explicitly disabled)
  const browserProvider =
    providers && "browser" in providers && providers.browser === undefined
      ? undefined
      : providers?.browser || "steel";

  if (
    browserProvider === "steel" &&
    (!process.env.STEEL_API_KEY || process.env.STEEL_API_KEY.trim() === "")
  ) {
    throw new Error(
      "STEEL_API_KEY environment variable is required for Steel browser automation.\n" +
        "Get your API key at https://steel.dev\n" +
        "Or disable browser: createGaiaAgent({ providers: { browser: undefined } })",
    );
  }

  if (
    browserProvider === "browseruse" &&
    (!process.env.BROWSERUSE_API_KEY || process.env.BROWSERUSE_API_KEY.trim() === "")
  ) {
    throw new Error(
      "BROWSERUSE_API_KEY environment variable is required for BrowserUse.\n" +
        "Get your API key at https://browseruse.com\n" +
        "Or use Steel: GAIA_AGENT_BROWSER_PROVIDER=steel",
    );
  }
}
