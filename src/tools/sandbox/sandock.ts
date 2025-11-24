/**
 * Sandock Sandbox Provider
 * Using official Sandock SDK from https://sandock.ai
 */

import { randomUUID } from "node:crypto";
import { z } from "zod";
import type {
  ISandboxSchemas,
  ISandockProvider,
  SandboxResult,
  SandockCreateSandboxParams,
  SandockDeleteSandboxParams,
  SandockDownloadFileParams,
  SandockExecuteParams,
  SandockShellExecParams,
  SandockWriteFileParams,
} from "./types.js";

// Fixed Docker image for consistent Python environment
const SANDOCK_PYTHON_IMAGE = "seey/sandock-python:latest";

async function getSandockClient(apiKey: string) {
  const { createSandockClient } = await import("sandock");
  const apiUrl = process.env.SANDOCK_API_URL || "https://sandock.ai";
  return createSandockClient({
    baseUrl: apiUrl,
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
}

/**
 * Sandock schemas
 * Note: Sandock only supports Python code execution
 */
export const sandockSchemas: ISandboxSchemas = {
  executeSchema: z.object({
    language: z.enum(["python", "bash", "browser"]).describe("Execution environment"),
    code: z
      .string()
      .describe("Code to Python execute or browser commands. Use print() to output results."),
    sandockApiKey: z.string().optional().describe("Sandock API key (if not in env)"),
  }),
  createSandboxSchema: z.object({
    name: z.string().optional().describe("Optional name for the sandbox (default: auto-generated)"),
    memoryLimitMb: z.number().int().positive().optional().describe("Memory limit in MB"),
    cpuShares: z.number().int().positive().optional().describe("CPU shares (relative weight)"),
    keep: z
      .boolean()
      .default(false)
      .describe("Keep sandbox alive (default: false for ephemeral sandboxes)"),
    sandockApiKey: z.string().optional().describe("Sandock API key (if not in env)"),
  }),
  deleteSandboxSchema: z.object({
    sandboxId: z.string().describe("The sandbox ID to delete"),
    sandockApiKey: z.string().optional().describe("Sandock API key (if not in env)"),
  }),
  shellExecSchema: z.object({
    sandboxId: z.string().describe("The sandbox ID returned from sandock_create_sandbox"),
    command: z
      .union([z.string(), z.array(z.string())])
      .describe(
        'Shell command to execute. Can be a string ("ls -la") or array (["bash", "-c", "ls"])',
      ),
    workdir: z
      .string()
      .optional()
      .describe("Working directory for command execution (default: sandbox root)"),
    timeout: z
      .number()
      .int()
      .positive()
      .default(30)
      .describe("Execution timeout in seconds (default: 30, max: 300)"),
    env: z
      .record(z.string(), z.string())
      .optional()
      .describe("Environment variables for the command"),
    sandockApiKey: z.string().optional().describe("Sandock API key (if not in env)"),
  }),
  writeFileSchema: z.object({
    sandboxId: z.string().describe("The sandbox ID returned from sandock_create_sandbox"),
    path: z.string().describe("File path in the sandbox (e.g., '/workspace/script.py')"),
    content: z.string().describe("Text content to write to the file. Code to Python execute or browser commands. Use print() to output results."),
    executable: z.boolean().optional().describe("Make the file executable (default: false)"),
    sandockApiKey: z.string().optional().describe("Sandock API key (if not in env)"),
  }),
  downloadFileSchema: z.object({
    sandboxId: z.string().describe("The sandbox ID returned from sandock_create_sandbox"),
    url: z.string().describe("URL of the file to download"),
    targetPath: z
      .string()
      .describe("Target file path in the sandbox (e.g., '/workspace/data.zip')"),
    timeout: z
      .number()
      .int()
      .positive()
      .default(60)
      .describe("Download timeout in seconds (default: 60, max: 300)"),
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
      const client = await getSandockClient(apiKey);

      // Use the /api/sandbox/{id}/code endpoint for code execution
      // This requires creating a sandbox first, then executing code
      // For simplicity, we'll use the run-code pattern from sandock-mcp

      // Create an ephemeral sandbox
      const sandboxName = `gaia-agent-${Date.now()}`;
      const { data: createData, error: createError } = await client.POST("/api/sandbox", {
        body: {
          name: sandboxName,
          image: SANDOCK_PYTHON_IMAGE, // Default Python image
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

  async createSandbox(params: SandockCreateSandboxParams): Promise<SandboxResult> {
    try {
      const { sandockApiKey } = params;
      const apiKey = sandockApiKey || process.env.SANDOCK_API_KEY;

      if (!apiKey) {
        return {
          success: false,
          error: "Sandock API key not configured. Set SANDOCK_API_KEY environment variable.",
        };
      }

      const client = await getSandockClient(apiKey);

      const sandboxName = params.name || `gaia-sandbox-${randomUUID().slice(0, 8)}`;

      const { data, error } = await client.POST("/api/sandbox", {
        body: {
          name: sandboxName,
          image: SANDOCK_PYTHON_IMAGE,
          ...(params.memoryLimitMb && { memoryLimitMb: params.memoryLimitMb }),
          ...(params.cpuShares && { cpuShares: params.cpuShares }),
          keep: params.keep ?? false,
        },
      });

      if (error || !data) {
        return {
          success: false,
          error: `Failed to create sandbox: ${error || "Unknown error"}`,
        };
      }

      return {
        success: true,
        sandboxId: data.data.id,
        name: sandboxName,
        message: "Sandbox created successfully. Use this sandboxId for subsequent operations.",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Sandbox creation failed",
      };
    }
  },

  async deleteSandbox(params: SandockDeleteSandboxParams): Promise<SandboxResult> {
    try {
      const { sandboxId, sandockApiKey } = params;
      const apiKey = sandockApiKey || process.env.SANDOCK_API_KEY;

      if (!apiKey) {
        return {
          success: false,
          error: "Sandock API key not configured. Set SANDOCK_API_KEY environment variable.",
        };
      }

      const client = await getSandockClient(apiKey);

      const { data, error } = await client.DELETE("/api/sandbox/{id}", {
        params: {
          path: { id: sandboxId },
        },
      });

      if (error || !data) {
        // 404 means already deleted - treat as success
        const errorObj = error as { status?: number };
        if (errorObj?.status === 404) {
          return {
            success: true,
            sandboxId,
            message: "Sandbox not found (may have been already deleted)",
            alreadyDeleted: true,
          };
        }

        return {
          success: false,
          error: `Failed to delete sandbox: ${error || "Unknown error"}`,
          sandboxId,
        };
      }

      return {
        success: true,
        sandboxId,
        message: "Sandbox deleted successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Sandbox deletion failed",
        sandboxId: params.sandboxId,
      };
    }
  },

  async shellExec(params: SandockShellExecParams): Promise<SandboxResult> {
    try {
      const { sandboxId, command, workdir, timeout = 30, env, sandockApiKey } = params;
      const apiKey = sandockApiKey || process.env.SANDOCK_API_KEY;

      if (!apiKey) {
        return {
          success: false,
          error: "Sandock API key not configured. Set SANDOCK_API_KEY environment variable.",
        };
      }

      const client = await getSandockClient(apiKey);

      const maxTimeout = Math.min(timeout, 300);

      const { data, error } = await client.POST("/api/sandbox/{id}/shell", {
        params: {
          path: { id: sandboxId },
        },
        body: {
          cmd: command,
          timeoutMs: maxTimeout * 1000,
          ...(workdir && { workdir }),
          ...(env && { env }),
        },
      });

      if (error || !data) {
        return {
          success: false,
          error: `Shell execution failed: ${error || "Unknown error"}`,
          sandboxId,
        };
      }

      const result = data.data;
      return {
        success: true,
        sandboxId,
        stdout: result.stdout || "",
        stderr: result.stderr || "",
        exitCode: result.exitCode,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Shell execution failed",
        sandboxId: params.sandboxId,
      };
    }
  },

  async writeFile(params: SandockWriteFileParams): Promise<SandboxResult> {
    try {
      const { sandboxId, path, content, executable, sandockApiKey } = params;
      const apiKey = sandockApiKey || process.env.SANDOCK_API_KEY;

      if (!apiKey) {
        return {
          success: false,
          error: "Sandock API key not configured. Set SANDOCK_API_KEY environment variable.",
        };
      }

      const client = await getSandockClient(apiKey);

      const { data, error } = await client.POST("/api/sandbox/{id}/fs/write", {
        params: {
          path: { id: sandboxId },
        },
        body: {
          path,
          content,
          ...(executable !== undefined && { executable }),
        },
      });

      if (error || !data) {
        return {
          success: false,
          error: `Failed to write file: ${error || "Unknown error"}`,
          sandboxId,
          path,
        };
      }

      return {
        success: true,
        sandboxId,
        path,
        message: `File written successfully to ${path}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "File write failed",
        sandboxId: params.sandboxId,
        path: params.path,
      };
    }
  },

  async downloadFile(params: SandockDownloadFileParams): Promise<SandboxResult> {
    try {
      const { sandboxId, url, targetPath, timeout = 60, sandockApiKey } = params;
      const apiKey = sandockApiKey || process.env.SANDOCK_API_KEY;

      if (!apiKey) {
        return {
          success: false,
          error: "Sandock API key not configured. Set SANDOCK_API_KEY environment variable.",
        };
      }

      const client = await getSandockClient(apiKey);

      const maxTimeout = Math.min(timeout, 300);

      // Try wget first
      let { data, error } = await client.POST("/api/sandbox/{id}/shell", {
        params: {
          path: { id: sandboxId },
        },
        body: {
          cmd: ["wget", "-O", targetPath, url],
          timeoutMs: maxTimeout * 1000,
        },
      });

      // If wget failed, try curl
      if (error || !data || data.data.exitCode !== 0) {
        ({ data, error } = await client.POST("/api/sandbox/{id}/shell", {
          params: {
            path: { id: sandboxId },
          },
          body: {
            cmd: ["curl", "-L", "-o", targetPath, url],
            timeoutMs: maxTimeout * 1000,
          },
        }));

        if (error || !data || data.data.exitCode !== 0) {
          return {
            success: false,
            error: `Failed to download file: ${error || "Both wget and curl failed"}`,
            sandboxId,
            url,
            targetPath,
          };
        }
      }

      const result = data.data;
      return {
        success: true,
        sandboxId,
        url,
        targetPath,
        message: `File downloaded successfully to ${targetPath}`,
        stdout: result.stdout,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "File download failed",
        sandboxId: params.sandboxId,
        url: params.url,
        targetPath: params.targetPath,
      };
    }
  },
};
