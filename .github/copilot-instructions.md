# Copilot Instructions for gaia-agent

This document guides AI coding agents working on the gaia-agent codebase. Focus on architecture patterns, critical workflows, and project-specific conventions.

## Architecture Overview

**Core Pattern: Factory + Strategy + Adapter**

- **Factory Pattern**: `createMemoryTools()`, `createSandboxTools()` - Abstract provider selection
- **Strategy Pattern**: `IMemoryProvider`, `ISandboxProvider` - Swappable runtime implementations
- **Adapter Pattern**: Unified tool interfaces despite different provider APIs (e.g., Mem0 vs AWS AgentCore)

**Tool Categories**: Memory, Sandbox, Search, Browser, Core (16+ tools total)

**Provider System**: Each tool category supports multiple swappable providers:
- Memory: `mem0` (Mem0 API) | `agentcore` (AWS Bedrock AgentCore Memory)
- Sandbox: `e2b` (E2B cloud sandbox) | `sandock` (Sandock API)
- Search: `tavily` (Q&A search) | `exa` (neural search with similarity/content APIs)

**Module Structure** (Exemplar: `src/tools/memory/`):
```
types.ts       # IMem0Provider, IAgentCoreProvider interfaces + IMemorySchemas
mem0.ts        # Mem0 provider implementation with schemas
agentcore.ts   # AWS AgentCore provider implementation
index.ts       # Factory functions: createMemoryTools(), createMemoryStoreTool(), etc.
README.md      # Pattern documentation + usage examples
```

## Critical Developer Workflows

**Build & Type Check**:
```bash
pnpm build       # TypeScript compilation (tsc) → dist/
pnpm typecheck   # Type checking without emit (tsc --noEmit)
```

**Code Quality** (Biome - all-in-one formatter/linter):
```bash
pnpm format      # Auto-format code (biome format --write)
pnpm lint        # Lint with auto-fix (biome lint --write)
pnpm check       # Format + lint + organize imports (biome check --write)
```

**Benchmarking** (GAIA official benchmark):
```bash
pnpm bench                 # Run validation set
pnpm bench:test            # Run test set
pnpm bench:level1          # Filter by difficulty level
pnpm bench:limit 5         # Limit number of questions
```

## Adding New Providers

**Step 1**: Define interface in `types.ts`:
```typescript
// src/tools/memory/types.ts
export interface IMem0Provider {
  add(messages: { role: string; content: string }[]): Promise<{ results: { id: string }[] }>;
  search(query: string): Promise<{ results: Array<{ memory: string }> }>;
  // ... other methods
}
```

**Step 2**: Implement provider in separate file:
```typescript
// src/tools/memory/mem0.ts
import type { IMem0Provider, IMemorySchemas } from './types';

export function createMem0Provider(apiKey: string): IMem0Provider {
  return {
    async add(messages) { /* ... */ },
    async search(query) { /* ... */ },
  };
}

export const mem0Schemas: IMemorySchemas = {
  add: z.object({ messages: z.array(z.object({ ... })) }),
  search: z.object({ query: z.string() }),
  // ... other schemas
};
```

**Step 3**: Update factory in `index.ts`:
```typescript
// src/tools/memory/index.ts
export function createMemoryTools(
  provider: 'mem0' | 'agentcore',
  config: MemoryConfig
): Record<string, Tool<any, any>> {
  const impl = provider === 'mem0' 
    ? createMem0Provider(config.apiKey)
    : createAgentCoreProvider(config);
  const schemas = provider === 'mem0' ? mem0Schemas : agentcoreSchemas;

  return {
    memoryStore: createMemoryStoreTool(impl, schemas),
    memorySearch: createMemorySearchTool(impl, schemas),
    // ... other tools
  };
}
```

**Step 4**: Preserve backward compatibility (legacy exports):
```typescript
// For existing code using direct imports
export { mem0Search, mem0Store } from './mem0';
```

## Project-Specific Conventions

**Language Requirements**:
- **Use English only** for all code, comments, documentation, and commit messages
- **No other languages allowed** - No Chinese, Japanese, Korean, or any non-English characters in the codebase
- Variable names, function names, comments, JSDoc, and error messages must be in English
- Documentation files (README, ARCHITECTURE, etc.) must be in English
- Error messages and user-facing strings must be in English

**Type Safety**:
- All tools use Zod schemas for validation
- AI SDK Tool type casting: `inputSchema: schema as unknown as Tool["inputSchema"]`
- Strict TypeScript mode enabled (`strict: true`, `noImplicitAny: true`)

