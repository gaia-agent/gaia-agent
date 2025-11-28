/**
 * AWS Bedrock AgentCore Memory Provider Implementation
 * See: https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/memory.html
 *
 * Uses AWS SDK commands:
 * - BatchCreateMemoryRecordsCommand - Create memory records
 * - RetrieveMemoryRecordsCommand - Search and retrieve memories
 * - DeleteMemoryRecordCommand - Delete a memory record
 */

import { z } from "zod";
import type {
  AgentCoreDeleteParams,
  AgentCoreRetrieveParams,
  AgentCoreStoreParams,
  IAgentCoreProvider,
  IMemorySchemas,
  MemoryResult,
} from "./types.js";

const DEFAULT_REGION = "us-west-2";

/**
 * AgentCore schemas - aligned with AWS SDK API
 */
export const agentcoreSchemas: IMemorySchemas = {
  storeSchema: z.object({
    memoryId: z.string().describe("The unique ID of the memory resource where records will be created"),
    content: z.string().describe("The text content to store in memory"),
    namespace: z.string().describe("Namespace identifier to categorize the memory record"),
    memoryStrategyId: z.string().optional().describe("Optional memory strategy ID for grouping"),
    awsRegion: z.string().optional().describe("AWS region (default: us-west-2)"),
    awsAccessKeyId: z.string().optional().describe("AWS access key ID (if not in env)"),
    awsSecretAccessKey: z.string().optional().describe("AWS secret access key (if not in env)"),
  }),

  retrieveSchema: z.object({
    memoryId: z.string().describe("The identifier of the AgentCore Memory resource"),
    namespace: z.string().describe("The namespace to filter memory records by"),
    query: z.string().describe("The search query to find relevant memory records"),
    topK: z.number().optional().describe("Maximum number of top-scoring results to return (default: 10)"),
    memoryStrategyId: z.string().optional().describe("Optional memory strategy ID to filter by"),
    maxResults: z.number().optional().describe("Maximum number of results per page (1-100, default: 20)"),
    awsRegion: z.string().optional().describe("AWS region (default: us-west-2)"),
    awsAccessKeyId: z.string().optional().describe("AWS access key ID (if not in env)"),
    awsSecretAccessKey: z.string().optional().describe("AWS secret access key (if not in env)"),
  }),

  deleteSchema: z.object({
    memoryId: z.string().describe("The identifier of the AgentCore Memory resource"),
    memoryRecordId: z.string().describe("The identifier of the memory record to delete"),
    awsRegion: z.string().optional().describe("AWS region (default: us-west-2)"),
    awsAccessKeyId: z.string().optional().describe("AWS access key ID (if not in env)"),
    awsSecretAccessKey: z.string().optional().describe("AWS secret access key (if not in env)"),
  }),
};

/**
 * Helper to get AWS credentials
 */
const getAWSCredentials = (params: {
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
}): { accessKeyId: string; secretAccessKey: string } | null => {
  const accessKeyId = params.awsAccessKeyId || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = params.awsSecretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    return null;
  }

  return { accessKeyId, secretAccessKey };
};

/**
 * AgentCore provider implementation using AWS SDK
 */
export const agentcoreProvider: IAgentCoreProvider = {
  async store(params: AgentCoreStoreParams): Promise<MemoryResult> {
    try {
      const { memoryId, content, namespace, memoryStrategyId, awsRegion = DEFAULT_REGION } = params;

      const credentials = getAWSCredentials(params);
      if (!credentials) {
        return {
          success: false,
          error:
            "AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.",
        };
      }

      // Dynamic import to avoid bundling issues
      const { BedrockAgentCoreClient, BatchCreateMemoryRecordsCommand } = await import(
        "@aws-sdk/client-bedrock-agentcore"
      );

      const client = new BedrockAgentCoreClient({
        region: awsRegion,
        credentials,
      });

      // Generate a unique request identifier
      const requestIdentifier = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const command = new BatchCreateMemoryRecordsCommand({
        memoryId,
        records: [
          {
            requestIdentifier,
            namespaces: [namespace],
            content: { text: content },
            timestamp: new Date(),
            ...(memoryStrategyId && { memoryStrategyId }),
          },
        ],
      });

      const response = await client.send(command);

      // Check for failures
      if (response.failedRecords && response.failedRecords.length > 0) {
        const failedRecord = response.failedRecords[0];
        return {
          success: false,
          error: failedRecord.errorMessage || "Failed to create memory record",
          errorCode: failedRecord.errorCode,
        };
      }

      // Get successful record info
      const successRecord = response.successfulRecords?.[0];

      return {
        success: true,
        message: `Memory record created successfully`,
        memoryRecordId: successRecord?.memoryRecordId,
        requestIdentifier,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Memory storage failed",
      };
    }
  },

  async retrieve(params: AgentCoreRetrieveParams): Promise<MemoryResult> {
    try {
      const {
        memoryId,
        namespace,
        query,
        topK = 10,
        memoryStrategyId,
        maxResults,
        awsRegion = DEFAULT_REGION,
      } = params;

      const credentials = getAWSCredentials(params);
      if (!credentials) {
        return {
          success: false,
          error:
            "AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.",
        };
      }

      const { BedrockAgentCoreClient, RetrieveMemoryRecordsCommand } = await import(
        "@aws-sdk/client-bedrock-agentcore"
      );

      const client = new BedrockAgentCoreClient({
        region: awsRegion,
        credentials,
      });

      const command = new RetrieveMemoryRecordsCommand({
        memoryId,
        namespace,
        searchCriteria: {
          searchQuery: query,
          topK,
          ...(memoryStrategyId && { memoryStrategyId }),
        },
        ...(maxResults && { maxResults }),
      });

      const response = await client.send(command);

      // Transform memory records to a simpler format
      const memories = (response.memoryRecordSummaries || []).map((record) => ({
        id: record.memoryRecordId,
        content: record.content?.text || "",
        namespaces: record.namespaces,
        memoryStrategyId: record.memoryStrategyId,
        createdAt: record.createdAt?.toISOString(),
        score: record.score,
      }));

      return {
        success: true,
        memories,
        count: memories.length,
        nextToken: response.nextToken,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Memory retrieval failed",
      };
    }
  },

  async delete(params: AgentCoreDeleteParams): Promise<MemoryResult> {
    try {
      const { memoryId, memoryRecordId, awsRegion = DEFAULT_REGION } = params;

      const credentials = getAWSCredentials(params);
      if (!credentials) {
        return {
          success: false,
          error:
            "AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.",
        };
      }

      const { BedrockAgentCoreClient, DeleteMemoryRecordCommand } = await import(
        "@aws-sdk/client-bedrock-agentcore"
      );

      const client = new BedrockAgentCoreClient({
        region: awsRegion,
        credentials,
      });

      const command = new DeleteMemoryRecordCommand({
        memoryId,
        memoryRecordId,
      });

      const response = await client.send(command);

      return {
        success: true,
        message: `Memory record deleted successfully`,
        memoryRecordId: response.memoryRecordId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Memory deletion failed",
      };
    }
  },
};
