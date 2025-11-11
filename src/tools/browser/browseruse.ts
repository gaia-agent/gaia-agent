/**
 * BrowserUse Browser Automation Tool
 * Uses official browser-use-sdk: https://www.browseruse.com
 */

import { tool } from "ai";
import { z } from "zod";

/**
 * BrowserUse automation tool using official SDK
 * Install: npm install browser-use-sdk
 */
export const browserUseTool = tool({
	description:
		"Automate browser interactions using BrowserUse. Navigate, extract content, click elements, type text, and take screenshots.",
	parameters: z.object({
		action: z
			.enum(["navigate", "get_content", "click", "type", "screenshot"])
			.describe("Browser action to perform"),
		url: z.string().optional().describe("URL to navigate to (for navigate action)"),
		selector: z
			.string()
			.optional()
			.describe("CSS selector for element (for click, type actions)"),
		text: z.string().optional().describe("Text to type (for type action)"),
		browserUseApiKey: z.string().optional().describe("BrowserUse API key (if not in env)"),
	}),
	execute: async ({ action, url, selector, text, browserUseApiKey }) => {
		try {
			const apiKey = browserUseApiKey || process.env.BROWSERUSE_API_KEY;

			if (!apiKey) {
				return {
					success: false,
					error:
						"BrowserUse API key not configured. Set BROWSERUSE_API_KEY environment variable or pass browserUseApiKey parameter.",
				};
			}

			// Use official browser-use-sdk
			const { BrowserUse } = await import("browser-use-sdk");
			const browser = new BrowserUse({ apiKey });

			let result;

			switch (action) {
				case "navigate":
					if (!url) {
						return { success: false, error: "URL required for navigate action" };
					}
					result = await browser.navigate(url);
					break;

				case "get_content":
					result = await browser.getContent();
					break;

				case "click":
					if (!selector) {
						return { success: false, error: "Selector required for click action" };
					}
					result = await browser.click(selector);
					break;

				case "type":
					if (!selector || !text) {
						return {
							success: false,
							error: "Selector and text required for type action",
						};
					}
					result = await browser.type(selector, text);
					break;

				case "screenshot":
					result = await browser.screenshot();
					break;

				default:
					return { success: false, error: `Unknown action: ${action}` };
			}

			await browser.close();

			return {
				success: true,
				action,
				result,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Browser automation failed",
			};
		}
	},
});
