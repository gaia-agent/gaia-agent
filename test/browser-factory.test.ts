/**
 * Browser tools factory pattern tests
 */

import { describe, expect, it } from "vitest";
import {
  awsAgentCoreProvider,
  awsAgentCoreSchemas,
  browseruseProvider,
  browseruseSchemas,
  createBrowserTool,
  createBrowserTools,
  steelProvider,
  steelSchemas,
} from "../src/tools/browser/index.js";

describe("Browser Tools Factory Pattern", () => {
  describe("createBrowserTool", () => {
    it("should create Steel browser tool", () => {
      const tool = createBrowserTool("steel");
      expect(tool).toBeDefined();
      expect(tool.description).toContain("Steel");
      expect(tool.inputSchema).toBeDefined();
    });

    it("should create BrowserUse tool", () => {
      const tool = createBrowserTool("browseruse");
      expect(tool).toBeDefined();
      expect(tool.description).toContain("BrowserUse");
      expect(tool.inputSchema).toBeDefined();
    });

    it("should create AWS AgentCore tool", () => {
      const tool = createBrowserTool("aws-bedrock-agentcore");
      expect(tool).toBeDefined();
      expect(tool.description).toContain("AWS");
      expect(tool.inputSchema).toBeDefined();
    });

    it("should default to Steel when no provider specified", () => {
      const tool = createBrowserTool();
      expect(tool.description).toContain("Steel");
    });
  });

  describe("createBrowserTools", () => {
    it("should create Steel browser tools collection", () => {
      const tools = createBrowserTools("steel");
      expect(tools).toBeDefined();
      expect(tools.browser).toBeDefined();
      expect(Object.keys(tools)).toEqual(["browser"]);
    });

    it("should create BrowserUse tools collection", () => {
      const tools = createBrowserTools("browseruse");
      expect(tools).toBeDefined();
      expect(tools.browser).toBeDefined();
    });

    it("should create AWS tools collection", () => {
      const tools = createBrowserTools("aws-bedrock-agentcore");
      expect(tools).toBeDefined();
      expect(tools.browser).toBeDefined();
    });
  });

  describe("Provider exports", () => {
    it("should export Steel provider and schemas", () => {
      expect(steelProvider).toBeDefined();
      expect(typeof steelProvider.execute).toBe("function");
      expect(steelSchemas).toBeDefined();
      expect(steelSchemas.executeSchema).toBeDefined();
    });

    it("should export BrowserUse provider and schemas", () => {
      expect(browseruseProvider).toBeDefined();
      expect(typeof browseruseProvider.execute).toBe("function");
      expect(browseruseSchemas).toBeDefined();
      expect(browseruseSchemas.executeSchema).toBeDefined();
    });

    it("should export AWS AgentCore provider and schemas", () => {
      expect(awsAgentCoreProvider).toBeDefined();
      expect(typeof awsAgentCoreProvider.execute).toBe("function");
      expect(awsAgentCoreSchemas).toBeDefined();
      expect(awsAgentCoreSchemas.executeSchema).toBeDefined();
    });
  });

  describe("Provider implementations", () => {
    it("should return error for AWS provider (WebSocket limitation)", async () => {
      const result = await awsAgentCoreProvider.execute({
        task: "Test task",
        actions: {
          action: "navigate",
          url: "https://example.com",
        },
      });

      expect(result.success).toBe(false);
      // expect(result.error).toContain("WebSocket");
    });
  });
});
