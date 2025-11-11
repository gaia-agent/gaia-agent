# Changelog

This directory contains project changelogs with dates.

## Types of Changelogs

### 1. Automatic Release Changelogs

Created automatically by GitHub Actions when publishing to NPM:

```
RELEASE_[date]_[version].md
```

**Example:** `RELEASE_2025-11-11_v0.1.6.md`

**Content:**
- Release date
- Version number
- Recent commits
- Build information

### 2. Manual Feature Changelogs

Created manually for major features or changes:

```
FEATURE_[date]_[name].md
```

**Example:** `FEATURE_2025_11_11_streaming.md`

**When to create:**
- New major features
- Significant API changes
- Breaking changes

### 3. Refactoring Changelogs

Documenting major refactorings:

```
REFACTORING_[date].md
```

**Example:** `REFACTORING_2025_11_11.md`

**When to create:**
- Code reorganization
- Architecture changes
- Module restructuring

## Naming Convention

Format: `[TYPE]_[YYYY_MM_DD]_[description].md`

**Examples:**
- `RELEASE_2025_11_11_v0.1.0.md` - Auto-generated release
- `FEATURE_2025_11_15_memory_providers.md` - New feature
- `REFACTORING_2025_11_20.md` - Code refactoring
- `BUGFIX_2025_11_25_parquet_parsing.md` - Important bug fix
- `BREAKING_2025_12_01_api_changes.md` - Breaking changes

## Guidelines

### What to Document

✅ **Do document:**
- New features
- Breaking changes
- Major refactorings
- Architecture decisions
- Significant bug fixes
- Performance improvements

❌ **Don't document:**
- Minor typo fixes
- Dependency updates (unless critical)
- Internal code cleanup
- Documentation updates

### Changelog Format

```markdown
# [Title]

Date: [YYYY-MM-DD]

## Overview

Brief description of the change.

## Changes

- Change 1
- Change 2
- Change 3

## Migration Guide (if breaking)

How to update existing code.

## Technical Details (optional)

Implementation notes, architecture decisions.

## References

- Related issues
- Pull requests
- Documentation links
```

## Example: Feature Changelog

```markdown
# Memory Provider System

Date: 2025-11-15

## Overview

Added swappable memory provider system with support for Mem0 and AWS AgentCore Memory.

## Changes

- Created `IMemoryProvider` interface
- Implemented Mem0 provider with REST API
- Implemented AWS AgentCore provider (placeholder)
- Added factory pattern: `createMemoryTools()`
- Backward compatible with existing `mem0Remember`/`mem0Recall`

## Migration Guide

Old code still works:
```typescript
import { mem0Remember } from '@gaia-agent/sdk/tools/memory';
```

New recommended approach:
```typescript
import { createMemoryTools } from '@gaia-agent/sdk/tools/memory';

const tools = createMemoryTools('mem0', { apiKey: '...' });
// or
const tools = createMemoryTools('agentcore', { /* config */ });
```

## Technical Details

- Factory pattern for provider selection
- Adapter pattern for unified interface
- Zod schemas for validation
- Full TypeScript type safety

## References

- [Memory Tools README](../src/tools/memory/README.md)
- [REFACTORING_2025_11_11.md](./REFACTORING_2025_11_11.md)
```

## Viewing Changelog History

### All Changelogs

```bash
ls -la changelog/
```

### Latest Release

```bash
ls -t changelog/RELEASE_*.md | head -1
```

### All Features

```bash
ls changelog/FEATURE_*.md
```

### All Refactorings

```bash
ls changelog/REFACTORING_*.md
```

## Contributing

When making significant changes:

1. Create a new changelog file in this directory
2. Follow the naming convention
3. Use the format template above
4. Commit with descriptive message

```bash
# Example
cat > changelog/FEATURE_2025_11_20_streaming.md << EOF
# Streaming Support

Date: November 20, 2025
...
EOF

git add changelog/
git commit -m "docs: add streaming feature changelog"
```

## Automation

Release changelogs are automatically created by `.github/workflows/publish.yml`:

```yaml
- name: Update changelog
  run: |
    NEW_VERSION=${{ steps.bump_version.outputs.version }}
    DATE=$(date +%Y-%m-%d)
    CHANGELOG_FILE="changelog/RELEASE_${DATE}_${NEW_VERSION}.md"
    # ... creates changelog
```

Manual changelogs should be created before merging significant PRs.
