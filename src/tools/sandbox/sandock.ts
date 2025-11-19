/**
 * Sandock Sandbox Provider
 * Using official Sandock SDK from https://sandock.ai
 */

import { createSandockClient } from "sandock";
import { z } from "zod";
import type {
  ISandboxSchemas,
  ISandockProvider,
  SandboxResult,
  SandockExecuteParams,
} from "./types.js";

/**
 * Sandock schemas
 * Note: Sandock only supports Python code execution
 */
export const sandockSchemas: ISandboxSchemas = {
  executeSchema: z.object({
    language: z.enum(["python", "bash", "browser"]).describe("Execution environment"),
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
      const { code, sandockApiKey } = params;
      const apiKey = sandockApiKey || process.env.SANDOCK_API_KEY;

      if (!apiKey) {
        return {
          success: false,
          error: "Sandock API key not configured. Set SANDOCK_API_KEY environment variable.",
        };
      }

      // Initialize Sandock client
      const apiUrl = process.env.SANDOCK_API_URL || "https://sandock.ai";
      const client = createSandockClient({
        baseUrl: apiUrl,
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      // Use the /api/sandbox/{id}/code endpoint for code execution
      // This requires creating a sandbox first, then executing code
      // For simplicity, we'll use the run-code pattern from sandock-mcp

      // Create an ephemeral sandbox
      const sandboxName = `gaia-agent-${Date.now()}`;
      const { data: createData, error: createError } = await client.POST("/api/sandbox", {
        body: {
          name: sandboxName,
          image: "seey/sandock-python:latest", // Default Python image
          keep: false, // Auto-cleanup
        },
      });

      if (createError || !createData) {
        return {
          success: false,
          error: `Failed to create sandbox: ${createError || "Unknown error"}`,
        };
      }

      const sandboxId = createData.data.id;

      try {
        // Execute Python code in the sandbox
        const { data: execData, error: execError } = await client.POST("/api/sandbox/{id}/code", {
          params: {
            path: { id: sandboxId },
          },
          body: {
            language: "python",
            code,
            timeoutMs: 30000, // 30 second timeout
          },
        });

        if (execError || !execData) {
          return {
            success: false,
            error: `Code execution failed: ${execError || "Unknown error"}`,
          };
        }

        // Format the result - SDK returns { data: { data: { stdout, stderr, ... } } }
        const result = execData.data;
        return {
          success: true,
          language: "python",
          output: result.stdout || "",
          error: result.stderr,
          exitCode: result.exitCode,
        };
      } finally {
        // Clean up the sandbox (async, non-blocking)
        if (sandboxId) {
          client
            .DELETE("/api/sandbox/{id}", {
              params: {
                path: { id: sandboxId },
              },
            })
            .catch((cleanupError) => {
              console.error(`Failed to cleanup sandbox ${sandboxId}:`, cleanupError);
            });
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Code execution failed",
      };
    }
  },
};
