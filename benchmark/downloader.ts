/**
 * GAIA dataset downloader
 * Downloads complete dataset snapshot from Hugging Face (including attachments)
 */

import { snapshotDownload } from "@huggingface/hub";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import mime from "mime-types";
import type { GaiaTask } from "./types.js";

/**
 * Custom MIME type mapping for files not recognized by mime-types library
 */
const getCustomContentType = (fileName: string): string | undefined => {
  const extension = fileName.toLowerCase().split(".").pop();

  const customMimeTypes: Record<string, string> = {
    py: "text/x-python",
    ipynb: "application/x-ipynb+json",
    r: "text/x-r",
    sql: "text/x-sql",
    sh: "text/x-sh",
    bash: "text/x-sh",
    yml: "text/yaml",
    yaml: "text/yaml",
    toml: "application/toml",
    ini: "text/x-ini",
    cfg: "text/x-ini",
    conf: "text/x-ini",
    log: "text/x-log",
    md: "text/markdown",
    markdown: "text/markdown",
    json: "application/json",
    xml: "application/xml",
    csv: "text/csv",
    tsv: "text/tab-separated-values",
    txt: "text/plain",
    text: "text/plain",
  };

  return extension ? customMimeTypes[extension] : undefined;
};

/**
 * Download complete GAIA dataset snapshot from Hugging Face
 */
async function downloadDatasetSnapshot(cacheDir: string): Promise<string> {
  const snapshotPath = await snapshotDownload({
    repo: {
      type: "dataset",
      name: "gaia-benchmark/GAIA",
    },
    cacheDir,
    accessToken: process.env.HUGGINGFACE_TOKEN,
  });
  return snapshotPath;
}

/**
 * Load GAIA dataset from downloaded snapshot using DuckDB
 */
async function loadSnapshotData(
  snapshotDir: string,
  dataDir: string = "2023",
  split: "validation" | "test" = "test",
): Promise<GaiaTask[]> {
  const dataPath = join(snapshotDir, dataDir, split);
  const parquetFile = join(dataPath, "metadata.parquet");

  if (!existsSync(parquetFile)) {
    throw new Error(`Parquet file not found: ${parquetFile}`);
  }

  // Use DuckDB to read Parquet file
  // biome-ignore lint/suspicious/noExplicitAny: Dynamic import of DuckDB
  const { DuckDBConnection } = (await import("@duckdb/node-api")) as any;

  const connection = await DuckDBConnection.create();
  const tasks: GaiaTask[] = [];

  try {
    const escaped = parquetFile.replace(/'/g, "''");
    const reader = await connection.runAndReadAll(`select * from read_parquet('${escaped}')`);
    const rows = reader.getRowObjects();

    for (const row of rows) {
      const levelNum = Number.parseInt(String(row.Level ?? row.level ?? "1"), 10);
      const level = (levelNum >= 1 && levelNum <= 3 ? levelNum : 1) as 1 | 2 | 3;

      const task: GaiaTask = {
        id: String(row.task_id ?? row.taskId ?? ""),
        question: String(row.Question ?? row.question ?? ""),
        level,
        answer: String(row["Final answer"] ?? row.final_answer ?? ""),
        metadata: {},
      };

      // Process Annotator Metadata
      const rawMetadata = row["Annotator Metadata"];
      if (rawMetadata) {
        if (typeof rawMetadata === "object" && rawMetadata !== null) {
          task.metadata = rawMetadata as Record<string, unknown>;
        } else if (typeof rawMetadata === "string") {
          try {
            task.metadata = JSON.parse(rawMetadata);
          } catch {
            // Ignore invalid metadata
          }
        }
      }

      // Process file attachment
      const fileName = String(row.file_name ?? row.filename ?? "");
      if (fileName) {
        const filePath = join(dataPath, fileName);
        if (existsSync(filePath)) {
          // Read file and convert to base64 data URL
          const buffer = readFileSync(filePath);
          const base64 = buffer.toString("base64");

          // Detect content type
          const detected =
            (mime.contentType(fileName) as string | false) || getCustomContentType(fileName);
          const contentType = detected || "application/octet-stream";

          task.files = [
            {
              name: fileName,
              path: filePath,
              type: contentType,
              data: `data:${contentType};base64,${base64}`,
            },
          ];
        }
      }

      tasks.push(task);
    }
  } finally {
    try {
      connection.closeSync();
    } catch {
      // Ignore close errors
    }
  }

  return tasks;
}

/**
 * Download GAIA dataset from Hugging Face with file attachments
 */
export async function downloadGaiaDataset(dataset: "validation" | "test"): Promise<GaiaTask[]> {
  console.log(`📥 Downloading ${dataset} dataset from Hugging Face (with attachments)...`);

  try {
    const cacheDir = join(process.cwd(), ".gaia-cache");
    const snapshotDir = await downloadDatasetSnapshot(cacheDir);
    const tasks = await loadSnapshotData(snapshotDir, "2023", dataset);

    const tasksWithFiles = tasks.filter((t) => t.files && t.files.length > 0);
    console.log(`✅ Downloaded ${tasks.length} tasks (${tasksWithFiles.length} with files)`);

    return tasks;
  } catch (error) {
    console.error("❌ Failed to download dataset:", error);
    if (error instanceof Error && error.message.includes("401")) {
      console.error(
        "   Please set HUGGINGFACE_TOKEN in your .env file.\n" +
          "   Get your token from: https://huggingface.co/settings/tokens",
      );
    }
    throw error;
  }
}
