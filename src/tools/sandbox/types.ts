/**
 * Sandbox tool types and interfaces
 */

import type { z } from "zod";

export type SandboxProvider = "e2b" | "sandock";

/**
 * Common result types
 */
export interface SandboxResult {
  success: boolean;
  error?: string;
  [key: string]: unknown;
}

/**
 * E2B specific types
 */
export interface E2BExecuteParams {
  language: "python" | "javascript" | "bash";
  code: string;
  e2bApiKey?: string;
}

/**
 * Sandock specific types
 */
export interface SandockExecuteParams {
  language: "python" | "javascript" | "bash" | "browser";
  code: string;
  sandockApiKey?: string;
}

export interface SandockCreateSandboxParams {
  name?: string;
  memoryLimitMb?: number;
  cpuShares?: number;
  keep?: boolean;
  sandockApiKey?: string;
}

export interface SandockDeleteSandboxParams {
  sandboxId: string;
  sandockApiKey?: string;
}

export interface SandockShellExecParams {
  sandboxId: string;
  command: string | string[];
  workdir?: string;
  timeout?: number;
  env?: Record<string, string>;
  sandockApiKey?: string;
}

export interface SandockWriteFileParams {
  sandboxId: string;
  path: string;
  content: string;
  executable?: boolean;
  sandockApiKey?: string;
}

export interface SandockDownloadFileParams {
  sandboxId: string;
  url: string;
  targetPath: string;
  timeout?: number;
  sandockApiKey?: string;
}

/**
 * Provider-specific interfaces
 */
export interface IE2BProvider {
  execute: (params: E2BExecuteParams) => Promise<SandboxResult>;
}

export interface ISandockProvider {
  execute: (params: SandockExecuteParams) => Promise<SandboxResult>;
  createSandbox: (params: SandockCreateSandboxParams) => Promise<SandboxResult>;
  deleteSandbox: (params: SandockDeleteSandboxParams) => Promise<SandboxResult>;
  shellExec: (params: SandockShellExecParams) => Promise<SandboxResult>;
  writeFile: (params: SandockWriteFileParams) => Promise<SandboxResult>;
  downloadFile: (params: SandockDownloadFileParams) => Promise<SandboxResult>;
}

/**
 * Generic sandbox provider interface
 */
export interface ISandboxProvider {
  execute: (params: unknown) => Promise<SandboxResult>;
}

/**
 * Schema definitions for each provider
 */
export interface ISandboxSchemas {
  executeSchema: z.ZodObject<any>;
  createSandboxSchema?: z.ZodObject<any>;
  deleteSandboxSchema?: z.ZodObject<any>;
  shellExecSchema?: z.ZodObject<any>;
  writeFileSchema?: z.ZodObject<any>;
  downloadFileSchema?: z.ZodObject<any>;
}
