/**
 * Browser automation tool types and interfaces
 */

import type { z } from "zod";

export type BrowserProvider = "steel" | "browseruse" | "aws-bedrock-agentcore";

/**
 * Common result types
 */
export interface BrowserResult {
  success: boolean;
  error?: string;
  [key: string]: unknown;
}

/**
 * Steel specific types
 */
export interface SteelBrowserParams {
  task: string;
  url?: string;
  steelApiKey?: string;
  useProxy?: boolean;
  solveCaptcha?: boolean;
  timeout?: number;
}

/**
 * BrowserUse specific types
 */
export interface BrowserUseBrowserParams {
  task: string;
  browserUseApiKey?: string;
}

/**
 * AWS AgentCore specific types
 */
export interface AWSBrowserParams {
  task: string;
  url?: string;
  browserIdentifier?: string;
  awsRegion?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
}

/**
 * Provider-specific interfaces
 */
export interface ISteelProvider {
  execute: (params: SteelBrowserParams) => Promise<BrowserResult>;
}

export interface IBrowserUseProvider {
  execute: (params: BrowserUseBrowserParams) => Promise<BrowserResult>;
}

export interface IAWSAgentCoreProvider {
  execute: (params: AWSBrowserParams) => Promise<BrowserResult>;
}

/**
 * Generic browser provider interface (for factory use)
 */
export interface IBrowserProvider {
  execute: (params: unknown) => Promise<BrowserResult>;
}

/**
 * Schema definitions for each provider
 */
export interface IBrowserSchemas {
  // biome-ignore lint/suspicious/noExplicitAny: Zod schema types are complex
  executeSchema: z.ZodObject<any>;
}
