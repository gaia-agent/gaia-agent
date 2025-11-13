/**
 * Sandbox tools factory
 * Swappable providers: E2B, Sandock
 */

import type { Tool } from "ai";
import { tool } from "ai";
import { DEFAULT_PROVIDERS } from "../../config/defaults.js";
import { e2bProvider, e2bSchemas } from "./e2b.js";
import { sandockProvider, sandockSchemas } from "./sandock.js";
import type { SandboxProvider } from "./types.js";

/**
 * Sandbox tool factory
 * Creates a sandbox tool based on the provider
 */
export const createSandboxTool = (provider: SandboxProvider = DEFAULT_PROVIDERS.sandbox): Tool => {
  if (provider === "e2b") {
    return tool({
      description:
        "Execute code in a secure E2B cloud sandbox. Supports Python, JavaScript, Bash. Great for data analysis, web scraping, and automation tasks.",
      inputSchema: e2bSchemas.executeSchema as unknown as Tool["inputSchema"],
      execute: e2bProvider.execute as unknown as Tool["execute"],
    });
  }

  return tool({
    description:
      "Execute code in a secure Sandock sandbox. Supports Python, JavaScript, Bash, and browser automation via Sandock API (https://sandock.ai)",
    inputSchema: sandockSchemas.executeSchema as unknown as Tool["inputSchema"],
    execute: sandockProvider.execute as unknown as Tool["execute"],
  });
};

/**
 * Create all sandbox tools for a provider
 */
export const createSandboxTools = (provider: SandboxProvider = DEFAULT_PROVIDERS.sandbox) => {
  return {
    sandboxExecute: createSandboxTool(provider),
  };
};

// Export provider instances and schemas for advanced use
export { e2bProvider, e2bSchemas } from "./e2b.js";
export { sandockProvider, sandockSchemas } from "./sandock.js";
export type { SandboxProvider } from "./types.js";

// Deprecated: Legacy exports for backward compatibility
export const e2bSandbox = createSandboxTool("e2b");
export const sandockExecute = createSandboxTool("sandock");
