/**
 * Memory tool types and interfaces
 */

import type { z } from "zod";

export type MemoryProvider = "mem0" | "agentcore";

/**
 * Common result types
 */
export interface MemoryResult {
  success: boolean;
  error?: string;
  [key: string]: unknown;
}

/**
 * Mem0 specific types
 */
export interface Mem0StoreParams {
  key: string;
  value: string;
  mem0ApiKey?: string;
}

export interface Mem0RetrieveParams {
  key: string;
  mem0ApiKey?: string;
}

/**
 * AgentCore specific types - aligned with AWS SDK API
 */
export interface AgentCoreStoreParams {
  memoryId: string;
  content: string;
  namespace: string;
  memoryStrategyId?: string;
  awsRegion?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
}

export interface AgentCoreRetrieveParams {
  memoryId: string;
  namespace: string;
  query: string;
  topK?: number;
  memoryStrategyId?: string;
  maxResults?: number;
  awsRegion?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
}

export interface AgentCoreDeleteParams {
  memoryId: string;
  memoryRecordId: string;
  awsRegion?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
}

/**
 * Provider-specific interfaces
 */
export interface IMem0Provider {
  store: (params: Mem0StoreParams) => Promise<MemoryResult>;
  retrieve: (params: Mem0RetrieveParams) => Promise<MemoryResult>;
  delete: () => Promise<MemoryResult>;
}

export interface IAgentCoreProvider {
  store: (params: AgentCoreStoreParams) => Promise<MemoryResult>;
  retrieve: (params: AgentCoreRetrieveParams) => Promise<MemoryResult>;
  delete: (params: AgentCoreDeleteParams) => Promise<MemoryResult>;
}

/**
 * Generic memory provider interface (for factory use)
 * Uses bivariant function types for compatibility with specific provider types
 */
export interface IMemoryProvider {
  // biome-ignore lint/suspicious/noExplicitAny: Required for provider type compatibility in registry pattern
  store: (params: any) => Promise<MemoryResult>;
  // biome-ignore lint/suspicious/noExplicitAny: Required for provider type compatibility in registry pattern
  retrieve: (params: any) => Promise<MemoryResult>;
  // biome-ignore lint/suspicious/noExplicitAny: Required for provider type compatibility in registry pattern
  delete?: (params: any) => Promise<MemoryResult>;
}

/**
 * Schema definitions for each provider
 */
export interface IMemorySchemas {
  // biome-ignore lint/suspicious/noExplicitAny: Zod schema generic type
  storeSchema: z.ZodObject<any>;
  // biome-ignore lint/suspicious/noExplicitAny: Zod schema generic type
  retrieveSchema: z.ZodObject<any>;
  // biome-ignore lint/suspicious/noExplicitAny: Zod schema generic type
  deleteSchema?: z.ZodObject<any>;
}
