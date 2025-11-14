/**
 * Unit tests for core tools
 */

import { describe, expect, it } from "vitest";
import { createGaiaAgent, getDefaultTools } from "../src/index.js";
import { calculator, httpRequest } from "../src/tools/core.js";

describe("calculator tool", () => {
  it("should be defined and have description", () => {
    expect(calculator).toBeDefined();
    expect(calculator.description).toContain("mathematical");
  });
});

describe("httpRequest tool", () => {
  it("should be defined and have description", () => {
    expect(httpRequest).toBeDefined();
    expect(httpRequest.description).toContain("HTTP");
  });
});

describe("getDefaultTools", () => {
  it("should return all default tools", () => {
    // Skip if no sandbox provider configured
    if (!process.env.E2B_API_KEY && !process.env.SANDOCK_API_KEY) {
      console.log("Skipping getDefaultTools test - no sandbox API key");
      return;
    }
    
    const tools = getDefaultTools();
    expect(tools).toBeDefined();
    expect(tools.calculator).toBeDefined();
    expect(tools.httpRequest).toBeDefined();
    // Search tools may not be available without API keys
    expect(Object.keys(tools).length).toBeGreaterThan(0);
  });
});

describe("createGaiaAgent", () => {
  it("should create an agent instance", () => {
    // Skip if no sandbox provider configured
    if (!process.env.E2B_API_KEY && !process.env.SANDOCK_API_KEY) {
      console.log("Skipping createGaiaAgent test - no sandbox API key");
      return;
    }
    
    const agent = createGaiaAgent();
    expect(agent).toBeDefined();
    expect(agent.tools).toBeDefined();
  });
});
