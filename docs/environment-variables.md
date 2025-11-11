# Environment Variables

Complete guide to configuring gaia-agent with environment variables.

## Required Variables

### OpenAI API Key

```bash
OPENAI_API_KEY=sk-...
```

This is the only **required** environment variable. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys).

## Optional Configuration

### OpenAI Configuration

```bash
# Model selection (default: gpt-4o)
OPENAI_MODEL=gpt-4o                    # Options: gpt-4o, gpt-4o-mini, gpt-4-turbo, etc.

# Custom endpoint (for proxies or alternative providers)
OPENAI_BASE_URL=https://api.openai.com/v1
```

### Provider Selection

Override default providers using environment variables:

```bash
# Search provider (default: tavily)
GAIA_AGENT_SEARCH_PROVIDER=tavily      # Options: tavily | exa

# Sandbox provider (default: e2b)
GAIA_AGENT_SANDBOX_PROVIDER=e2b        # Options: e2b | sandock

# Browser provider (default: steel)
GAIA_AGENT_BROWSER_PROVIDER=steel      # Options: steel | browseruse | aws-bedrock-agentcore

# Memory provider (optional, default: mem0)
GAIA_AGENT_MEMORY_PROVIDER=mem0        # Options: mem0 | agentcore
```

## Provider API Keys

### Default Providers

Required for default configuration:

```bash
# Search (Tavily - default)
TAVILY_API_KEY=tvly-...

# Sandbox (E2B - default)
E2B_API_KEY=...

# Browser (Steel - default)
STEEL_API_KEY=steel_live_...

# Memory (optional, Mem0)
MEM0_API_KEY=...
```

### Alternative Providers

Optional API keys for alternative providers:

```bash
# Alternative Search (Exa)
EXA_API_KEY=...

# Alternative Sandbox (Sandock)
SANDOCK_API_KEY=...

# Alternative Browser (BrowserUse)
BROWSERUSE_API_KEY=...

# Alternative Memory (AWS AgentCore)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
```

## Configuration Priority

Settings are applied in this order (highest to lowest):

1. **Code Configuration** (highest priority)
   ```typescript
   createGaiaAgent({
     providers: { search: 'exa' }
   })
   ```

2. **Environment Variables**
   ```bash
   GAIA_AGENT_SEARCH_PROVIDER=exa
   ```

3. **Defaults** (lowest priority)
   - Search: `tavily`
   - Sandbox: `e2b`
   - Browser: `steel`
   - Memory: `mem0`

## Setup Guide

### 1. Create `.env` File

Copy the example file:

```bash
cp .env.example .env
```

### 2. Add Your API Keys

Edit `.env` and add your keys:

```bash
# Required
OPENAI_API_KEY=sk-proj-...

# Default providers
TAVILY_API_KEY=tvly-...
E2B_API_KEY=e2b_...
STEEL_API_KEY=steel_live_...
```

### 3. Verify Configuration

Run a quick test:

```typescript
import { createGaiaAgent } from '@gaia-agent/sdk';

const agent = createGaiaAgent();
const result = await agent.generate({
  prompt: 'Test: what is 2+2?'
});

console.log(result.text); // Should work!
```

## Provider-Specific Configuration

### Tavily Search

```bash
TAVILY_API_KEY=tvly-...
```

Get your key: [Tavily API](https://tavily.com)

### Exa Search

```bash
EXA_API_KEY=...
```

Get your key: [Exa AI](https://exa.ai)

### E2B Sandbox

```bash
E2B_API_KEY=...
```

Get your key: [E2B Platform](https://e2b.dev)

### Sandock Sandbox

```bash
SANDOCK_API_KEY=...
```

Get your key: [Sandock AI](https://sandock.ai)

### Steel Browser

```bash
STEEL_API_KEY=steel_live_...
```

Get your key: [Steel Browser](https://steel.dev)

### BrowserUse

```bash
BROWSERUSE_API_KEY=...
```

Get your key: [BrowserUse](https://browseruse.com)

### AWS AgentCore

For browser or memory tools:

```bash
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
```

Setup: [AWS IAM](https://aws.amazon.com/iam/)

### Mem0 Memory

```bash
MEM0_API_KEY=...
```

Get your key: [Mem0 AI](https://mem0.ai)

## Example Configurations

### Minimal Setup (Default Providers)

```bash
OPENAI_API_KEY=sk-...
TAVILY_API_KEY=tvly-...
E2B_API_KEY=...
STEEL_API_KEY=steel_live_...
```

### Alternative Providers

```bash
OPENAI_API_KEY=sk-...

# Use Exa for search
GAIA_AGENT_SEARCH_PROVIDER=exa
EXA_API_KEY=...

# Use Sandock for sandbox
GAIA_AGENT_SANDBOX_PROVIDER=sandock
SANDOCK_API_KEY=...

# Use BrowserUse for browser
GAIA_AGENT_BROWSER_PROVIDER=browseruse
BROWSERUSE_API_KEY=...
```

### AWS-Based Setup

```bash
OPENAI_API_KEY=sk-...

# Use AWS for browser and memory
GAIA_AGENT_BROWSER_PROVIDER=aws-bedrock-agentcore
GAIA_AGENT_MEMORY_PROVIDER=agentcore

AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1

# Still need search and sandbox
TAVILY_API_KEY=tvly-...
E2B_API_KEY=...
```

## Troubleshooting

### Missing API Key Errors

```
Error: OPENAI_API_KEY is required but not set
```

**Solution:** Add the key to your `.env` file

### Provider Not Working

```
Error: Search provider 'exa' selected but EXA_API_KEY not set
```

**Solution:** Add the provider's API key or switch to default provider

### .env File Not Loaded

**Solution:** Make sure `.env` is in your project root and not in `.gitignore`

### Using in Production

**Recommendation:** Use environment variables directly (not `.env` file):

```bash
# Set in your hosting platform
export OPENAI_API_KEY=sk-...
export TAVILY_API_KEY=tvly-...
```

## Security Best Practices

1. **Never commit `.env` to git**
   - Already in `.gitignore`
   - Use `.env.example` for templates

2. **Rotate keys regularly**
   - Especially after team member changes
   - Use short-lived tokens when possible

3. **Use different keys per environment**
   - Development, staging, production
   - Easier to track usage and debug

4. **Limit API key permissions**
   - AWS: Use IAM roles with minimal permissions
   - Other providers: Check permission settings

## References

- [Provider comparison](./providers.md)
- [GAIA benchmark setup](./gaia-benchmark.md)
- [Advanced usage](./advanced-usage.md)
