/**
 * Browser automation tool types and interfaces
 */

import { z } from "zod";

export type BrowserProvider = "steel" | "browseruse" | "aws-bedrock-agentcore";

/**
 * Common result types
 */
export interface BrowserResult {
  success: boolean;
  error?: string;
  [key: string]: unknown;
}

/**
 * Steel specific types
 */
export interface SteelBrowserParams {
  task: string;
  url?: string;
  steelApiKey?: string;
  useProxy?: boolean;
  solveCaptcha?: boolean;
  timeout?: number;
}

/**
 * BrowserUse specific types
 */
export interface BrowserUseBrowserParams {
  task: string;
  browserUseApiKey?: string;
}

/**
 * Browser action schema - supports Playwright-like operations
 */
export const BrowserBaseActionSchema = z.discriminatedUnion("action", [
  // Session Management
  z
    .object({
      action: z.literal("launch"),
      headless: z.boolean().optional().default(true),
      viewport: z
        .object({
          width: z.number().int().positive().min(800).max(1920),
          height: z.number().int().positive().min(600).max(1080),
        })
        .optional()
        .describe("Viewport for new browser sessions. Default 1280x1080"),
    })
    .describe("Launch a new browser session with optional parameters."),

  z.object({ action: z.literal("closePage") }).describe("Close the current page."),
  z.object({ action: z.literal("exit") }).describe("Exit the browser to leave all pages and sessions."),

  // Navigation Actions
  z
    .object({
      action: z.literal("navigate"),
      url: z.string().describe("URL to navigate to (must be valid HTTP/HTTPS URL)"),
      waitUntil: z
        .enum(["load", "domcontentloaded", "networkidle"])
        .optional()
        .describe("Wait until specific event. Default: 'load'"),
      timeout: z
        .number()
        .positive()
        .max(60000)
        .optional()
        .describe("Navigation timeout in milliseconds (max 60s)"),
    })
    .describe("Navigate to a URL and wait for page load."),

  // Element Interaction
  z
    .object({
      action: z.literal("click"),
      selector: z.string().describe("CSS selector, XPath, or text selector to click"),
      button: z
        .enum(["left", "right", "middle"])
        .optional()
        .describe("Mouse button to click. Default: 'left'"),
      clickCount: z
        .number()
        .int()
        .positive()
        .max(3)
        .optional()
        .describe("Number of clicks (1-3). Default: 1"),
      timeout: z
        .number()
        .positive()
        .max(30000)
        .optional()
        .describe("Wait timeout in milliseconds (max 30s)"),
    })
    .describe("Click on an element matching the selector."),

  z
    .object({
      action: z.literal("fill").or(z.literal("type")),
      selector: z.string().describe("CSS selector for input field"),
      value: z.string().describe("Value to fill (replaces existing content)"),
    })
    .describe("Fill an input field (faster than type, no events)."),

  // Content Extraction
  z
    .object({
      action: z.literal("screenshot"),
      fullPage: z.boolean().optional().describe("Capture full scrollable page. Default: false"),
      selector: z.string().optional().describe("CSS selector to screenshot specific element"),
    })
    .describe("Take a screenshot of the page or specific element."),

  z
    .object({
      action: z.literal("extract"),
      selector: z
        .string()
        .optional()
        .describe(
          "CSS selector to extract from. " +
            "IMPORTANT: Leave empty on first visit to get full page structure. " +
            "Only use specific selector after analyzing page content. " +
            "If selector not found, will fallback to full page content.",
        ),
      attribute: z.string().optional().describe("Extract specific attribute (e.g., 'href', 'src')"),
      timeout: z
        .number()
        .positive()
        .max(30000)
        .optional()
        .describe("Wait timeout in milliseconds (max 30s). Default: 30000"),
    })
    .describe(
      "Extract text content or attributes. " +
        "Best practice: First extract without selector to see page structure, " +
        "then use specific selectors based on actual content.",
    ),

  // Page Information
  z
    .object({
      action: z.literal("info"),
      infos: z
        .enum(["url", "title", "content", "cookies", "localStorage", "all"])
        .array()
        .optional()
        .describe("Specific info to retrieve. Default: url, title and content."),
    })
    .describe("Get page information (URL, title, cookies, etc.)."),

  // Scroll Operations
  z
    .object({
      action: z.literal("scroll"),
      x: z.number().optional().describe("Horizontal scroll position in pixels"),
      y: z.number().optional().describe("Vertical scroll position in pixels"),
      selector: z.string().optional().describe("Scroll specific element instead of page"),
    })
    .describe("Scroll the page or element to specified position."),

  // Wait Operations
  z
    .object({
      action: z.literal("waitForNavigation"),
      sessionId: z.string().describe("Session ID"),
      waitUntil: z
        .enum(["load", "domcontentloaded", "networkidle"])
        .optional()
        .describe("Wait until event. Default: 'load'"),
      timeout: z
        .number()
        .positive()
        .max(60000)
        .optional()
        .describe("Timeout in milliseconds (max 60s)"),
    })
    .describe("Wait for navigation to complete."),

  z
    .object({
      action: z.literal("sleep").or(z.literal("wait")),
      ms: z
        .number()
        .int()
        .positive()
        .max(60000)
        .describe("Sleep duration in milliseconds (max 60s)"),
    })
    .describe(
      "Wait for specified duration (use sparingly, prefer waitForSelector). Alias: wait. sleep.",
    ),
]);

