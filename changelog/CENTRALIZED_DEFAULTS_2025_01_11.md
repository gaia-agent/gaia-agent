# Centralized Default Provider Configuration

Date: January 11, 2025 (continuation)

## Overview

Centralized all default provider values into `src/config/defaults.ts` to avoid inconsistencies and make it easier to change defaults across the entire codebase.

## Problem

Default provider values were scattered across multiple files:
- `src/config/tools.ts` - "openai", "e2b", "steel", "mem0"
- `src/config/providers.ts` - "openai", "e2b", "steel"
- `src/tools/search/index.ts` - "openai"
- `src/tools/sandbox/index.ts` - "e2b"
- `src/tools/browser/index.ts` - "steel"
- `benchmark/run.ts` - "tavily", "e2b", "steel", "mem0"

**Risk**: Easy to miss updating one location when changing defaults, leading to inconsistent behavior.

## Solution

Created centralized `DEFAULT_PROVIDERS` constant in `src/config/defaults.ts`:

```typescript
export const DEFAULT_PROVIDERS = {
  search: "openai" as SearchProvider,
  sandbox: "e2b" as SandboxProvider,
  browser: "steel" as BrowserProvider,
  memory: "mem0" as MemoryProvider,
} as const;
```

## Changes

### 1. Added DEFAULT_PROVIDERS to `src/config/defaults.ts`

**Before:**
```typescript
/**
 * Default configuration values for GAIA Agent
 */

/**
 * ReAct (Reasoning + Acting) instructions for enhanced reasoning
 */
export const REACT_INSTRUCTIONS = ...
```

**After:**
```typescript
/**
 * Default configuration values for GAIA Agent
 */

import type { BrowserProvider, MemoryProvider, SandboxProvider, SearchProvider } from "../types.js";

/**
 * Default provider configuration
 * Centralized defaults to avoid inconsistencies across the codebase
 */
export const DEFAULT_PROVIDERS = {
  search: "openai" as SearchProvider,
  sandbox: "e2b" as SandboxProvider,
  browser: "steel" as BrowserProvider,
  memory: "mem0" as MemoryProvider,
} as const;

/**
 * ReAct (Reasoning + Acting) instructions for enhanced reasoning
 */
export const REACT_INSTRUCTIONS = ...
```

### 2. Updated `src/config/tools.ts`

**Before:**
```typescript
const browserProvider = mergedConfig?.browser || "steel";
const sandboxProvider = mergedConfig?.sandbox || "e2b";
const searchProvider = mergedConfig?.search || "openai";
const memoryProvider = mergedConfig?.memory || "mem0";
```

**After:**
```typescript
import { DEFAULT_PROVIDERS } from "./defaults.js";

const browserProvider = mergedConfig?.browser || DEFAULT_PROVIDERS.browser;
const sandboxProvider = mergedConfig?.sandbox || DEFAULT_PROVIDERS.sandbox;
const searchProvider = mergedConfig?.search || DEFAULT_PROVIDERS.search;
const memoryProvider = mergedConfig?.memory || DEFAULT_PROVIDERS.memory;
```

### 3. Updated `src/config/providers.ts`

**Before:**
```typescript
const searchProvider = providers?.search || "openai";
const sandboxProvider = providers?.sandbox || "e2b";
const browserProvider = providers?.browser || "steel";
```

**After:**
```typescript
import { DEFAULT_PROVIDERS } from "./defaults.js";

const searchProvider = providers?.search || DEFAULT_PROVIDERS.search;
const sandboxProvider = providers?.sandbox || DEFAULT_PROVIDERS.sandbox;
const browserProvider = providers?.browser || DEFAULT_PROVIDERS.browser;
```

### 4. Updated `src/tools/search/index.ts`

**Before:**
```typescript
export const createSearchTool = (provider: SearchProvider = "openai"): Tool => {
export const createSearchTools = (provider: SearchProvider = "openai") => {
```

**After:**
```typescript
import { DEFAULT_PROVIDERS } from "../../config/defaults.js";

export const createSearchTool = (provider: SearchProvider = DEFAULT_PROVIDERS.search): Tool => {
export const createSearchTools = (provider: SearchProvider = DEFAULT_PROVIDERS.search) => {
```

### 5. Updated `src/tools/sandbox/index.ts`

**Before:**
```typescript
export const createSandboxTool = (provider: SandboxProvider = "e2b"): Tool => {
export const createSandboxTools = (provider: SandboxProvider = "e2b") => {
```

**After:**
```typescript
import { DEFAULT_PROVIDERS } from "../../config/defaults.js";

export const createSandboxTool = (provider: SandboxProvider = DEFAULT_PROVIDERS.sandbox): Tool => {
export const createSandboxTools = (provider: SandboxProvider = DEFAULT_PROVIDERS.sandbox) => {
```

### 6. Updated `src/tools/browser/index.ts`

**Before:**
```typescript
export const createBrowserTool = (provider: BrowserProvider = "steel"): Tool => {
export const createBrowserTools = (provider: BrowserProvider = "steel") => {
```

