/**
 * AWS Bedrock AgentCore Browser Provider
 *
 * Note: AWS Bedrock AgentCore Browser requires WebSocket-based control.
 * Available AWS SDK commands:
 * - StartBrowserSessionCommand - Create browser session (returns WebSocket URLs)
 * - UpdateBrowserStreamCommand - Enable/disable stream (not for sending actions)
 * - StopBrowserSessionCommand - Stop browser session
 *
 * Browser actions must be sent via WebSocket with SigV4 authentication.
 * JavaScript SDK lacks the browser_session helper available in Python SDK.
 *
 * For immediate browser automation, use Steel or BrowserUse provider instead.
 */

import { z } from "zod";
import type { AWSBrowserParams, BrowserResult, IAWSAgentCoreProvider } from "./types.js";

/**
 * AWS AgentCore browser provider implementation
 * Currently returns error due to WebSocket limitations
 */
export const awsAgentCoreProvider: IAWSAgentCoreProvider = {
  execute: async ({ task, url }: AWSBrowserParams): Promise<BrowserResult> => {
    return {
      success: false,
      error: "AWS Bedrock AgentCore Browser requires WebSocket connection for browser control.",
      task,
      url,
      details: {
        sdkLimitation:
          "JavaScript SDK only provides session management (Start/Stop/Update stream status)",
        browserActions: "Must be sent via WebSocket with SigV4 signed query parameters",
        pythonEquivalent: "Python SDK has browser_session helper with generate_ws_headers()",
        availableCommands: [
          "StartBrowserSessionCommand - Creates session, returns WebSocket URLs",
          "UpdateBrowserStreamCommand - Enables/disables automation stream",
          "StopBrowserSessionCommand - Terminates browser session",
        ],
        missingFeature: "No REST API to send browser actions (navigate, click, type, etc.)",
      },
      recommendation: "Set GAIA_AGENT_BROWSER_PROVIDER=steel in .env for cloud browser automation",
      documentation:
        "https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/browser-tool.html",
    };
  },
};

/**
 * AWS AgentCore browser schemas
 */
export const awsAgentCoreSchemas = {
  executeSchema: z.object({
    task: z.string().describe("Browser task description"),
    url: z.string().optional().describe("Starting URL"),
    browserIdentifier: z.string().optional().describe("Browser identifier"),
    awsRegion: z.string().optional().describe("AWS region"),
    awsAccessKeyId: z.string().optional().describe("AWS access key ID"),
    awsSecretAccessKey: z.string().optional().describe("AWS secret access key"),
  }),
};
