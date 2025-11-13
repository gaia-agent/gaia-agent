/**
 * AWS Bedrock AgentCore Browser Provider
 *
 * Note: AWS Bedrock AgentCore Browser requires WebSocket-based control.
 * Available AWS SDK commands:
 * - StartBrowserSessionCommand - Create browser session (returns WebSocket URLs)
 * - UpdateBrowserStreamCommand - Enable/disable stream (not for sending actions)
 * - StopBrowserSessionCommand - Stop browser session
 *
 * Browser actions must be sent via WebSocket with SigV4 authentication.
 * JavaScript SDK lacks the browser_session helper available in Python SDK.
 *
 * For immediate browser automation, use Steel or BrowserUse provider instead.
 */

import {
  type AWSBrowserParams,
  AWSBrowserParamsSchema,
  type BrowserAction,
  type BrowserResult,
  type IAWSAgentCoreProvider,
} from "./types.js";

const DEFAULT_IDENTIFIER = "aws.browser.v1";

/**
 * AWS AgentCore browser provider implementation
 * Currently returns error due to WebSocket limitations
 */
export const awsAgentCoreProvider: IAWSAgentCoreProvider = {
  execute: async (params: AWSBrowserParams): Promise<BrowserResult> => {
    const {
      task,
      browserIdentifier,
      awsRegion,
      awsAccessKeyId,
      awsSecretAccessKey,
      sessionName,
      sessionTimeoutSeconds,
      viewPort,
      actions,
    } = params;
    const { BedrockAgentCoreClient, StartBrowserSessionCommand, StopBrowserSessionCommand } =
      await import("@aws-sdk/client-bedrock-agentcore");
    const { chromium } = await import("playwright");

    const accessKeyId = awsAccessKeyId || process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = awsSecretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;
    if (!accessKeyId || !secretAccessKey) {
      return {
        success: false,
        error:
          "AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables or pass awsAccessKeyId and awsSecretAccessKey parameters.",
      };
    }
    const identifier = browserIdentifier || DEFAULT_IDENTIFIER;
    const region = awsRegion || "us-west-2";

    // Initialize AWS Bedrock AgentCore client
    const client = new BedrockAgentCoreClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    let sessionId: string;

    // Create browser session
    try {
      const startBrowserSessionCommand = new StartBrowserSessionCommand({
        browserIdentifier: identifier,
        name: sessionName,
        sessionTimeoutSeconds,
        viewPort,
      });
      const resp = await client.send(startBrowserSessionCommand);
      if (!resp.sessionId) {
        throw new Error("No sessionId returned from StartBrowserSessionCommand");
      }
      sessionId = resp.sessionId;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to create AWS Bedrock AgentCore Browser session: ${msg}`,
        details: error instanceof Error ? error.stack : undefined,
      };
    }

    const generateWsConnection = async (): Promise<{
      wsUrl: string;
      headers: Record<string, string>;
    }> => {
      const planeEndpoint =
        process.env.BEDROCK_AGENTCORE_DP_ENDPOINT ||
        `https://bedrock-agentcore.${region}.amazonaws.com`;
      const path = `/browser-streams/${identifier}/sessions/${sessionId}/automation`;

      const endpointUrl = new URL(planeEndpoint);
      const host = endpointUrl.host;

      const { Sha256 } = await import("@aws-crypto/sha256-js");
      const { SignatureV4 } = await import("@aws-sdk/signature-v4");
      const { formatUrl } = await import("@aws-sdk/util-format-url");
      const { HttpRequest } = await import("@smithy/protocol-http");

      // Generate a presigned URL for the WebSocket connection
      const httpReq = new HttpRequest({
        protocol: endpointUrl.protocol || "https:",
        hostname: host,
        method: "GET",
        path,
        headers: {
          host,
        },
      });

      // Use SigV4 presigning, placed in query parameters
      const credentials =
        typeof client.config.credentials === "function"
          ? await client.config.credentials()
          : client.config.credentials;
      const presigner = new SignatureV4({
        credentials,
        region,
        service: "bedrock-agentcore",
        sha256: Sha256,
      });

      // AWS requires expiration between 1 and 300 seconds for WebSocket URLs
      const presigned = await presigner.presign(httpReq, {
        expiresIn: 300, // Maximum allowed: 5 minutes
      });
      const httpsUrl = formatUrl(presigned);
      const wsUrl = httpsUrl.replace(/^https:/, "wss:");

      // Only keep necessary headers; auth info is in query params
      const headers: Record<string, string> = {
        Host: host,
        "User-Agent": `BrowserSandbox-Client/1.0 (Session: ${path.split("/").pop()})`,
      };

      return { wsUrl, headers };
    };

    try {
      // Connect to browser session via Playwright CDP
      const { wsUrl, headers } = await generateWsConnection();
      const browser = await chromium.connectOverCDP(wsUrl, { headers });
      const context = browser.contexts()[0] ?? (await browser.newContext());
      const page = context.pages()[0] ?? (await context.newPage());

      const executeAction = async (
        action: BrowserAction,
      ): Promise<{ [key: string]: unknown } | undefined> => {
        // Execute action based on type
        switch (action.action) {
          case "navigate": {
            await page.goto(action.url, {
              waitUntil: action.waitUntil || "load",
              timeout: action.timeout || 30000,
            });
            break;
          }

          case "click": {
            await page.click(action.selector, {
              button: action.button || "left",
              clickCount: action.clickCount || 1,
              timeout: action.timeout || 30000,
            });
            break;
          }

          case "fill": {
            await page.fill(action.selector, action.value);
            break;
          }

          case "screenshot": {
            const screenshotOptions: {
              fullPage: boolean;
              type: "png";
              clip?: { x: number; y: number; width: number; height: number };
            } = {
              fullPage: action.fullPage || false,
              type: "png",
            };

            if (action.selector) {
              const boundingBox = await page.locator(action.selector).boundingBox();
              if (boundingBox) {
                screenshotOptions.clip = boundingBox;
              }
            }

            const screenshot = await page.screenshot(screenshotOptions);
            return {
              screenshot: screenshot.toString("base64"),
            };
          }

          case "extract": {
            if (action.selector) {
              try {
                const locator = page.locator(action.selector);
                const timeout = action.timeout || 30000;

                // Wait for element to be present (with timeout)
                await locator.waitFor({ state: "attached", timeout });

                const content = action.attribute
                  ? await locator.getAttribute(action.attribute)
                  : await locator.textContent();
                return { content };
              } catch (_error) {
                // Element not found or other error, skip extraction
              }
            }
            const content = await page.content();
            return { content };
          }

          case "waitForNavigation": {
            await page.waitForLoadState(action.waitUntil || "load", {
              timeout: action.timeout || 60000,
            });
            break;
          }

          case "wait":
          case "sleep": {
            await page.waitForTimeout(action.ms);
            break;
          }

          case "info": {
            const info: Record<string, unknown> = {};
            const infoTypes = action.infos || ["url", "title", "content"];

            if (infoTypes.includes("all") || infoTypes.includes("url")) {
              info.url = page.url();
            }
            if (infoTypes.includes("all") || infoTypes.includes("title")) {
              info.title = await page.title();
            }
            if (infoTypes.includes("all") || infoTypes.includes("content")) {
              info.content = await page.content();
            }
            if (infoTypes.includes("all") || infoTypes.includes("cookies")) {
              info.cookies = await context.cookies();
            }
            if (infoTypes.includes("all") || infoTypes.includes("localStorage")) {
              info.localStorage = await page.evaluate(() => ({ ...localStorage }));
            }

            return info;
          }

          case "scroll": {
            if (action.selector) {
              await page.locator(action.selector).scrollIntoViewIfNeeded();
            } else {
              await page.evaluate(
                ({ x, y }: { x?: number; y?: number }) => {
                  // biome-ignore lint/suspicious/noExplicitAny: Browser window object
                  (globalThis as any).window.scrollTo(x || 0, y || 0);
                },
                { x: action.x, y: action.y },
              );
            }
            break;
          }

          default:
            throw new Error(`Unknown action: ${(action as { action: string }).action}`);
        }
        return undefined;
      };

      try {
        // Normalize to array for batch processing
        const actionList = Array.isArray(actions) ? actions : [actions];
        let results: Record<string, unknown> = {};

        // Execute actions sequentially
        for (const action of actionList) {
          const result = await executeAction(action);
          if (result !== undefined) {
            results = { ...results, ...result };
          }
        }

        return {
          success: true,
          task,
          sessionId,
          url: page.url(),
          title: await page.title(),
          content: await page.content(),
          ...results,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          details: error instanceof Error ? error.stack : undefined,
        };
      } finally {
        // Clean up Playwright resources
        await page.close({ runBeforeUnload: true }).catch(() => { });
        await context.close().catch(() => { });
        await browser.close().catch(() => { });
        // Stop browser session
        const stopCmd = new StopBrowserSessionCommand({
          browserIdentifier: identifier,
          sessionId,
        });
        await client.send(stopCmd);
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Aws bedrock agentcore browser automation failed",
        details: error instanceof Error ? error.stack : undefined,
      };
    }
  },
};

/**
 * AWS AgentCore browser schemas
 */
export const awsAgentCoreSchemas = {
  executeSchema: AWSBrowserParamsSchema,
};
