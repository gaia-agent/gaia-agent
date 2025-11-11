/**
 * Mem0 Memory Provider Implementation
 */

import { z } from "zod";
import type {
  IMem0Provider,
  IMemorySchemas,
  Mem0RetrieveParams,
  Mem0StoreParams,
  MemoryResult,
} from "./types.js";

/**
 * Mem0 schemas
 */
export const mem0Schemas: IMemorySchemas = {
  storeSchema: z.object({
    key: z.string().describe("Memory key/identifier"),
    value: z.string().describe("Information to remember"),
    mem0ApiKey: z.string().optional().describe("Mem0 API key (if not in env)"),
  }),

  retrieveSchema: z.object({
    key: z.string().describe("Memory key to retrieve"),
    mem0ApiKey: z.string().optional().describe("Mem0 API key (if not in env)"),
  }),

  deleteSchema: z.object({
    key: z.string().describe("Memory key"),
  }),
};

/**
 * Mem0 provider implementation
 */
export const mem0Provider: IMem0Provider = {
  async store(params: Mem0StoreParams): Promise<MemoryResult> {
    try {
      const { key, value, mem0ApiKey } = params;
      const apiKey = mem0ApiKey || process.env.MEM0_API_KEY;

      if (!apiKey) {
        return {
          success: false,
          error: "Mem0 API key not configured. Set MEM0_API_KEY environment variable.",
        };
      }

      const response = await fetch("https://api.mem0.ai/v1/memories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${apiKey}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: value }],
          user_id: key,
        }),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Mem0 API error: ${response.statusText}`,
        };
      }

      const result = await response.json();

      return {
        success: true,
        message: `Stored memory: ${key}`,
        data: result,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Memory storage failed",
        success: false,
      };
    }
  },

  async retrieve(params: Mem0RetrieveParams): Promise<MemoryResult> {
    try {
      const { key, mem0ApiKey } = params;
      const apiKey = mem0ApiKey || process.env.MEM0_API_KEY;

      if (!apiKey) {
        return {
          success: false,
          error: "Mem0 API key not configured. Set MEM0_API_KEY environment variable.",
        };
      }

      const response = await fetch(`https://api.mem0.ai/v1/memories/?user_id=${key}`, {
        method: "GET",
        headers: {
          Authorization: `Token ${apiKey}`,
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Mem0 API error: ${response.statusText}`,
        };
      }

      const result = await response.json();

      return {
        success: true,
        key,
        memories: result,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Memory retrieval failed",
        success: false,
      };
    }
  },

  async delete(): Promise<MemoryResult> {
    return {
      success: false,
      error: "Delete operation is not supported by Mem0 provider",
    };
  },
};
