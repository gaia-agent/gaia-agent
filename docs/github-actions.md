# GitHub Actions

This directory contains automated workflows for the gaia-agent project.

## Workflows

### `benchmark.yml` - GAIA Benchmark Runner

**Trigger:** Manual dispatch (workflow_dispatch)

**What it does:**
1. ✅ Runs GAIA benchmarks with configurable options
2. 📊 Supports different models, providers, and filters
3. 💾 Saves results as artifacts
4. 📝 Creates summary in GitHub Actions

**Configuration Options:**

| Option | Description | Default | Values |
|--------|-------------|---------|--------|
| **model** | OpenAI model to use | `gpt-4o` | `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-3.5-turbo` |
| **dataset** | GAIA dataset to test | `validation` | `validation`, `test` |
| **level** | Difficulty level filter | `all` | `1`, `2`, `3`, or empty for all |
| **category** | Task category filter | `all` | `files`, `code`, `search`, `browser`, `reasoning`, or empty for all |
| **search_provider** | Search tool provider | `tavily` | `tavily`, `exa` |
| **sandbox_provider** | Code execution provider | `e2b` | `e2b`, `sandock` |
| **limit** | Max number of tasks | `none` | Any number, or empty for all |
| **verbose** | Detailed output | `false` | `true`, `false` |

**How to run:**
1. Go to GitHub repository → **Actions** tab
2. Select **GAIA Benchmark** workflow
3. Click **Run workflow** button
4. Configure options and run

**Example Configurations:**

1. **Quick Test (5 Level 1 Tasks)**
   ```
   Model: gpt-4o-mini
   Level: 1
   Limit: 5
   Verbose: true
   ```

2. **Compare Search Providers**
   ```
   # Run 1: Tavily
   Category: search
   Search Provider: tavily
   
   # Run 2: Exa
   Category: search
   Search Provider: exa
   ```

3. **Test Specific Capability**
   ```
   Category: code
   Sandbox Provider: e2b
   Limit: 10
   ```

**Required Secrets:**
- `OPENAI_API_KEY` - OpenAI API key
- `HUGGINGFACE_TOKEN` - Hugging Face token
- Provider API keys: `TAVILY_API_KEY`, `EXA_API_KEY`, `E2B_API_KEY`, `SANDOCK_API_KEY`

**Outputs:**
- Benchmark results JSON files (downloadable as artifacts)
- GitHub Actions summary with configuration and metadata

---

### `publish.yml` - Automatic NPM Publishing

**Trigger:** When code is pushed to `main` branch

**What it does:**
1. ✅ Runs tests (`pnpm test`)
2. ✅ Builds the project (`pnpm build`)
3. ✅ Type checks (`pnpm typecheck`)
4. 📦 Bumps patch version automatically
5. 📝 Creates changelog entry in `changelog/RELEASE_[date]_[version].md`
6. 💾 Commits version bump to repository
7. 🚀 Publishes to NPM registry
8. 🏷️ Creates Git tag with version number

**Version Strategy:**
- Automatically increments **patch** version (e.g., 0.1.0 → 0.1.1)
- For **minor** or **major** versions, manually update `package.json` before merging to `main`

**Example Flow:**
```
1. Merge PR to main
2. Action triggers automatically
3. Version: 0.1.5 → 0.1.6
4. Changelog created: changelog/RELEASE_2025-11-11_v0.1.6.md
5. Commit pushed: "chore: bump version to v0.1.6 [skip ci]"
6. Published to npm: gaia-agent@0.1.6
7. Git tag created: v0.1.6
```

## Setup Requirements

### 1. NPM Token

Create an NPM access token and add it to GitHub Secrets:

1. Go to [npmjs.com/settings/tokens](https://www.npmjs.com/settings/your-account/tokens)
2. Click "Generate New Token" → "Classic Token"
3. Select **Automation** type
4. Copy the token
5. Go to your GitHub repo → Settings → Secrets and variables → Actions
6. Click "New repository secret"
7. Name: `NPM_TOKEN`
8. Value: [paste your token]

### 2. GitHub Token

The workflow uses `GITHUB_TOKEN` (automatically provided by GitHub Actions).

No additional setup needed for pushing commits and tags.

## Skip CI

To prevent infinite loops, commits made by the action include `[skip ci]`:

```
chore: bump version to v0.1.6 [skip ci]
```

This tells GitHub Actions not to trigger the workflow again.

## Manual Version Bumps

### Minor Version (0.1.0 → 0.2.0)

```bash
npm version minor --no-git-tag-version
git add package.json
git commit -m "chore: bump minor version to 0.2.0"
git push origin main
```

### Major Version (0.1.0 → 1.0.0)

```bash
npm version major --no-git-tag-version
git add package.json
git commit -m "chore: bump major version to 1.0.0"
git push origin main
```

After pushing, the action will:
- ✅ Run tests and build
- 📝 Create changelog
- 🚀 Publish to NPM
- 🏷️ Create Git tag

## Changelog Files

Changelogs are automatically created in `changelog/` folder:

```
changelog/
├── RELEASE_2025-11-11_v0.1.0.md
├── RELEASE_2025-11-11_v0.1.1.md
├── RELEASE_2025-11-12_v0.1.2.md
└── REFACTORING_2025_11_11.md  (manual)
```

**Automatic changelog format:**
```markdown
# Release v0.1.6

Date: 2025-11-11

## Changes

Auto-released from main branch.

## Commits

[last 10 commits]

## Build Info

- Node: v20.x.x
- NPM: 10.x.x
- pnpm: 9.x.x
```

## Troubleshooting

### Action fails at "Publish to NPM"

**Cause:** Invalid or expired NPM_TOKEN

**Fix:**
1. Generate new token on npmjs.com
2. Update GitHub Secret `NPM_TOKEN`

### Action fails at "Commit version bump"

**Cause:** Permissions issue

**Fix:**
1. Check repository Settings → Actions → General
2. Ensure "Read and write permissions" is enabled
3. Save and re-run workflow

### Version conflict

**Cause:** Version already exists on NPM

**Fix:**
```bash
# Manually bump to next available version
npm version patch --no-git-tag-version
git add package.json
git commit -m "chore: fix version conflict"
git push
```

## Best Practices

1. **Always merge to main via Pull Requests**
   - Ensures code review before publish
   - Allows tests to run first

2. **Use semantic versioning**
   - Patch (0.0.x): Bug fixes, small changes
   - Minor (0.x.0): New features, backward compatible
   - Major (x.0.0): Breaking changes

3. **Manual changelogs for major changes**
   - Create `changelog/FEATURE_[date]_[name].md` for big updates
   - Auto-generated changelogs are basic - enhance manually if needed

4. **Monitor NPM releases**
   - Check [npmjs.com/package/gaia-agent](https://www.npmjs.com/package/gaia-agent)
   - Verify published version matches expected

## Disable Auto-Publishing

To temporarily disable auto-publishing:

1. Go to repo → Actions
2. Find "Publish to NPM" workflow
3. Click "..." → "Disable workflow"

Or add this to workflow file:
```yaml
if: false  # Temporarily disabled
```
