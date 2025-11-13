/**
 * Tavily AI Search Provider
 * Uses official @tavily/core SDK: https://www.tavily.com
 */

import { z } from "zod";
import type { ISearchProvider, ISearchSchemas } from "./types.js";

/**
 * Tavily search schema
 */
const searchSchema = z.object({
  query: z.string().describe("Search query"),
  searchDepth: z
    .enum(["basic", "advanced"])
    .optional()
    .describe("Search depth (basic or advanced)"),
  maxResults: z.number().optional().describe("Maximum number of results (default: 5)"),
  includeDomains: z.array(z.string()).optional().describe("Domains to include in search"),
  excludeDomains: z.array(z.string()).optional().describe("Domains to exclude from search"),
  tavilyApiKey: z.string().optional().describe("Tavily API key (if not in env)"),
});

/**
 * Tavily provider implementation
 */
export const tavilyProvider: ISearchProvider = {
  search: async (params: Record<string, unknown>) => {
    const {
      query,
      searchDepth = "basic",
      maxResults = 5,
      includeDomains,
      excludeDomains,
      tavilyApiKey,
    } = params as z.infer<typeof searchSchema>;

    try {
      const apiKey = tavilyApiKey || process.env.TAVILY_API_KEY;

      if (!apiKey) {
        return {
          success: false,
          error:
            "Tavily API key not configured. Set TAVILY_API_KEY environment variable or pass tavilyApiKey parameter.",
        };
      }

      // Use official @tavily/core SDK
      const { tavily } = await import("@tavily/core");
      const client = tavily({ apiKey });

      const response = await client.search(query, {
        searchDepth: searchDepth === "advanced" ? "advanced" : "basic",
        maxResults,
        includeDomains,
        excludeDomains,
      });

      return {
        success: true,
        answer: response.answer,
        results: response.results.map((r) => ({
          title: r.title,
          url: r.url,
          content: r.content,
          score: r.score,
        })),
        query,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Tavily search failed",
      };
    }
  },
};

/**
 * Tavily schemas
 */
export const tavilySchemas: ISearchSchemas = {
  searchSchema,
};
