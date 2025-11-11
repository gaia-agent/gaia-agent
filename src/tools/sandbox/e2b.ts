/**
 * E2B Code Interpreter Sandbox Tool
 * Uses official e2b SDK: https://e2b.dev
 */

import { tool } from "ai";
import { z } from "zod";

/**
 * E2B Sandbox tool using official SDK
 * Install: npm install e2b
 * 
 * E2B provides secure, isolated cloud environments for code execution
 * Supports Python, JavaScript, Bash, and more
 */
export const e2bSandbox = tool({
	description:
		"Execute code in a secure E2B cloud sandbox. Supports Python, JavaScript, Bash. Great for data analysis, web scraping, and automation tasks.",
	parameters: z.object({
		language: z
			.enum(["python", "javascript", "bash"])
			.describe("Programming language to execute"),
		code: z.string().describe("Code to execute in the sandbox"),
		e2bApiKey: z.string().optional().describe("E2B API key (if not in env)"),
	}),
	execute: async ({ language, code, e2bApiKey }) => {
		try {
			const apiKey = e2bApiKey || process.env.E2B_API_KEY;

			if (!apiKey) {
				return {
					success: false,
					error:
						"E2B API key not configured. Set E2B_API_KEY environment variable or pass e2bApiKey parameter. Get key at: https://e2b.dev",
				};
			}

			// Use official e2b SDK
			const { Sandbox } = await import("e2b");

			const sandbox = await Sandbox.create({
				apiKey,
				template: language === "python" ? "base" : "base",
			});

			try {
				let result;
				if (language === "python") {
					const execution = await sandbox.runCode(code, { language: "python" });
					result = {
						stdout: execution.logs.stdout.join("\n"),
						stderr: execution.logs.stderr.join("\n"),
						error: execution.error,
					};
				} else if (language === "javascript") {
					const execution = await sandbox.runCode(code, { language: "js" });
					result = {
						stdout: execution.logs.stdout.join("\n"),
						stderr: execution.logs.stderr.join("\n"),
						error: execution.error,
					};
				} else {
					// bash
					const process = await sandbox.process.start({
						cmd: "bash",
						args: ["-c", code],
					});
					await process.wait();
					result = {
						stdout: process.output.stdout,
						stderr: process.output.stderr,
						exitCode: process.output.exitCode,
					};
				}

				return {
					success: true,
					language,
					output: result,
				};
			} finally {
				await sandbox.close();
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "E2B execution failed",
			};
		}
	},
});
