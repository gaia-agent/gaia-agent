/**
 * Memory management tools factory
 * Swappable providers: Mem0, AWS AgentCore Memory
 */

import { tool } from "ai";
import type { Tool } from "ai";
import type { MemoryProvider } from "./types.js";
import { agentcoreProvider, agentcoreSchemas } from "./agentcore.js";
import { mem0Provider, mem0Schemas } from "./mem0.js";

/**
 * Memory store/remember tool factory
 * Creates a memory storage tool based on the provider
 */
export const createMemoryStoreTool = (provider: MemoryProvider = "mem0"): Tool => {
  if (provider === "mem0") {
    return tool({
      description: "Store information in agent memory using Mem0 for future retrieval",
      inputSchema: mem0Schemas.storeSchema as unknown as Tool["inputSchema"],
      execute: mem0Provider.store as unknown as Tool["execute"],
    });
  }

  return tool({
    description:
      "Store information in agent memory using AWS Bedrock AgentCore for future retrieval",
    inputSchema: agentcoreSchemas.storeSchema as unknown as Tool["inputSchema"],
    execute: agentcoreProvider.store as unknown as Tool["execute"],
  });
};

/**
 * Memory retrieve/recall tool factory
 * Creates a memory retrieval tool based on the provider
 */
export const createMemoryRetrieveTool = (provider: MemoryProvider = "mem0"): Tool => {
  if (provider === "mem0") {
    return tool({
      description: "Retrieve information from agent memory using Mem0",
      inputSchema: mem0Schemas.retrieveSchema as unknown as Tool["inputSchema"],
      execute: mem0Provider.retrieve as unknown as Tool["execute"],
    });
  }

  return tool({
    description: "Retrieve information from agent memory using AWS Bedrock AgentCore",
    inputSchema: agentcoreSchemas.retrieveSchema as unknown as Tool["inputSchema"],
    execute: agentcoreProvider.retrieve as unknown as Tool["execute"],
  });
};

/**
 * Memory delete tool factory
 * Creates a memory deletion tool based on the provider
 */
export const createMemoryDeleteTool = (provider: MemoryProvider = "mem0"): Tool | null => {
  if (provider === "mem0") {
    // Mem0 doesn't support delete
    return null;
  }

  if (agentcoreSchemas.deleteSchema) {
    return tool({
      description: "Delete specific memories from AWS Bedrock AgentCore memory",
      inputSchema: agentcoreSchemas.deleteSchema as unknown as Tool["inputSchema"],
      execute: agentcoreProvider.delete as unknown as Tool["execute"],
    });
  }

  return null;
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

// Export provider instances and schemas for advanced use
export { mem0Provider, mem0Schemas } from "./mem0.js";
export { agentcoreProvider, agentcoreSchemas } from "./agentcore.js";
export type { MemoryProvider } from "./types.js";
