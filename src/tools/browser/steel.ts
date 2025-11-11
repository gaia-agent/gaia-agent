/**
 * Steel Browser Automation Provider
 * Uses steel-sdk with Playwright CDP connection
 * Documentation: https://docs.steel.dev/
 */

import { z } from "zod";
import type { BrowserResult, ISteelProvider, SteelBrowserParams } from "./types.js";

/**
 * Steel browser automation provider implementation
 */
export const steelProvider: ISteelProvider = {
  execute: async ({
    task,
    url,
    steelApiKey,
    useProxy,
    solveCaptcha,
    timeout,
  }: SteelBrowserParams): Promise<BrowserResult> => {
    try {
      const apiKey = steelApiKey || process.env.STEEL_API_KEY;

      if (!apiKey) {
        return {
          success: false,
          error:
            "Steel API key not configured. Set STEEL_API_KEY environment variable or pass steelApiKey parameter.",
        };
      }

      // Import Steel SDK and Playwright
      const Steel = (await import("steel-sdk")).default;
      const { chromium } = await import("playwright");

      const client = new Steel({
        steelAPIKey: apiKey,
        // baseURL: "http://localhost:3000"
      });

      // Create session with options
      const sessionOptions: Record<string, unknown> = {
        timeout: timeout || 300000, // 5 minutes default
      };

      if (useProxy !== undefined) sessionOptions.useProxy = useProxy;
      if (solveCaptcha !== undefined) sessionOptions.solveCaptcha = solveCaptcha;

      const session = await client.sessions.create(sessionOptions);

      try {
        // Connect to Steel browser via Playwright CDP
        const browser = await chromium.connectOverCDP(
          `wss://connect.steel.dev?apiKey=${apiKey}&sessionId=${session.id}`,
        );

        const contexts = browser.contexts();
        const context = contexts[0] || (await browser.newContext());
        const page = await context.newPage();

        // Navigate to URL if provided
        if (url) {
          await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
        }

        // Extract page content
        const pageTitle = await page.title();
        const pageUrl = page.url();

        // Try to extract text content
        const textContent = await page.evaluate(() => {
          // biome-ignore lint/suspicious/noExplicitAny: document is available in browser context
          const body = (globalThis as any).document.body;
          return body ? body.innerText.slice(0, 5000) : ""; // Limit to 5000 chars
        });

        const result = `Page: ${pageTitle}\nURL: ${pageUrl}\n\nContent:\n${textContent}`;

        await browser.close();

        return {
          success: true,
          task,
          url: pageUrl,
          sessionId: session.id,
          sessionViewerUrl: session.sessionViewerUrl,
          output: result,
        };
      } finally {
        // Always release session
        try {
          await client.sessions.release(session.id);
        } catch (releaseError) {
          console.error("Failed to release Steel session:", releaseError);
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Steel browser automation failed",
        details: error instanceof Error ? error.stack : undefined,
      };
    }
  },
};

/**
 * Steel browser automation schemas
 */
export const steelSchemas = {
  executeSchema: z.object({
    task: z
      .string()
      .describe(
        "Natural language description of the browser task to perform (e.g., 'Extract the main heading', 'Click the login button', 'Search for AI news')",
      ),
    url: z.string().optional().describe("Starting URL to navigate to"),
    steelApiKey: z.string().optional().describe("Steel API key (if not in env)"),
    useProxy: z.boolean().optional().describe("Use Steel's residential proxy network"),
    solveCaptcha: z.boolean().optional().describe("Enable automatic CAPTCHA solving"),
    timeout: z
      .number()
      .optional()
      .describe("Session timeout in milliseconds (default: 300000 - 5 minutes)"),
  }),
};
