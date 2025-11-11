/**
 * GAIA Agent Tools - Organized by category with swappable providers
 * 
 * Structure:
 * - core: calculator, HTTP requests (file ops moved to sandbox)
 * - search: Tavily (AI search), Exa (neural search)
 * - sandbox: E2B (cloud sandboxes with file ops), Sandock (placeholder)
 * - browser: BrowserUse, AWS AgentCore
 * - memory: Mem0
 */

// Core tools
export { calculator, httpRequest } from "./core.js";

// Search tools
export * from "./search/index.js";

// Sandbox tools (swappable providers)
export * from "./sandbox/index.js";

// Browser tools (swappable providers)
export * from "./browser/index.js";

// Memory tools
export * from "./memory/index.js";
