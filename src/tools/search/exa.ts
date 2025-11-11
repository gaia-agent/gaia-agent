/**
 * Exa Neural Search Tools
 * Uses official exa-js SDK: https://exa.ai
 */

import { tool } from "ai";
import { z } from "zod";

/**
 * Exa search tool using official SDK
 * Install: npm install exa-js
 */
export const exaSearch = tool({
  description:
    "Search the web using Exa neural search engine. Uses AI to understand semantic meaning. Best for research, finding similar content, and discovery.",
  inputSchema: z.object({
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
  }),
  execute: async ({
    query,
    numResults = 10,
    category,
    startPublishedDate,
    endPublishedDate,
    exaApiKey,
  }) => {
    try {
      const apiKey = exaApiKey || process.env.EXA_API_KEY;

      if (!apiKey) {
        return {
          success: false,
          error:
            "Exa API key not configured. Set EXA_API_KEY environment variable or pass exaApiKey parameter.",
        };
      }

      // Use official exa-js SDK
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
});

/**
 * Exa get contents tool
 */
export const exaGetContents = tool({
  description: "Get full text content from Exa search results by URL or ID",
  inputSchema: z.object({
    ids: z.array(z.string()).describe("Result IDs from exaSearch"),
    exaApiKey: z.string().optional().describe("Exa API key (if not in env)"),
  }),
  execute: async ({ ids, exaApiKey }) => {
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
        contents: response.results.map((r) => ({
          id: r.id,
          url: r.url,
          title: r.title,
          text: (r as any).text,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get contents",
      };
    }
  },
});

/**
 * Exa find similar tool
 */
export const exaFindSimilar = tool({
  description: "Find content similar to a given URL using Exa's neural understanding",
  inputSchema: z.object({
    url: z.string().describe("URL to find similar content for"),
    numResults: z.number().optional().describe("Number of results (default: 10)"),
    exaApiKey: z.string().optional().describe("Exa API key (if not in env)"),
  }),
  execute: async ({ url, numResults = 10, exaApiKey }) => {
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
});
