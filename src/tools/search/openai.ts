/**
 * OpenAI native web search provider
 * Uses OpenAI Responses API with built-in web_search_preview
 */

import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import type { ISearchProvider, ISearchSchemas } from "./types.js";

/**
 * OpenAI web search schema (empty object - OpenAI handles query internally)
 */
const searchSchema = z.object({});

/**
 * OpenAI provider implementation
 * Uses native OpenAI web search tool
 */
export const openaiProvider: ISearchProvider = {
  search: async (_params: Record<string, unknown>) => {
    // OpenAI web search is a tool, not a direct API call
    // It's used via openai.tools.webSearchPreview({})
    // This function is a placeholder for the provider interface
    return {
      success: true,
      message: "OpenAI web search is used as a native tool, not via direct API calls",
    };
  },
};

/**
 * OpenAI schemas
 */
export const openaiSchemas: ISearchSchemas = {
  searchSchema,
};

/**
 * OpenAI native web search tool
 * This is the actual tool that gets used
 * IMPORTANT: The tool name is "web_search" (set by OpenAI SDK)
 */
// biome-ignore lint/suspicious/noExplicitAny: OpenAI tool type
export const openaiWebSearch: any = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
}).tools.webSearchPreview({});
