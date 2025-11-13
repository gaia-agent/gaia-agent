/**
 * GAIA Agent Tools - Organized by category with swappable providers
 *
 * Structure:
 * - core: calculator, HTTP requests (file ops moved to sandbox)
 * - planning: planner (multi-step planning), verifier (answer validation)
 * - search: Tavily (AI search), Exa (neural search)
 * - sandbox: E2B (cloud sandboxes with file ops), Sandock (placeholder)
 * - browser: BrowserUse, AWS AgentCore
 * - memory: Mem0
 */

// Browser tools (swappable providers)
export * from "./browser/index.js";
// Core tools
export { calculator, httpRequest } from "./core.js";
// Memory tools
export * from "./memory/index.js";
// Planning and verification tools
export * from "./planning/index.js";
// Sandbox tools (swappable providers)
export * from "./sandbox/index.js";
// Search tools
export * from "./search/index.js";
