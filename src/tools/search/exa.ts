/**
 * Exa Neural Search Provider
 * Uses official exa-js SDK: https://exa.ai
 */

import { z } from "zod";
import type { ISearchProvider, ISearchSchemas } from "./types.js";

/**
 * Exa search schema
 */
const searchSchema = z.object({
  query: z.string().describe("Search query"),
  numResults: z.number().optional().describe("Number of results (default: 10)"),
  category: z
    .enum([
      "company",
      "research paper",
      "news",
      "github",
      "tweet",
      "personal site",
      "pdf",
      "linkedin profile",
      "financial report",
    ])
    .optional()
    .describe("Category filter"),
  startPublishedDate: z.string().optional().describe("Filter by published date (YYYY-MM-DD)"),
  endPublishedDate: z.string().optional().describe("Filter by published date (YYYY-MM-DD)"),
  exaApiKey: z.string().optional().describe("Exa API key (if not in env)"),
});

/**
 * Exa get contents schema
 */
const getContentsSchema = z.object({
  ids: z.array(z.string()).describe("Result IDs from exaSearch"),
  exaApiKey: z.string().optional().describe("Exa API key (if not in env)"),
});

/**
 * Exa find similar schema
 */
const findSimilarSchema = z.object({
  url: z.string().describe("URL to find similar content for"),
  numResults: z.number().optional().describe("Number of results (default: 10)"),
  exaApiKey: z.string().optional().describe("Exa API key (if not in env)"),
});

/**
 * Exa provider implementation
 */
export const exaProvider: ISearchProvider = {
  search: async (params: Record<string, unknown>) => {
    const {
      query,
      numResults = 10,
      category,
      startPublishedDate,
      endPublishedDate,
      exaApiKey,
    } = params as z.infer<typeof searchSchema>;

    try {
      const apiKey = exaApiKey || process.env.EXA_API_KEY;

      if (!apiKey) {
        return {
          success: false,
          error:
            "Exa API key not configured. Set EXA_API_KEY environment variable or pass exaApiKey parameter.",
        };
      }

      const Exa = (await import("exa-js")).default;
      const exa = new Exa(apiKey);

      const response = await exa.search(query, {
        numResults,
        category,
        startPublishedDate,
        endPublishedDate,
      });

      return {
        success: true,
        results: response.results.map((r) => ({
          title: r.title,
          url: r.url,
          publishedDate: r.publishedDate,
          author: r.author,
          score: r.score,
        })),
        query,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Exa search failed",
      };
    }
  },

  getContents: async (params: Record<string, unknown>) => {
    const { ids, exaApiKey } = params as z.infer<typeof getContentsSchema>;

    try {
      const apiKey = exaApiKey || process.env.EXA_API_KEY;

      if (!apiKey) {
        return {
          success: false,
          error: "Exa API key not configured.",
        };
      }

      const Exa = (await import("exa-js")).default;
      const exa = new Exa(apiKey);

      const response = await exa.getContents(ids, { text: true });

      return {
        success: true,
        // biome-ignore lint/suspicious/noExplicitAny: Exa SDK response type
        contents: response.results.map((r: any) => ({
          id: r.id,
          url: r.url,
          title: r.title,
          text: r.text,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get contents",
      };
    }
  },

  findSimilar: async (params: Record<string, unknown>) => {
    const { url, numResults = 10, exaApiKey } = params as z.infer<typeof findSimilarSchema>;

    try {
      const apiKey = exaApiKey || process.env.EXA_API_KEY;

      if (!apiKey) {
        return {
          success: false,
          error: "Exa API key not configured.",
        };
      }

      const Exa = (await import("exa-js")).default;
      const exa = new Exa(apiKey);

      const response = await exa.findSimilar(url, { numResults });

      return {
        success: true,
        results: response.results.map((r) => ({
          title: r.title,
          url: r.url,
          score: r.score,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to find similar content",
      };
    }
  },
};

/**
 * Exa schemas
 */
export const exaSchemas: ISearchSchemas = {
  searchSchema,
  getContentsSchema,
  findSimilarSchema,
};
