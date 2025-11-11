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
- `mem0Remember` - Store information in memory
- `mem0Recall` - Retrieve information from memory

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

**Available Tools:**
- `memoryStore` - Store information in session-based memory
- `memoryRetrieve` - Retrieve memories from a session
- `memoryDelete` - Delete specific memories

**Features:**
- Session-based isolation
- Metadata support
- Query-based retrieval
- Regional deployment options

## Example Usage

### Mem0
```typescript
// Store a memory
await agent.generate({
  prompt: "Remember that my favorite color is blue",
  tools: { mem0Remember }
});

// Retrieve a memory
await agent.generate({
  prompt: "What is my favorite color?",
  tools: { mem0Recall }
});
```

### AWS AgentCore
```typescript
// Store a memory with session ID
await agent.generate({
  prompt: "Store in memory for session-123: User prefers dark mode",
  tools: { memoryStore }
});

// Retrieve memories from session
await agent.generate({
  prompt: "Retrieve all memories for session-123",
  tools: { memoryRetrieve }
});
```

## Implementation Status

### Mem0
✅ Fully implemented with REST API integration

### AWS AgentCore Memory
⚠️ **Placeholder implementation** - Requires AWS SDK for JavaScript v3:
- `@aws-sdk/client-bedrock-agent`

The tool structure is ready, but actual AWS API calls need to be implemented when the AWS SDK becomes available.

## Documentation References

- [Mem0 API](https://docs.mem0.ai/)
- [AWS Bedrock AgentCore Memory](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/memory.html)
