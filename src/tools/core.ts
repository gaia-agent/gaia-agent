/**
 * Core tools - calculator, HTTP requests
 *
 * Note: File operations (readFile, writeFile) are available in sandbox tools (E2B)
 * to avoid duplication and ensure they run in the proper execution environment.
 */

import { tool } from "ai";
import { z } from "zod";

/**
 * Calculator tool for mathematical calculations
 */
export const calculator = tool({
  description:
    "Perform mathematical calculations. Supports basic arithmetic and complex expressions using JavaScript Math functions.",
  inputSchema: z.object({
    expression: z
      .string()
      .describe(
        "Mathematical expression to evaluate (e.g., '2 + 2', 'Math.sqrt(16)', 'Math.pow(2, 10)')",
      ),
  }),
  execute: async ({ expression }) => {
    try {
      const result = Function(`"use strict"; return (${expression})`)();
      return { result: String(result), success: true };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Invalid expression",
        success: false,
      };
    }
  },
});

/**
 * HTTP request tool
 */
export const httpRequest = tool({
  description: "Make HTTP requests to external APIs",
  inputSchema: z.object({
    url: z.string().describe("URL to make the request to"),
    method: z.enum(["GET", "POST", "PUT", "DELETE"]).default("GET").describe("HTTP method"),
    headers: z.record(z.string(), z.string()).optional().describe("Request headers"),
    body: z.string().optional().describe("Request body (JSON string for POST/PUT)"),
  }),
  execute: async ({ url, method = "GET", headers = {}, body }) => {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: body ? body : undefined,
      });

      const text = await response.text();
      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      return {
        status: response.status,
        statusText: response.statusText,
        data,
        success: true,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "HTTP request failed",
        success: false,
      };
    }
  },
});
