/**
 * Search tool types and interfaces
 */

import type { z } from "zod";

export type SearchProvider = "tavily" | "exa";

/**
 * Common result types
 */
export interface SearchResult {
  success: boolean;
  error?: string;
  [key: string]: unknown;
}

/**
 * Tavily specific types
 */
export interface TavilySearchParams {
  query: string;
  tavilyApiKey?: string;
  maxResults?: number;
  searchDepth?: "basic" | "advanced";
  includeAnswer?: boolean;
  includeRawContent?: boolean;
}

/**
 * Exa specific types
 */
export interface ExaSearchParams {
  query: string;
  exaApiKey?: string;
  numResults?: number;
  type?: "keyword" | "neural" | "auto";
  useAutoprompt?: boolean;
  category?: string;
}

export interface ExaFindSimilarParams {
  url: string;
  exaApiKey?: string;
  numResults?: number;
  category?: string;
  excludeSourceDomain?: boolean;
}

export interface ExaGetContentsParams {
  ids: string[];
  exaApiKey?: string;
  text?: boolean;
}

/**
 * Provider-specific interfaces
 */
export interface ITavilyProvider {
  search: (params: TavilySearchParams) => Promise<SearchResult>;
}

export interface IExaProvider {
  search: (params: ExaSearchParams) => Promise<SearchResult>;
  findSimilar: (params: ExaFindSimilarParams) => Promise<SearchResult>;
  getContents: (params: ExaGetContentsParams) => Promise<SearchResult>;
}

/**
 * Generic search provider interface
 */
export interface ISearchProvider {
  search: (params: unknown) => Promise<SearchResult>;
  findSimilar?: (params: unknown) => Promise<SearchResult>;
  getContents?: (params: unknown) => Promise<SearchResult>;
}

/**
 * Schema definitions for each provider
 */
export interface ISearchSchemas {
  searchSchema: z.ZodObject<any>;
  findSimilarSchema?: z.ZodObject<any>;
  getContentsSchema?: z.ZodObject<any>;
}