/**
 * Browser operation schema - includes base actions and composite actions
 */
export const BrowserActionSchema = z.union([
  BrowserBaseActionSchema,
  // Composite action: sequence of operations
  z.object({
    action: z.literal("sequence"),
    steps: z.array(BrowserBaseActionSchema).describe("Sequence of browser actions to perform"),
    continueOnError: z
      .boolean()
      .optional()
      .default(false)
      .describe("For sequence: whether to continue when a step fails"),
    wantContent: z
      .boolean()
      .optional()
      .default(false)
      .describe("For sequence: whether to return extract page content at the end"),
    wantScreenshot: z
      .boolean()
      .optional()
      .default(false)
      .describe("For sequence: whether to return captured screenshot at the end"),
  }),
  // Composite action: open (launch+navigate+info/extract/screenshot)
  z
    .object({
      action: z.literal("open"),
      url: z.string().describe("URL to navigate to (must be valid HTTP/HTTPS URL)"),
      headless: z.boolean().optional().default(true),
      viewport: z
        .object({
          width: z.number().int().positive().min(800).max(1920),
          height: z.number().int().positive().min(600).max(1080),
        })
        .optional()
        .describe("Viewport for new browser sessions. Default 1280x1080"),
      wantInfo: z.boolean().optional().default(true).describe("Include page title/url"),
      wantContent: z.boolean().optional().default(false).describe("Extract page content"),
      wantScreenshot: z.boolean().optional().default(false).describe("Capture screenshot (base64)"),
    })
    .describe("Open a browser session, navigate to URL, and perform info/extract/screenshot."),
]);
export type BrowserAction = z.infer<typeof BrowserActionSchema>;

/**
 * AWS AgentCore specific types
 */
export const AWSBrowserParamsSchema = z.object({
  // Optional session ID to reuse existing session
  sessionId: z
    .string()
    .optional()
    .describe("Browser session ID (optional for first call; required for subsequent operations)"),

  // Provider configuration
  browserIdentifier: z.string().optional().describe("Browser identifier"),
  awsRegion: z.string().optional().describe("AWS region"),
  awsAccessKeyId: z.string().optional().describe("AWS access key ID"),
  awsSecretAccessKey: z.string().optional().describe("AWS secret access key"),

  // launch options
  sessionName: z
    .string()
    .optional()
    .describe(
      "The name of the browser session. This name helps you identify and manage the session. The name does not need to be unique.",
    ),
  sessionTimeoutSeconds: z
    .number()
    .optional()
    .describe(
      "The time in seconds after which the session automatically terminates if there is no activity. The default value is 3600 seconds (1 hour). The minimum allowed value is 60 seconds, and the maximum allowed value is 28800 seconds (8 hours).",
    ),
  viewPort: z
    .object({
      width: z
        .number()
        .describe(
          "The width of the viewport in pixels. This value determines the horizontal dimension of the visible area. Valid values range from 800 to 1920 pixels.",
        ),
      height: z
        .number()
        .describe(
          "The height of the viewport in pixels. This value determines the vertical dimension of the visible area. Valid values range from 600 to 1080 pixels.",
        ),
    })
    .optional()
    .describe(
      "The dimensions of the browser viewport for this session. This determines the visible area of the web content and affects how web pages are rendered. If not specified, Amazon Bedrock uses a default viewport size.",
    ),

  // Browser operation - supports single action, sequence, or open
  operation: BrowserActionSchema.describe(
      "Browser operation to perform. Supports single actions (navigate, click, etc.), " +
      "composite 'open' (auto-creates session + navigates + extracts), or " +
      "'sequence' for multi-step operations in one call.",
    ),
});
export type AWSBrowserParams = z.infer<typeof AWSBrowserParamsSchema>;

/**
 * Provider-specific interfaces
 */
export interface ISteelProvider {
  execute: (params: SteelBrowserParams) => Promise<BrowserResult>;
}

export interface IBrowserUseProvider {
  execute: (params: BrowserUseBrowserParams) => Promise<BrowserResult>;
}

export interface IAWSAgentCoreProvider {
  execute: (params: AWSBrowserParams) => Promise<BrowserResult>;
}

/**
 * Generic browser provider interface (for factory use)
 */
export interface IBrowserProvider {
  execute: (params: unknown) => Promise<BrowserResult>;
}

/**
 * Schema definitions for each provider
 */
export interface IBrowserSchemas {
  // biome-ignore lint/suspicious/noExplicitAny: Zod schema types are complex
  executeSchema: z.ZodObject<any>;
}
