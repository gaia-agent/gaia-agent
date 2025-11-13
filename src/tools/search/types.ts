/**
 * Search provider types and interfaces
 */

import type { z } from "zod";

/**
 * Search provider type
 */
export type SearchProvider = "openai" | "tavily" | "exa";

/**
 * Base search provider interface
 */
export interface ISearchProvider {
  search: (params: Record<string, unknown>) => Promise<unknown>;
  getContents?: (params: Record<string, unknown>) => Promise<unknown>;
  findSimilar?: (params: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Search tool schemas interface
 */
export interface ISearchSchemas {
  // biome-ignore lint/suspicious/noExplicitAny: Generic schema type
  searchSchema: z.ZodObject<any>;
  // biome-ignore lint/suspicious/noExplicitAny: Generic schema type
  getContentsSchema?: z.ZodObject<any>;
  // biome-ignore lint/suspicious/noExplicitAny: Generic schema type
  findSimilarSchema?: z.ZodObject<any>;
}
