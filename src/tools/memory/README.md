# Memory Tools

The gaia-agent supports multiple memory providers for persistent agent memory:

## Providers

### 1. Mem0
Community-driven memory management service.

**Usage:**
```typescript
import { createGaiaAgent } from '@gaia-agent/sdk';

const agent = createGaiaAgent({
  providers: {
    memory: 'mem0'
  }
});
```

**Environment Variables:**
- `MEM0_API_KEY` - Your Mem0 API key

**Available Tools:**
- `memoryStore` - Store information in memory
- `memoryRetrieve` - Retrieve information from memory

### 2. AWS AgentCore Memory
Enterprise-grade memory management using AWS Bedrock AgentCore.

**Usage:**
```typescript
import { createGaiaAgent } from '@gaia-agent/sdk';

const agent = createGaiaAgent({
  providers: {
    memory: 'agentcore'
  }
});
```

**Environment Variables:**
- `AWS_ACCESS_KEY_ID` - Your AWS access key
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret key
- `AWS_REGION` - AWS region (default: us-west-2)

**Available Tools:**
- `memoryStore` - Store information in session-based memory
- `memoryRetrieve` - Retrieve memories using semantic search
- `memoryDelete` - Delete specific memories

**Features:**
- Namespace-based organization
- Semantic search with relevance scoring
- Memory strategy support
- Regional deployment options

## Example Usage

### Mem0
```typescript
// Store a memory
await agent.generate({
  prompt: "Remember that my favorite color is blue",
  tools: { memoryStore }
});

// Retrieve a memory
await agent.generate({
  prompt: "What is my favorite color?",
  tools: { memoryRetrieve }
});
```

### AWS AgentCore
```typescript
// Store a memory with namespace
await agent.generate({
  prompt: "Store in memory: User prefers dark mode",
  tools: { memoryStore }
});
// Uses: memoryId, content, namespace

// Retrieve memories with semantic search
await agent.generate({
  prompt: "What are the user preferences?",
  tools: { memoryRetrieve }
});
// Uses: memoryId, namespace, query, topK

// Delete a specific memory
await agent.generate({
  prompt: "Delete the preference memory",
  tools: { memoryDelete }
});
// Uses: memoryId, memoryRecordId
```

## Implementation Status

### Mem0
✅ Fully implemented with REST API integration

### AWS AgentCore Memory
✅ Fully implemented using AWS SDK v3:
- `BatchCreateMemoryRecordsCommand` - Create memory records
- `RetrieveMemoryRecordsCommand` - Search and retrieve memories
- `DeleteMemoryRecordCommand` - Delete memory records

## API Reference

### AgentCore Store Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| memoryId | string | Yes | The unique ID of the memory resource |
| content | string | Yes | The text content to store |
| namespace | string | Yes | Namespace to categorize the memory |
| memoryStrategyId | string | No | Optional memory strategy ID |
| awsRegion | string | No | AWS region (default: us-west-2) |

### AgentCore Retrieve Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| memoryId | string | Yes | The memory resource ID |
| namespace | string | Yes | Namespace to search within |
| query | string | Yes | Semantic search query |
| topK | number | No | Max top-scoring results (default: 10) |
| memoryStrategyId | string | No | Filter by memory strategy |
| maxResults | number | No | Max results per page (1-100) |

### AgentCore Delete Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| memoryId | string | Yes | The memory resource ID |
| memoryRecordId | string | Yes | The record ID to delete |

## Documentation References

- [Mem0 API](https://docs.mem0.ai/)
- [AWS Bedrock AgentCore Memory](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/memory.html)
