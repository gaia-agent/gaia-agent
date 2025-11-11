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
 * AgentCore specific types
 */
export interface AgentCoreStoreParams {
  sessionId: string;
  content: string;
  metadata?: Record<string, string>;
  awsRegion?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  memoryId?: string;
}

export interface AgentCoreRetrieveParams {
  sessionId: string;
  query?: string;
  maxResults?: number;
  awsRegion?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
}

export interface AgentCoreDeleteParams {
  sessionId: string;
  memoryId: string;
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
 */
export interface IMemoryProvider {
  store: (params: unknown) => Promise<MemoryResult>;
  retrieve: (params: unknown) => Promise<MemoryResult>;
  delete?: (params: unknown) => Promise<MemoryResult>;
}

/**
 * Schema definitions for each provider
 */
export interface IMemorySchemas {
  storeSchema: z.ZodObject<any>;
  retrieveSchema: z.ZodObject<any>;
  deleteSchema?: z.ZodObject<any>;
}
