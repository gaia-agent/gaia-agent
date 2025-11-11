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

/**
 * Provider-specific interfaces
 */
export interface IE2BProvider {
  execute: (params: E2BExecuteParams) => Promise<SandboxResult>;
}

export interface ISandockProvider {
  execute: (params: SandockExecuteParams) => Promise<SandboxResult>;
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
}
