/**
 * Integration tests for GAIA Agent tools
 * Tests actual tool execution to catch runtime issues
 */

import { describe, expect, it } from "vitest";
import { createSearchTools } from "../src/tools/search/index.js";
import { createMemoryTools } from "../src/tools/memory/index.js";

describe("Search Tools Integration", () => {
  it("should create OpenAI search tool with correct name", () => {
    const tools = createSearchTools("openai");
    
    // OpenAI native tool should be registered as "web_search"
    expect(tools).toHaveProperty("web_search");
    expect(tools.web_search).toBeDefined();
  });

  it("should create Tavily search tool with correct name", () => {
    const tools = createSearchTools("tavily");
    
    // Tavily tool should be registered as "search"
    expect(tools).toHaveProperty("search");
    expect(tools.search).toBeDefined();
  });

  it("should create Exa search tools with correct names", () => {
    const tools = createSearchTools("exa");
    
    // Exa should have search, searchGetContents, searchFindSimilar
    expect(tools).toHaveProperty("search");
    expect(tools).toHaveProperty("searchGetContents");
    expect(tools).toHaveProperty("searchFindSimilar");
  });
});

describe("Memory Tools Integration", () => {
  it("should create Mem0 memory tools with correct schema", () => {
    // Skip if no API key (memory is optional)
    if (!process.env.MEM0_API_KEY) {
      return;
    }

    const tools = createMemoryTools("mem0");
    
    expect(tools).toHaveProperty("memoryStore");
    expect(tools).toHaveProperty("memoryRetrieve");
    
    // Check that tools have proper schemas
    // biome-ignore lint/suspicious/noExplicitAny: Tool type has complex generic structure
    const storeToolAny = tools.memoryStore as any;
    expect(storeToolAny.description).toBeDefined();
    expect(storeToolAny.execute).toBeDefined();
  });

  it("should handle Mem0 API requests correctly", async () => {
    // Skip if no API key
    if (!process.env.MEM0_API_KEY) {
      console.log("Skipping Mem0 test - no API key");
      return;
    }

    const tools = createMemoryTools("mem0");
    // biome-ignore lint/suspicious/noExplicitAny: Tool type has complex generic structure
    const storeTool = tools.memoryStore as any;

    // Test with valid parameters
    const testKey = `test-${Date.now()}`;
    const testValue = "This is a test memory";

    try {
      const result = await storeTool.execute({
        key: testKey,
        value: testValue,
      });

      // Should return success or error (not throw)
      expect(result).toBeDefined();
      expect(result).toHaveProperty("success");
      
      if (!result.success) {
        // If it fails, should have error message
        expect(result).toHaveProperty("error");
        console.log("Mem0 API error:", result.error);
      }
    } catch (error) {
      // Test should not throw unhandled errors
      console.error("Mem0 test threw error:", error);
      throw error;
    }
  });
});

describe("Tool Naming Consistency", () => {
  it("should have consistent tool naming across providers", () => {
    const openaiTools = createSearchTools("openai");
    const tavilyTools = createSearchTools("tavily");
    const exaTools = createSearchTools("exa");

    // OpenAI uses "web_search" (native tool name)
    expect(Object.keys(openaiTools)).toContain("web_search");
    
    // Tavily and Exa use "search"
    expect(Object.keys(tavilyTools)).toContain("search");
    expect(Object.keys(exaTools)).toContain("search");
    
    // Exa has additional tools
    expect(Object.keys(exaTools)).toContain("searchGetContents");
    expect(Object.keys(exaTools)).toContain("searchFindSimilar");
  });
});
