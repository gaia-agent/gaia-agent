/**
 * BrowserUse Browser Automation Provider
 * Uses official browser-use-sdk v2: https://www.browseruse.com
 */

import { z } from "zod";
import type { BrowserResult, BrowserUseBrowserParams, IBrowserUseProvider } from "./types.js";

/**
 * BrowserUse automation provider implementation
 * Uses task-based API for autonomous browser automation
 */
export const browseruseProvider: IBrowserUseProvider = {
  execute: async ({ task, browserUseApiKey }: BrowserUseBrowserParams): Promise<BrowserResult> => {
    try {
      const apiKey = browserUseApiKey || process.env.BROWSERUSE_API_KEY;

      if (!apiKey) {
        return {
          success: false,
          error:
            "BrowserUse API key not configured. Set BROWSERUSE_API_KEY environment variable or pass browserUseApiKey parameter.",
        };
      }

      // Use official browser-use-sdk v2
      const { BrowserUseClient } = await import("browser-use-sdk");
      const client = new BrowserUseClient({ apiKey });

      // Create task
      const taskObj = await client.tasks.createTask({ task });

      // Complete the task and get result
      const result = await taskObj.complete();

      return {
        success: true,
        task,
        output: result.output,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Browser automation failed",
      };
    }
  },
};

/**
 * BrowserUse automation schemas
 */
export const browseruseSchemas = {
  executeSchema: z.object({
    task: z
      .string()
      .describe(
        "Natural language description of the browser task to perform (e.g., 'Navigate to example.com and extract the title', 'Search for AI news on Hacker News and return top 5 titles')",
      ),
    browserUseApiKey: z.string().optional().describe("BrowserUse API key (if not in env)"),
  }),
};
