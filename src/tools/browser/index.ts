/**
 * Browser automation tools factory
 * Swappable providers: Steel, BrowserUse, AWS AgentCore
 */

import type { Tool } from "ai";
import { tool } from "ai";
import { DEFAULT_PROVIDERS } from "../../config/defaults.js";
import { awsAgentCoreProvider, awsAgentCoreSchemas } from "./aws-agentcore.js";
import { browseruseProvider, browseruseSchemas } from "./browseruse.js";
import { steelProvider, steelSchemas } from "./steel.js";
import type { BrowserProvider } from "./types.js";

/**
 * Browser tool factory
 * Creates a browser tool based on the provider
 */
export const createBrowserTool = (provider: BrowserProvider = DEFAULT_PROVIDERS.browser): Tool => {
  if (provider === "steel") {
    return tool({
      description:
        "Automate browser interactions using Steel. Provide a task description and URL, and the tool will use Playwright to navigate, extract content, click elements, type text, and take screenshots.",
      inputSchema: steelSchemas.executeSchema as unknown as Tool["inputSchema"],
      execute: steelProvider.execute as unknown as Tool["execute"],
    });
  }

  if (provider === "browseruse") {
    return tool({
      description:
        "Automate browser interactions using BrowserUse. Provide a task description and the agent will autonomously navigate, extract content, click elements, type text, and take screenshots to complete the task.",
      inputSchema: browseruseSchemas.executeSchema as unknown as Tool["inputSchema"],
      execute: browseruseProvider.execute as unknown as Tool["execute"],
    });
  }

  return tool({
    description:
      "AWS Bedrock AgentCore browser automation (requires WebSocket - use Steel instead)",
    inputSchema: awsAgentCoreSchemas.executeSchema as unknown as Tool["inputSchema"],
    execute: awsAgentCoreProvider.execute as unknown as Tool["execute"],
  });
};

/**
 * Create all browser tools for a provider
 */
export const createBrowserTools = (provider: BrowserProvider = DEFAULT_PROVIDERS.browser) => {
  const browser = createBrowserTool(provider);

  return {
    browser,
  };
};

// Export provider instances and schemas for advanced use
export { awsAgentCoreProvider, awsAgentCoreSchemas } from "./aws-agentcore.js";
export { browseruseProvider, browseruseSchemas } from "./browseruse.js";
export { steelProvider, steelSchemas } from "./steel.js";
export type { BrowserProvider } from "./types.js";

// Legacy exports for backward compatibility
export const steelBrowserTool = createBrowserTool("steel");
export const browserUseTool = createBrowserTool("browseruse");
export const awsBrowserTool = createBrowserTool("aws-bedrock-agentcore");
