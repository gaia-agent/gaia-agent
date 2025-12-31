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
import type { BrowserProvider, ScreenshotUploadFn } from "./types.js";

/**
 * Browser tool factory options
 */
export interface BrowserToolOptions {
  /**
   * Optional function to upload screenshots to external storage (e.g., S3)
   * This reduces AI context size and avoids concurrent connection issues
   * Only used by AWS AgentCore provider
   */
  screenshotUploadFn?: ScreenshotUploadFn;
}

/**
 * Browser tool factory
 * Creates a browser tool based on the provider
 */
export const createBrowserTool = (
  provider: BrowserProvider = DEFAULT_PROVIDERS.browser,
  options?: BrowserToolOptions,
): Tool => {
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

  // AWS AgentCore provider with optional screenshotUploadFn
  const { screenshotUploadFn } = options || {};
  return tool({
    description:
      "AWS Bedrock AgentCore browser automation with Playwright actions. Supports launch, navigate, screenshot, click, fill, extract, info, closePage, exit, waitForNavigation, sleep/wait, and composite open (launch+navigate+info/extract/screenshot) or sequence (multi-step in one call).\n\n" +
      "🎯 RECOMMENDED PATTERNS:\n" +
      "1. **First-time access (no sessionId)**: Use 'open' operation - it auto-creates session + navigates + extracts\n" +
      "   Example: {operation:{action:'open',url:'...',wantContent:true}}\n" +
      "2. **Existing session**: Use 'sequence' for multi-step operations or single actions\n" +
      "   Example: {sessionId:'xxx',operation:{action:'sequence',steps:[{action:'navigate',url:'...'},{action:'wait',ms:3000},{action:'extract'}]}}\n\n" +
      "⚠️ CRITICAL: DO NOT invent selectors! Use this workflow:\n" +
      "1. Navigate to page + wait 2-5s\n" +
      "2. Extract full page content (no selector) to see actual DOM structure\n" +
      "3. Use AI analysis to find real selectors from extracted content\n" +
      "4. Then perform targeted extraction/interaction\n\n" +
      "BEST PRACTICES:\n" +
      "1. First visit: use 'open' operation with wantContent:true to get page structure in one call\n" +
      "2. Use broad selectors (main, article, #content) - auto fallback if not found\n" +
      "3. For specific data: first get page content, then extract with real selectors\n" +
      "4. Batch related actions in sequence to minimize steps\n" +
      "5. Set reasonable timeouts (10-30s)\n\n" +
      "✅ CORRECT workflow:\n" +
      "First visit: {operation:{action:'open',url:'...',wantContent:true}}\n" +
      "Analyze extracted content to find real selectors\n" +
      "Follow-up: {sessionId:'xxx',operation:{action:'extract',selector:'<real-selector-from-step1>'}}\n\n" +
      "❌ WRONG workflow:\n" +
      "BAD: {operation:{action:'sequence',steps:[{action:'navigate',url:'...'},{action:'extract',selector:'invented-selector'}]}} ← Will fail!\n\n" +
      "FEATURES: Graceful error handling (selector not found = fallback to page content), configurable timeouts, automatic retries.",
    inputSchema: awsAgentCoreSchemas.executeSchema as unknown as Tool["inputSchema"],
    execute: ((params: unknown) =>
      awsAgentCoreProvider.execute(
        params as Parameters<typeof awsAgentCoreProvider.execute>[0],
        screenshotUploadFn,
      )) as unknown as Tool["execute"],
  });
};

/**
 * Create all browser tools for a provider
 */
export const createBrowserTools = (
  provider: BrowserProvider = DEFAULT_PROVIDERS.browser,
  options?: BrowserToolOptions,
) => {
  const browser = createBrowserTool(provider, options);

  return {
    browser,
  };
};

// Export provider instances and schemas for advanced use
export { awsAgentCoreProvider, awsAgentCoreSchemas } from "./aws-agentcore.js";
export { browseruseProvider, browseruseSchemas } from "./browseruse.js";
export { steelProvider, steelSchemas } from "./steel.js";
export type { BrowserProvider, ScreenshotUploadFn } from "./types.js";

// Legacy exports for backward compatibility
export const steelBrowserTool = createBrowserTool("steel");
export const browserUseTool = createBrowserTool("browseruse");
export const awsBrowserTool = createBrowserTool("aws-bedrock-agentcore");
