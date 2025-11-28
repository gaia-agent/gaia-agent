/**
 * Memory management tools factory
 * Swappable providers: Mem0, AWS AgentCore Memory
 *
 * Uses Registry Pattern for easy provider extension.
 * To add a new provider:
 * 1. Create provider file (e.g., newprovider.ts) with schemas and implementation
 * 2. Register in providerRegistry below
 */

import type { Tool } from "ai";
import { tool } from "ai";
import { agentcoreProvider, agentcoreSchemas } from "./agentcore.js";
import { mem0Provider, mem0Schemas } from "./mem0.js";
import type { IMemoryProvider, IMemorySchemas, MemoryProvider } from "./types.js";

/**
 * Provider configuration for registry
 */
interface ProviderConfig {
  provider: IMemoryProvider;
  schemas: IMemorySchemas;
  descriptions: {
    store: string;
    retrieve: string;
    delete?: string;
  };
}

/**
 * Provider registry - add new providers here
 * Each provider must have: provider instance, schemas, and tool descriptions
 */
const providerRegistry: Record<MemoryProvider, ProviderConfig> = {
  mem0: {
    provider: mem0Provider,
    schemas: mem0Schemas,
    descriptions: {
      store: "Store information in agent memory using Mem0 for future retrieval",
      retrieve: "Retrieve information from agent memory using Mem0",
      // Mem0 doesn't support delete (returns error in implementation)
    },
  },
  agentcore: {
    provider: agentcoreProvider,
    schemas: agentcoreSchemas,
    descriptions: {
      store: "Store information in agent memory using AWS Bedrock AgentCore for future retrieval",
      retrieve: "Retrieve information from agent memory using AWS Bedrock AgentCore",
      delete: "Delete specific memories from AWS Bedrock AgentCore memory",
    },
  },
};

/**
 * Get provider config with validation
 */
const getProviderConfig = (provider: MemoryProvider): ProviderConfig => {
  const config = providerRegistry[provider];
  if (!config) {
    throw new Error(`Unknown memory provider: ${provider}. Available: ${Object.keys(providerRegistry).join(", ")}`);
  }
  return config;
};

/**
 * Memory store/remember tool factory
 * Creates a memory storage tool based on the provider
 */
export const createMemoryStoreTool = (provider: MemoryProvider = "mem0"): Tool => {
  const config = getProviderConfig(provider);

  return tool({
    description: config.descriptions.store,
    inputSchema: config.schemas.storeSchema as unknown as Tool["inputSchema"],
    execute: config.provider.store as unknown as Tool["execute"],
  });
};

/**
 * Memory retrieve/recall tool factory
 * Creates a memory retrieval tool based on the provider
 */
export const createMemoryRetrieveTool = (provider: MemoryProvider = "mem0"): Tool => {
  const config = getProviderConfig(provider);

  return tool({
    description: config.descriptions.retrieve,
    inputSchema: config.schemas.retrieveSchema as unknown as Tool["inputSchema"],
    execute: config.provider.retrieve as unknown as Tool["execute"],
  });
};

/**
 * Memory delete tool factory
 * Creates a memory deletion tool based on the provider
 * Returns null if provider doesn't support delete
 */
export const createMemoryDeleteTool = (provider: MemoryProvider = "mem0"): Tool | null => {
  const config = getProviderConfig(provider);

  // Check if provider supports delete operation
  if (!config.schemas.deleteSchema || !config.descriptions.delete || !config.provider.delete) {
    return null;
  }

  return tool({
    description: config.descriptions.delete,
    inputSchema: config.schemas.deleteSchema as unknown as Tool["inputSchema"],
    execute: config.provider.delete as unknown as Tool["execute"],
  });
};

/**
 * Create all memory tools for a provider
 */
export const createMemoryTools = (provider: MemoryProvider = "mem0") => {
  const store = createMemoryStoreTool(provider);
  const retrieve = createMemoryRetrieveTool(provider);
  const deleteTool = createMemoryDeleteTool(provider);

  return {
    memoryStore: store,
    memoryRetrieve: retrieve,
    ...(deleteTool && { memoryDelete: deleteTool }),
  };
};

/**
 * Get list of available memory providers
 */
export const getAvailableMemoryProviders = (): MemoryProvider[] => {
  return Object.keys(providerRegistry) as MemoryProvider[];
};

export { agentcoreProvider, agentcoreSchemas } from "./agentcore.js";
// Export provider instances and schemas for advanced use
export { mem0Provider, mem0Schemas } from "./mem0.js";
export type { MemoryProvider } from "./types.js";
