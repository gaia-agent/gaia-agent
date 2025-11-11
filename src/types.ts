/**
 * Type definitions for gaia-agent
 *
 * Re-exports from AI SDK v6 for convenience
 */

export type { CoreMessage, Tool, ToolLoopAgent } from "ai";

/**
 * GAIA benchmark task definition
 */
export interface GaiaTask {
  /** Task unique identifier */
  id: string;

  /** Task difficulty level (1-3) */
  level: 1 | 2 | 3;

  /** Task question/prompt */
  question: string;

  /** Expected answer (for validation) */
  answer?: string;

  /** Attached files (if any) */
  files?: Array<{
    name: string;
    path: string;
    type: string;
  }>;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * GAIA benchmark result
 */
export interface GaiaBenchmarkResult {
  /** Task ID */
  taskId: string;

  /** Agent's answer */
  answer: string;

  /** Expected answer */
  expectedAnswer?: string;

  /** Whether answer is correct */
  correct: boolean;

  /** Execution time in ms */
  durationMs: number;

  /** Number of iterations/steps */
  steps: number;

  /** Error message if failed */
  error?: string;
}

/**
 * Available browser providers
 */
export type BrowserProvider = "browseruse" | "aws-agentcore";

/**
 * Available sandbox providers
 */
export type SandboxProvider = "e2b" | "sandock";

/**
 * Available search providers
 */
export type SearchProvider = "tavily" | "exa";

/**
 * Available memory providers
 */
export type MemoryProvider = "mem0" | "agentcore";

/**
 * Provider configuration for agent tools
 */
export interface ProviderConfig {
  /** Browser automation provider */
  browser?: BrowserProvider;

  /** Code execution sandbox provider */
  sandbox?: SandboxProvider;

  /** Web search provider */
  search?: SearchProvider;

  /** Memory management provider */
  memory?: MemoryProvider;
}
