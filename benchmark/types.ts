/**
 * Benchmark-specific type definitions
 */

import type { GaiaBenchmarkResult, GaiaTask, StepDetail } from "../src/types.js";

export interface BenchmarkConfig {
  dataset: "validation" | "test";
  level?: 1 | 2 | 3;
  limit?: number;
  random?: boolean;
  outputDir: string;
  verbose: boolean;
  stream?: boolean;
  category?: "files" | "code" | "search" | "browser" | "reasoning";
  resume?: boolean;
}

export interface HuggingFaceTask {
  task_id: string;
  Level: number;
  Question: string;
  Final_answer?: string;
  file_name?: string;
  file_path?: string;
  Annotator_Metadata?: Record<string, unknown>;
}

export type { GaiaBenchmarkResult, GaiaTask, StepDetail };
