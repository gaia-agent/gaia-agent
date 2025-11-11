/**
 * Sandock Sandbox Provider
 * Awaiting official SDK from https://sandock.ai
 */

import { z } from "zod";
import type {
  ISandboxSchemas,
  ISandockProvider,
  SandboxResult,
  SandockExecuteParams,
} from "./types.js";

/**
 * Sandock schemas
 */
export const sandockSchemas: ISandboxSchemas = {
  executeSchema: z.object({
    language: z.enum(["python", "javascript", "bash", "browser"]).describe("Execution environment"),
    code: z.string().describe("Code to execute or browser commands"),
    sandockApiKey: z.string().optional().describe("Sandock API key (if not in env)"),
  }),
};

/**
 * Sandock provider implementation
 */
export const sandockProvider: ISandockProvider = {
  async execute(params: SandockExecuteParams): Promise<SandboxResult> {
    try {
      const { language, code, sandockApiKey } = params;
      const apiKey = sandockApiKey || process.env.SANDOCK_API_KEY;

      if (!apiKey) {
        return {
          success: false,
          error: "Sandock API key not configured. Set SANDOCK_API_KEY environment variable.",
        };
      }

      // TODO: Use official Sandock SDK when available
      // For now, use REST API
      const response = await fetch("https://api.sandock.ai/v1/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          language,
          code,
        }),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Sandock API error: ${response.statusText}`,
        };
      }

      const result = await response.json();

      return {
        success: true,
        language,
        output: result,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Code execution failed",
        success: false,
      };
    }
  },
};
