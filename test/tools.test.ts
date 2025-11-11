/**
 * Unit tests for core tools
 */

import { describe, expect, it } from "vitest";
import { calculator, httpRequest } from "../src/tools/core.js";
import { createGaiaAgent, getDefaultTools } from "../src/index.js";

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
    const agent = createGaiaAgent();
    expect(agent).toBeDefined();
    expect(agent.tools).toBeDefined();
  });
});
