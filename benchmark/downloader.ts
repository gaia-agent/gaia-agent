/**
 * GAIA dataset downloader
 * Downloads Parquet files from Hugging Face and parses them
 */

import { parquetRead } from "hyparquet";
import type { GaiaTask } from "./types.js";

/**
 * Download GAIA dataset from Hugging Face
 * Updated to use Parquet format (metadata.parquet instead of .jsonl)
 */
export async function downloadGaiaDataset(dataset: "validation" | "test"): Promise<GaiaTask[]> {
  const datasetUrl =
    dataset === "validation"
      ? "https://huggingface.co/datasets/gaia-benchmark/GAIA/resolve/main/2023/validation/metadata.parquet"
      : "https://huggingface.co/datasets/gaia-benchmark/GAIA/resolve/main/2023/test/metadata.parquet";

  console.log(`📥 Downloading ${dataset} dataset from Hugging Face (Parquet format)...`);

  try {
    // Add Hugging Face token if available for authentication
    const headers: Record<string, string> = {};
    if (process.env.HUGGINGFACE_TOKEN) {
      headers.Authorization = `Bearer ${process.env.HUGGINGFACE_TOKEN}`;
    }

    const response = await fetch(datasetUrl, { headers });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(
          `HTTP 401: Unauthorized - GAIA dataset requires Hugging Face authentication.\n` +
            `Please set HUGGINGFACE_TOKEN in your .env file.\n` +
            `Get your token from: https://huggingface.co/settings/tokens`
        );
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Read Parquet file using hyparquet
    const arrayBuffer = await response.arrayBuffer();

    let tasks: GaiaTask[] = [];

    // Read Parquet file with hyparquet (rowFormat: 'object' returns rows as objects)
    await parquetRead({
      file: arrayBuffer,
      rowFormat: "object",
      onComplete: (data: unknown[]) => {
        tasks = data.map((row: unknown): GaiaTask => {
          const r = row as Record<string, unknown>;
          const levelNum = Number.parseInt(String(r.Level), 10) || 1;
          const level = (levelNum >= 1 && levelNum <= 3 ? levelNum : 1) as 1 | 2 | 3;

          return {
            id: String(r.task_id || ""),
            question: String(r.Question || ""),
            level,
            answer: String(r.Final_answer || ""),
            files: r.file_name
              ? [
                  {
                    name: String(r.file_name),
                    path: String(r.file_path || ""),
                    type: "unknown",
                  },
                ]
              : undefined,
            metadata: (r.Annotator_Metadata as Record<string, unknown>) || {},
          };
        });
      },
    });

    console.log(`✅ Downloaded ${tasks.length} tasks`);
    return tasks;
  } catch (error) {
    console.error("❌ Failed to download dataset:", error);
    console.error("   Note: GAIA benchmark now uses Parquet format instead of JSONL");
    throw error;
  }
}
