/**
 * E2B Code Interpreter Sandbox Provider
 * Uses official e2b SDK: https://e2b.dev
 */

import { z } from "zod";
import type {
  E2BExecuteParams,
  IE2BProvider,
  ISandboxSchemas,
  SandboxResult,
} from "./types.js";

/**
 * E2B schemas
 */
export const e2bSchemas: ISandboxSchemas = {
  executeSchema: z.object({
    language: z.enum(["python", "javascript", "bash"]).describe("Programming language to execute"),
    code: z.string().describe("Code to execute in the sandbox"),
    e2bApiKey: z.string().optional().describe("E2B API key (if not in env)"),
  }),
};

/**
 * E2B provider implementation
 */
export const e2bProvider: IE2BProvider = {
  async execute(params: E2BExecuteParams): Promise<SandboxResult> {
    try {
      const { language, code, e2bApiKey } = params;
      const apiKey = e2bApiKey || process.env.E2B_API_KEY;

      if (!apiKey) {
        return {
          success: false,
          error:
            "E2B API key not configured. Set E2B_API_KEY environment variable or pass e2bApiKey parameter. Get key at: https://e2b.dev",
        };
      }

      // Use official e2b SDK
      const { Sandbox } = await import("e2b");

      const sandbox = await Sandbox.create({
        apiKey,
      });

      try {
        let result: {
          stdout: string;
          stderr: string;
          exitCode: number;
        };
        if (language === "python") {
          const execution = await sandbox.commands.run(`python3 -c "${code.replace(/"/g, '\\"')}"`);
          result = {
            stdout: execution.stdout,
            stderr: execution.stderr,
            exitCode: execution.exitCode,
          };
        } else if (language === "javascript") {
          const execution = await sandbox.commands.run(`node -e "${code.replace(/"/g, '\\"')}"`);
          result = {
            stdout: execution.stdout,
            stderr: execution.stderr,
            exitCode: execution.exitCode,
          };
        } else {
          // bash
          const execution = await sandbox.commands.run(code);
          result = {
            stdout: execution.stdout,
            stderr: execution.stderr,
            exitCode: execution.exitCode,
          };
        }

        return {
          success: true,
          language,
          output: result,
        };
      } finally {
        await sandbox.kill();
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "E2B execution failed",
      };
    }
  },
};
