/**
 * Browser automation tools
 * Swappable providers: BrowserUse, AWS AgentCore
 */

export { browserUseTool } from "./browseruse.js";
export {
	browserNavigate,
	browserGetContent,
	browserClick,
	browserType,
	browserScreenshot,
} from "./aws-agentcore.js";
