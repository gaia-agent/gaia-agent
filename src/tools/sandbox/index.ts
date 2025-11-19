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
      "Execute Python code in a secure Sandock sandbox. Only supports Python. Uses seey/sandock-python:latest image with pre-installed packages (numpy, pandas, requests, openpyxl, etc.)",
    inputSchema: sandockSchemas.executeSchema as unknown as Tool["inputSchema"],
    execute: sandockProvider.execute as unknown as Tool["execute"],
  });
};

/**
 * Create Sandock-specific tools (only available when provider is 'sandock')
 */
export const createSandockCreateSandboxTool = (): Tool => {
  return tool({
    description:
      "Create a new isolated Sandock sandbox environment. Returns a sandboxId that must be used in subsequent operations (shell, file operations, etc).",
    inputSchema: sandockSchemas.createSandboxSchema as unknown as Tool["inputSchema"],
    execute: sandockProvider.createSandbox as unknown as Tool["execute"],
  });
};

export const createSandockDeleteSandboxTool = (): Tool => {
  return tool({
    description:
      "Delete a Sandock sandbox and free resources. Always call this when done to prevent resource leaks.",
    inputSchema: sandockSchemas.deleteSandboxSchema as unknown as Tool["inputSchema"],
    execute: sandockProvider.deleteSandbox as unknown as Tool["execute"],
  });
};

export const createSandockShellExecTool = (): Tool => {
  return tool({
    description:
      "Execute shell commands in a Sandock sandbox. Use for file operations, system commands, or running tools.",
    inputSchema: sandockSchemas.shellExecSchema as unknown as Tool["inputSchema"],
    execute: sandockProvider.shellExec as unknown as Tool["execute"],
  });
};

export const createSandockWriteFileTool = (): Tool => {
  return tool({
    description:
      "Write text content to a file in a Sandock sandbox. Use for creating scripts, config files, or text data. If it's code, the result should be printed in the log, e.g., using print() in Python.",
    inputSchema: sandockSchemas.writeFileSchema as unknown as Tool["inputSchema"],
    execute: sandockProvider.writeFile as unknown as Tool["execute"],
  });
};

export const createSandockDownloadFileTool = (): Tool => {
  return tool({
    description:
      "Download a file from URL into a Sandock sandbox. Use for importing user-uploaded files (ZIP, CSV, images). File content never passes through agent, avoiding token consumption.",
    inputSchema: sandockSchemas.downloadFileSchema as unknown as Tool["inputSchema"],
    execute: sandockProvider.downloadFile as unknown as Tool["execute"],
  });
};

/**
 * Create all sandbox tools for a provider
 */
export const createSandboxTools = (provider: SandboxProvider = DEFAULT_PROVIDERS.sandbox) => {
  const tools: Record<string, Tool> = {
    sandboxExecute: createSandboxTool(provider),
  };

  // Add Sandock-specific tools only when using Sandock provider
  if (provider === "sandock") {
    tools.sandockCreateSandbox = createSandockCreateSandboxTool();
    tools.sandockDeleteSandbox = createSandockDeleteSandboxTool();
    tools.sandockShellExec = createSandockShellExecTool();
    tools.sandockWriteFile = createSandockWriteFileTool();
    tools.sandockDownloadFile = createSandockDownloadFileTool();
  }

  return tools;
};

// Export provider instances and schemas for advanced use
export { e2bProvider, e2bSchemas } from "./e2b.js";
export { sandockProvider, sandockSchemas } from "./sandock.js";
export type { SandboxProvider } from "./types.js";

// Deprecated: Legacy exports for backward compatibility
export const e2bSandbox = createSandboxTool("e2b");
export const sandockExecute = createSandboxTool("sandock");
