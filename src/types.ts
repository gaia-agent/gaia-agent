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
    data?: string; // Base64 data URL for file content
  }>;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Tool call details for benchmark results
 */
export interface ToolCallDetail {
  /** Tool name */
  toolName: string;

  /** Tool call ID */
  toolCallId: string;

  /** Tool arguments */
  args: Record<string, unknown>;
}

/**
 * Tool result details for benchmark results
 */
export interface ToolResultDetail {
  /** Tool name */
  toolName: string;

  /** Tool call ID */
  toolCallId: string;

  /** Tool result data */
  result: unknown;
}

/**
 * Step details for benchmark results
 */
export interface StepDetail {
  /** Step index */
  stepIndex: number;

  /** Tool calls in this step */
  toolCalls?: ToolCallDetail[];

  /** Tool results in this step */
  toolResults?: ToolResultDetail[];

  /** Text generated in this step */
  text?: string;
}

/**
 * GAIA benchmark result
 */
export interface GaiaBenchmarkResult {
  /** Task ID */
  taskId: string;

  /** Task question (for easier log reading) */
  question: string;

  /** Task difficulty level */
  level: 1 | 2 | 3;

  /** File attachments (if any) */
  files?: string[];

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

  /** Detailed step execution data */
  stepDetails?: StepDetail[];

  /** Error message if failed */
  error?: string;

  /** Tools used in this task */
  toolsUsed?: string[];

  /** Summary of what the agent did */
  summary?: {
    totalToolCalls: number;
    uniqueTools: string[];
    hadError: boolean;
  };

  /** Additional metadata (e.g., for ReAct planner features) */
  metadata?: {
    attempts?: number;
    confidence?: number;
    finalReflection?: string;
  };
}

/**
 * Available browser providers
 */
/**
 * Browser provider types
 */
export type BrowserProvider = "steel" | "browseruse" | "aws-bedrock-agentcore";

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
  /** Browser automation provider (undefined to disable) */
  browser?: BrowserProvider | undefined;

  /** Code execution sandbox provider (undefined to disable) */
  sandbox?: SandboxProvider | undefined;

  /** Web search provider (undefined to disable) */
  search?: SearchProvider | undefined;

  /** Memory management provider (undefined to disable) */
  memory?: MemoryProvider | undefined;
}
