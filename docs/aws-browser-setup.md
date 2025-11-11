# AWS Bedrock AgentCore Browser Setup

This guide explains how to set up AWS Bedrock AgentCore browser automation for gaia-agent.

## Prerequisites

1. **AWS Account** with Bedrock access
2. **AWS CLI** configured with credentials
3. **Playwright** installed (automatically installed with gaia-agent)

## Step 1: Create Browser Resource in AWS

AWS Bedrock AgentCore requires a pre-created Browser resource before you can start browser sessions.

### Option A: AWS Console (Recommended)

1. Go to [AWS Bedrock AgentCore Console](https://console.aws.amazon.com/bedrock/agentcore)
2. Navigate to **Browser Tools**
3. Click **Create Browser**
4. Configure:
   - **Browser Identifier**: `gaia-agent-browser` (or custom name)
   - **Display Name**: `GAIA Agent Browser`
   - **Region**: Select your region (e.g., `us-west-2`)
5. Click **Create**
6. Copy the **Browser Identifier** for later use

### Option B: AWS CLI

```bash
# Create browser resource
aws bedrock-agentcore create-browser \
  --browser-identifier gaia-agent-browser \
  --display-name "GAIA Agent Browser" \
  --region us-west-2
```

## Step 2: Configure Environment Variables

Add the following to your `.env` file:

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-west-2

# Browser Provider Selection
GAIA_AGENT_BROWSER_PROVIDER=aws-bedrock-agentcore

# Browser Identifier (optional - defaults to "gaia-agent-browser")
BEDROCK_BROWSER_IDENTIFIER=gaia-agent-browser
```

## Step 3: Test Browser Integration

Run a simple test:

```bash
pnpm run benchmark:browser --limit 1 --verbose --random --stream
```

Expected output:
- ✅ Browser session starts successfully
- ✅ Page navigation works
- ✅ Content extraction works

## How It Works

1. **Start Session**: SDK calls `StartBrowserSessionCommand` with your browser identifier
2. **WebSocket Connection**: Response includes WebSocket URL for Playwright connection
3. **Browser Control**: Playwright connects via CDP (Chrome DevTools Protocol)
4. **Automation**: Full browser automation using Playwright API
5. **Cleanup**: Session stopped with `StopBrowserSessionCommand`

## Architecture

```
gaia-agent
    ↓
AWS Bedrock AgentCore SDK
    ↓
StartBrowserSession → WebSocket URL
    ↓
Playwright (CDP)
    ↓
AWS-managed Browser Instance
```

## Troubleshooting

### Error: "Browser not found"

**Problem**: Browser resource doesn't exist in AWS

**Solution**: 
1. Check browser exists: `aws bedrock-agentcore list-browsers --region us-west-2`
2. Create browser (see Step 1 above)
3. Verify `BEDROCK_BROWSER_IDENTIFIER` matches the created browser ID

### Error: "Resolved credential object is not valid"

**Problem**: AWS credentials not configured

**Solution**:
1. Set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in `.env`
2. Or configure AWS CLI: `aws configure`

### Error: "No WebSocket URL provided"

**Problem**: AWS SDK response format unexpected

**Solution**:
1. Check AWS SDK version: `pnpm list @aws-sdk/client-bedrock-agentcore`
2. Update SDK: `pnpm update @aws-sdk/client-bedrock-agentcore`
3. Check AWS region supports browser tool

## Comparison: AWS vs BrowserUse

| Feature | AWS Bedrock AgentCore | BrowserUse |
|---------|----------------------|------------|
| Setup | AWS account + Browser resource | API key only |
| Pricing | AWS Bedrock pricing | Pay-per-task |
| Control | Full Playwright control | Task-based API |
| Regions | AWS regions | Global |
| Reliability | AWS infrastructure | Cloud service |

**Recommendation**: 
- Use **BrowserUse** for quick setup and simple tasks
- Use **AWS Bedrock AgentCore** for enterprise deployments with existing AWS infrastructure

## References

- [AWS Bedrock AgentCore Docs](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/browser-tool.html)
- [Playwright CDP](https://playwright.dev/docs/api/class-browser#browser-connect-over-cdp)
- [AWS SDK JavaScript](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/bedrock-agentcore/)
