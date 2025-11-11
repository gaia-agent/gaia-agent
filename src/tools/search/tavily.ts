/**
 * Tavily AI Search Tool
 * Uses official @tavily/core SDK: https://www.tavily.com
 */

import { tool } from "ai";
import { z } from "zod";

/**
 * Tavily search tool using official SDK
 * Install: npm install @tavily/core
 */
export const tavilySearch = tool({
	description:
		"Search the web using Tavily AI search engine. Returns AI-optimized, factual search results with sources. Best for research and fact-checking.",
	parameters: z.object({
		query: z.string().describe("Search query"),
		searchDepth: z
			.enum(["basic", "advanced"])
			.optional()
			.describe("Search depth (basic or advanced)"),
		maxResults: z.number().optional().describe("Maximum number of results (default: 5)"),
		includeDomains: z.array(z.string()).optional().describe("Domains to include in search"),
		excludeDomains: z.array(z.string()).optional().describe("Domains to exclude from search"),
		tavilyApiKey: z.string().optional().describe("Tavily API key (if not in env)"),
	}),
	execute: async ({
		query,
		searchDepth = "basic",
		maxResults = 5,
		includeDomains,
		excludeDomains,
		tavilyApiKey,
	}) => {
		try {
			const apiKey = tavilyApiKey || process.env.TAVILY_API_KEY;

			if (!apiKey) {
				return {
					success: false,
					error:
						"Tavily API key not configured. Set TAVILY_API_KEY environment variable or pass tavilyApiKey parameter.",
				};
			}

			// Use official @tavily/core SDK
			const { TavilySearchClient } = await import("@tavily/core");
			const tavily = new TavilySearchClient({ apiKey });

			const response = await tavily.search(query, {
				searchDepth: searchDepth === "advanced" ? "advanced" : "basic",
				maxResults,
				includeDomains,
				excludeDomains,
			});

			return {
				success: true,
				answer: response.answer,
				results: response.results.map((r) => ({
					title: r.title,
					url: r.url,
					content: r.content,
					score: r.score,
				})),
				query,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Tavily search failed",
			};
		}
	},
});
