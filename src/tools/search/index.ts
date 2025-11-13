/**
 * Search tools factory
 * Swappable providers: OpenAI, Tavily, Exa
 */

import type { Tool } from "ai";
import { tool } from "ai";
import { DEFAULT_PROVIDERS } from "../../config/defaults.js";
import { exaProvider, exaSchemas } from "./exa.js";
import { openaiWebSearch } from "./openai.js";
import { tavilyProvider, tavilySchemas } from "./tavily.js";
import type { SearchProvider } from "./types.js";

/**
 * Search tool factory
 * Creates a search tool based on the provider
 */
export const createSearchTool = (provider: SearchProvider = DEFAULT_PROVIDERS.search): Tool => {
  if (provider === "openai") {
    // OpenAI uses native tool, return it directly
    return openaiWebSearch;
  }

  if (provider === "tavily") {
    return tool({
      description:
        "Search the web using Tavily AI search engine. Returns AI-optimized, factual search results with sources. Best for research and fact-checking.",
      inputSchema: tavilySchemas.searchSchema as unknown as Tool["inputSchema"],
      execute: tavilyProvider.search as unknown as Tool["execute"],
    });
  }

  // Exa provider
  return tool({
    description:
      "Search the web using Exa neural search engine. Uses AI to understand semantic meaning. Best for research, finding similar content, and discovery.",
    inputSchema: exaSchemas.searchSchema as unknown as Tool["inputSchema"],
    execute: exaProvider.search as unknown as Tool["execute"],
  });
};

/**
 * Exa-specific tools (only for Exa provider)
 */
export const createExaGetContentsTool = (): Tool => {
  if (!exaSchemas.getContentsSchema || !exaProvider.getContents) {
    throw new Error("Exa getContents not available");
  }

  return tool({
    description: "Get full text content from Exa search results by URL or ID",
    inputSchema: exaSchemas.getContentsSchema as unknown as Tool["inputSchema"],
    execute: exaProvider.getContents as unknown as Tool["execute"],
  });
};

export const createExaFindSimilarTool = (): Tool => {
  if (!exaSchemas.findSimilarSchema || !exaProvider.findSimilar) {
    throw new Error("Exa findSimilar not available");
  }

  return tool({
    description: "Find content similar to a given URL using Exa's neural understanding",
    inputSchema: exaSchemas.findSimilarSchema as unknown as Tool["inputSchema"],
    execute: exaProvider.findSimilar as unknown as Tool["execute"],
  });
};

/**
 * Create all search tools for a provider
 */
export const createSearchTools = (provider: SearchProvider = DEFAULT_PROVIDERS.search) => {
  const searchTool = createSearchTool(provider);

  const tools: Record<string, Tool> = {};

  tools.search = searchTool;

  // Add Exa-specific tools if using Exa
  if (provider === "exa") {
    tools.searchGetContents = createExaGetContentsTool();
    tools.searchFindSimilar = createExaFindSimilarTool();
  }

  return tools;
};

// Export provider instances and schemas for advanced use
export { exaProvider, exaSchemas } from "./exa.js";
export { openaiProvider, openaiSchemas, openaiWebSearch } from "./openai.js";
export { tavilyProvider, tavilySchemas } from "./tavily.js";
export type { SearchProvider } from "./types.js";

// Legacy exports for backward compatibility
export const tavilySearch = createSearchTool("tavily");
export const exaSearch = createSearchTool("exa");
export const exaGetContents = createExaGetContentsTool();
export const exaFindSimilar = createExaFindSimilarTool();