**ESM & Tree-Shaking**:
- Package uses ESM modules (`"type": "module"`)
- Granular exports in `package.json` for tree-shaking:
  ```json
  {
    ".": "./dist/index.js",
    "./tools/memory": "./dist/tools/memory/index.js",
    "./tools/sandbox": "./dist/tools/sandbox/index.js"
  }
  ```

**File Organization**:
- `src/` - Source TypeScript files
- `dist/` - Compiled JavaScript (git-ignored)
- `src/docs/` - Documentation (gaia-benchmark.md, providers.md)
- `ARCHITECTURE.md` - Design patterns deep dive
- `REFACTORING_SUMMARY.md` - Pattern explanations + code metrics

**Biome Configuration**:
- Line width: 100 characters
- Quote style: Double quotes
- Semicolons: Always
- Trailing commas: All
- Indent: 2 spaces

**AI SDK v6 Beta** (Critical API Changes):
- Tool creation: `tool({ description, parameters, execute })` (no `inputSchema` property in source)
- Max steps: Use `stepCountIs()` not `maxSteps` property
- Schema casting: `parameters: z.object({ ... }) as unknown as Tool["inputSchema"]`

## Integration Points

**Main Entry** (`src/index.ts`):
- `gaiaAgent`: Pre-configured ToolLoopAgent with all default tools
- `createGaiaAgent()`: Factory for custom agent with additional tools
- `getDefaultTools()`: Returns all 16 built-in tools using factory pattern
- `GAIAAgent` class: Extendable class for advanced customization

**Tool Discovery**:
```typescript
import { getDefaultTools } from 'gaia-agent';
import { createMemoryTools } from 'gaia-agent/tools/memory';
import { createSandboxTools } from 'gaia-agent/tools/sandbox';

// Use factory pattern to swap providers
const memoryTools = createMemoryTools('agentcore', { /* config */ });
const sandboxTools = createSandboxTools('e2b', { apiKey: '...' });
```

## Testing & Debugging

**TypeScript Errors**:
1. Run `pnpm typecheck` to see all errors
2. Check AI SDK v6 beta compatibility (breaking changes common)
3. Verify Zod schemas match Tool type requirements

**Biome Warnings**:
- Expected warnings: 9 minor issues (mostly `any` types in interface definitions)
- Suppress false positives with `// biome-ignore lint/suspicious/noExplicitAny: <reason>`

**Benchmark Debugging**:
- Use `pnpm bench:limit 1` to test single question
- Check `gaiaConfig.json` for API keys and model configuration
- Review `src/benchmark-runner.ts` for GAIA validation logic

## Key Design Decisions

**Why Factory Pattern?**
- **Problem**: 60% code duplication across provider implementations
- **Solution**: Centralized tool creation with swappable providers
- **Result**: 55% reduction in duplication, unified interfaces

**Why Separate Files?**
- **Problem**: Large files (300+ lines) becoming unmaintainable
- **Solution**: Split into types.ts, {provider}.ts, index.ts per module
- **Result**: Single Responsibility Principle, easier testing/discovery

**Why Adapter Pattern?**
- **Problem**: Different provider APIs (e.g., Mem0 uses `messages`, AgentCore uses `sessionId`)
- **Solution**: Unified interfaces (IMemoryProvider) with provider-specific adapters
- **Result**: Consumer code unchanged when swapping providers

## Common Tasks

**Add New Tool to Existing Category**:
1. Define schema in `{provider}.ts` (add to schemas object)
2. Implement method in provider interface (update `types.ts`)
3. Create tool factory function in `index.ts` (e.g., `createMemoryNewTool()`)
4. Export from main factory (`createMemoryTools()`)

**Refactor New Tool Category to Factory Pattern**:
1. Create `src/tools/{category}/types.ts` with provider interfaces
2. Extract each provider to `{category}/{provider}.ts` with schemas
3. Build factories in `{category}/index.ts` with `create{Category}Tools()`
4. Update main exports in `src/index.ts` to use factory
5. Preserve legacy exports for backward compatibility
6. Document in `{category}/README.md` with usage examples

**Update Dependencies**:
- AI SDK beta: Check for breaking changes in Tool API
- Biome: Run `pnpm check` after upgrade to catch new linting rules
- Provider SDKs: Update adapters in `{provider}.ts` to match new APIs

---

**References**:
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Full design pattern documentation
- [REFACTORING_SUMMARY.md](../REFACTORING_SUMMARY.md) - Refactoring journey + metrics
- [README.md](../README.md) - User-facing documentation + API reference
- [tools/memory/README.md](../src/tools/memory/README.md) - Pattern implementation example