**After:**
```typescript
import { DEFAULT_PROVIDERS } from "../../config/defaults.js";

export const createBrowserTool = (provider: BrowserProvider = DEFAULT_PROVIDERS.browser): Tool => {
export const createBrowserTools = (provider: BrowserProvider = DEFAULT_PROVIDERS.browser) => {
```

### 7. Updated `benchmark/run.ts`

**Before:**
```typescript
const searchProvider = providers?.search || "tavily";  // ❌ Wrong default!
const sandboxProvider = providers?.sandbox || "e2b";
const browserProvider = providers?.browser || "steel";
const memoryProvider = providers?.memory || "mem0";
```

**After:**
```typescript
import { DEFAULT_PROVIDERS } from "../src/config/defaults.js";

const searchProvider = providers?.search || DEFAULT_PROVIDERS.search;
const sandboxProvider = providers?.sandbox || DEFAULT_PROVIDERS.sandbox;
const browserProvider = providers?.browser || DEFAULT_PROVIDERS.browser;
const memoryProvider = providers?.memory || DEFAULT_PROVIDERS.memory;
```

**Note**: This also fixed a bug where benchmark was using "tavily" instead of "openai" as default!

### 8. Exported DEFAULT_PROVIDERS in `src/index.ts`

**Before:**
```typescript
export { DEFAULT_INSTRUCTIONS, REACT_INSTRUCTIONS } from "./config/defaults.js";
```

**After:**
```typescript
export { DEFAULT_INSTRUCTIONS, DEFAULT_PROVIDERS, REACT_INSTRUCTIONS } from "./config/defaults.js";
```

### 9. Updated Documentation Comments

Updated JSDoc examples to reflect OpenAI as default search provider instead of Tavily.

## Benefits

### 1. Single Source of Truth
- All defaults defined in ONE place: `src/config/defaults.ts`
- Change defaults once, applied everywhere automatically
- No risk of missing updates in scattered files

### 2. Type Safety
- TypeScript enforces correct provider types
- Auto-completion works correctly
- Compile-time validation

### 3. Consistency
- All parts of the codebase use same defaults
- No discrepancies between main code and benchmark
- Documentation stays in sync

### 4. Maintainability
- Easy to change defaults (single line edit)
- Clear intent when reading code
- Self-documenting (import makes default explicit)

### 5. Bug Fixes
- Fixed benchmark using "tavily" instead of "openai"
- Ensured all factory functions use same defaults

## How to Change Defaults

**Before** (required changes in 7+ files):
```typescript
// src/config/tools.ts
const searchProvider = mergedConfig?.search || "newdefault";

// src/config/providers.ts
const searchProvider = providers?.search || "newdefault";

// src/tools/search/index.ts
export const createSearchTool = (provider: SearchProvider = "newdefault"): Tool => {

// benchmark/run.ts
const searchProvider = providers?.search || "newdefault";

// ... and more files
```

**After** (single change):
```typescript
// src/config/defaults.ts
export const DEFAULT_PROVIDERS = {
  search: "newdefault" as SearchProvider,  // ✅ Change once
  sandbox: "e2b" as SandboxProvider,
  browser: "steel" as BrowserProvider,
  memory: "mem0" as MemoryProvider,
} as const;
```

## Usage for Users

Users can now access the default providers programmatically:

```typescript
import { DEFAULT_PROVIDERS } from '@gaia-agent/sdk';

console.log(DEFAULT_PROVIDERS.search);   // "openai"
console.log(DEFAULT_PROVIDERS.sandbox);  // "e2b"
console.log(DEFAULT_PROVIDERS.browser);  // "steel"
console.log(DEFAULT_PROVIDERS.memory);   // "mem0"
```

This is useful for:
- Knowing what defaults are without checking documentation
- Building custom configurations that extend defaults
- Writing tests that depend on default behavior

## Validation

✅ All checks passing:
```bash
pnpm build       # Successful compilation
pnpm typecheck   # No TypeScript errors
```

## Files Changed

### Modified (8 files)
1. ✅ `src/config/defaults.ts` - Added DEFAULT_PROVIDERS constant
2. ✅ `src/config/tools.ts` - Use DEFAULT_PROVIDERS
3. ✅ `src/config/providers.ts` - Use DEFAULT_PROVIDERS
4. ✅ `src/tools/search/index.ts` - Use DEFAULT_PROVIDERS.search
5. ✅ `src/tools/sandbox/index.ts` - Use DEFAULT_PROVIDERS.sandbox
6. ✅ `src/tools/browser/index.ts` - Use DEFAULT_PROVIDERS.browser
7. ✅ `benchmark/run.ts` - Use DEFAULT_PROVIDERS (fixed tavily → openai)
8. ✅ `src/index.ts` - Export DEFAULT_PROVIDERS

### Documentation Updates
- Updated JSDoc comments to reflect OpenAI as default search provider

## Summary

This refactoring centralizes all default provider configuration into a single constant, making the codebase more maintainable and reducing the risk of inconsistencies. It also fixes a bug where the benchmark was using a different default search provider than the main code.

**Key Achievement**: Changed search default from "tavily" to "openai" across entire codebase with confidence that nothing was missed.
