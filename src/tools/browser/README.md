# Browser Tools

The gaia-agent supports multiple browser automation providers with a factory pattern architecture.

## Architecture

```
tools/browser/
├── types.ts          # Provider interfaces and schemas
├── steel.ts          # Steel provider implementation
├── browseruse.ts     # BrowserUse provider implementation
├── aws-agentcore.ts  # AWS AgentCore provider implementation
├── index.ts          # Factory functions
└── README.md         # This file
```

## Providers

### 1. Steel (Default)
Cloud browser automation with Playwright CDP connection.

**Usage:**
```typescript
import { createGaiaAgent } from '@gaia-agent/sdk';

const agent = createGaiaAgent({
  providers: {
    browser: 'steel'
  }
});
```

**Environment Variables:**
- `STEEL_API_KEY` - Your Steel API key

**Available Options:**
- `task` - Natural language task description
- `url` - Starting URL (optional)
- `useProxy` - Use Steel's residential proxy network (optional)
- `solveCaptcha` - Enable automatic CAPTCHA solving (optional)
- `timeout` - Session timeout in milliseconds (default: 300000)

**Features:**
- ✅ Cloud browser with Playwright CDP
- ✅ Free tier available
- ✅ Proxy network support
- ✅ CAPTCHA solving
- ✅ Session viewer for debugging

### 2. BrowserUse
Task-based autonomous browser automation.

**Usage:**
```typescript
import { createGaiaAgent } from '@gaia-agent/sdk';

const agent = createGaiaAgent({
  providers: {
    browser: 'browseruse'
  }
});
```

**Environment Variables:**
- `BROWSERUSE_API_KEY` - Your BrowserUse API key

**Available Options:**
- `task` - Natural language task description

**Features:**
- ✅ Autonomous task completion
- ✅ Official SDK v2
- ⚠️ Paid service (requires recharge)

### 3. AWS Bedrock AgentCore
Enterprise-grade browser automation (requires WebSocket).

**Usage:**
```typescript
import { createGaiaAgent } from '@gaia-agent/sdk';

const agent = createGaiaAgent({
  providers: {
    browser: 'aws-bedrock-agentcore'
  }
});
```

**Environment Variables:**
- `AWS_ACCESS_KEY_ID` - Your AWS access key
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret key
- `AWS_REGION` - AWS region (default: us-west-2)
- `BEDROCK_BROWSER_IDENTIFIER` - Browser resource ID

**Status:**
⚠️ **Limited implementation** - JavaScript SDK lacks WebSocket helpers. Use Steel or BrowserUse instead.

## Factory Pattern Usage

### Basic Usage

```typescript
import { createBrowserTool } from '@gaia-agent/sdk/tools/browser';

// Create Steel browser tool (default)
const steelTool = createBrowserTool('steel');

// Create BrowserUse tool
const browserUseTool = createBrowserTool('browseruse');

// Create AWS AgentCore tool
const awsTool = createBrowserTool('aws-bedrock-agentcore');
```

### Advanced Usage

```typescript
import { 
  steelProvider, 
  steelSchemas,
  createBrowserTools 
} from '@gaia-agent/sdk/tools/browser';

// Use provider directly
const result = await steelProvider.execute({
  task: 'Navigate to example.com and extract the title',
  url: 'https://example.com'
});

// Create all browser tools
const tools = createBrowserTools('steel');
```

## Provider Comparison

| Feature | Steel | BrowserUse | AWS AgentCore |
|---------|-------|------------|---------------|
| **Pricing** | Free tier | Paid | AWS costs |
| **Setup** | API key | API key | AWS credentials |
| **Speed** | Fast | Fast | N/A |
| **Reliability** | ✅ High | ✅ High | ❌ Limited (JS) |
| **Proxy Support** | ✅ Yes | ✅ Yes | ❌ No |
| **CAPTCHA Solving** | ✅ Yes | ✅ Yes | ❌ No |
| **Session Viewer** | ✅ Yes | ❌ No | ❌ No |

## Implementation Status

### Steel
✅ Fully implemented with Playwright CDP integration

### BrowserUse
✅ Fully implemented with official SDK v2

### AWS AgentCore
⚠️ **Placeholder implementation** - Requires WebSocket SigV4 authentication:
- JavaScript SDK only provides session management (Start/Stop/Update)
- Browser actions must be sent via WebSocket with signed query parameters
- Python SDK has full `browser_session` helper support
- Recommend using Steel or BrowserUse instead

## Documentation References

- [Steel API](https://docs.steel.dev/)
- [BrowserUse API](https://www.browseruse.com)
- [AWS Bedrock AgentCore Browser](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/browser-tool.html)
