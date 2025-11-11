/**
 * Unit tests for benchmark utilities
 */

import { describe, expect, it } from "vitest";
import { normalizeAnswer } from "../benchmark/evaluator.js";

describe("normalizeAnswer", () => {
  it("should lowercase the answer", () => {
    expect(normalizeAnswer("HELLO WORLD")).toBe("hello world");
  });

  it("should trim whitespace", () => {
    expect(normalizeAnswer("  hello world  ")).toBe("hello world");
  });

  it("should collapse multiple spaces", () => {
    expect(normalizeAnswer("hello    world")).toBe("hello world");
  });

  it("should remove punctuation", () => {
    expect(normalizeAnswer("Hello, World!")).toBe("hello world");
  });

  it("should handle mixed cases", () => {
    expect(normalizeAnswer("  HeLLo,   WoRLd!  ")).toBe("hello world");
  });

  it("should handle empty strings", () => {
    expect(normalizeAnswer("")).toBe("");
  });

  it("should handle numbers", () => {
    expect(normalizeAnswer("Answer: 42")).toBe("answer 42");
  });
});
