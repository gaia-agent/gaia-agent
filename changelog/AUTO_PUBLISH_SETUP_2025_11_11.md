# Setup Complete: Auto NPM Publishing

Date: November 11, 2025

## Summary

Successfully configured automated NPM publishing with changelog management.

## What Was Added

### 1. GitHub Actions Workflow

**File:** `.github/workflows/publish.yml`

**Triggers:** When code is pushed to `main` branch

**Process:**
1. ✅ Checkout code
2. ✅ Setup pnpm + Node.js
3. ✅ Install dependencies
4. ✅ Run tests (`pnpm test`)
5. ✅ Build project (`pnpm build`)
6. ✅ Type check (`pnpm typecheck`)
7. 📦 Bump patch version (0.1.0 → 0.1.1)
8. 📝 Create changelog in `changelog/RELEASE_[date]_[version].md`
9. 💾 Commit version bump with `[skip ci]`
10. 🚀 Publish to NPM registry
11. 🏷️ Create Git tag with version

### 2. Documentation

**Files created:**
- `.github/workflows/README.md` - Workflow documentation
- `changelog/README.md` - Changelog guidelines
- `NPM_PUBLISH_SETUP.md` - Complete setup guide

**Files updated:**
- `README.md` - Added Contributing section
- `.github/copilot-instructions.md` - Added changelog info, testing, benchmark modules

### 3. Changelog System

**Location:** `changelog/` folder

**Types of changelogs:**
- `RELEASE_[date]_[version].md` - Auto-generated on publish
- `FEATURE_[date]_[name].md` - Manual for new features
- `REFACTORING_[date].md` - Manual for refactorings
- `BUGFIX_[date]_[name].md` - Manual for important fixes
- `BREAKING_[date]_[name].md` - Manual for breaking changes

## Setup Required

### NPM Token (Required before first publish)

1. Go to https://www.npmjs.com/settings/tokens
2. Generate new "Automation" token
3. Add to GitHub Secrets as `NPM_TOKEN`

**Steps:**
```bash
# 1. Create token on npmjs.com
# 2. Go to repo settings
https://github.com/vikadata/gaia-agent/settings/secrets/actions

# 3. Add secret
Name: NPM_TOKEN
Value: [your npm token]
```

### GitHub Permissions (Required)

1. Go to repo Settings → Actions → General
2. Under "Workflow permissions":
   - ✅ Select "Read and write permissions"
   - ✅ Check "Allow GitHub Actions to create and approve pull requests"
3. Save

## How to Use

### Regular Workflow (Automatic)

```bash
# 1. Create feature branch
git checkout -b feat/my-feature

# 2. Make changes
# ... edit files ...
git commit -m "feat: add new feature"
git push origin feat/my-feature

# 3. Create PR and merge to main
# GitHub Actions will automatically:
# - Run tests
# - Version: 0.1.0 → 0.1.1
# - Create: changelog/RELEASE_2025-11-11_v0.1.1.md
# - Publish to npm
# - Create tag: v0.1.1
```

### Manual Version Bump (Minor/Major)

```bash
# For minor version (new features)
npm version minor --no-git-tag-version  # 0.1.5 → 0.2.0
git add package.json
git commit -m "chore: bump minor version to 0.2.0"
git push origin main
# Action publishes 0.2.0

# For major version (breaking changes)
npm version major --no-git-tag-version  # 0.5.0 → 1.0.0
git add package.json
git commit -m "chore: release v1.0.0 - BREAKING CHANGES"
git push origin main
# Action publishes 1.0.0
```

### Manual Changelog for Features

```bash
# Create detailed changelog
cat > changelog/FEATURE_2025_11_15_new_provider.md << EOF
# New Provider Support

Date: November 15, 2025

## Overview
Added support for XYZ provider...

## Changes
- New provider integration
- Updated factory pattern
- Added tests

## Usage
\`\`\`typescript
const tools = createTools('xyz', { apiKey: '...' });
\`\`\`
EOF

git add changelog/
git commit -m "docs: add XYZ provider changelog"
git push
```

## Verification

### Check Workflow Status

After merging to main:

1. Go to https://github.com/vikadata/gaia-agent/actions
2. Find "Publish to NPM" workflow
3. Verify all steps pass ✅

### Check NPM Package

```bash
# View latest version
npm view gaia-agent version

# Install and test
npm install gaia-agent@latest
```

### Check Git Tags

```bash
git fetch --tags
git tag -l --sort=-v:refname
```

## Troubleshooting

### Issue: Workflow doesn't run

**Solution:**
1. Check `.github/workflows/publish.yml` exists
2. Verify branch is `main` (not `master`)
3. Check workflow isn't disabled in Actions tab

### Issue: Publish fails (403 Forbidden)

**Solution:**
1. Verify `NPM_TOKEN` is set in GitHub Secrets
2. Check token hasn't expired
3. Verify you're the package owner on npmjs.com

### Issue: Version conflict

**Solution:**
```bash
# Check current NPM version
npm view gaia-agent version

# Manually set next version
npm version patch --no-git-tag-version
git add package.json
git commit -m "chore: fix version conflict"
git push
```

### Issue: Tests fail in workflow

**Solution:**
```bash
# Run tests locally first
pnpm test
pnpm build
pnpm typecheck

# Fix issues before merging
```

## Files Overview

```
gaia-agent/
├── .github/
│   ├── copilot-instructions.md      (updated with changelog info)
│   └── workflows/
│       ├── publish.yml               (NEW: auto-publish workflow)
│       └── README.md                 (NEW: workflow docs)
├── changelog/
│   ├── README.md                     (NEW: changelog guidelines)
│   └── REFACTORING_2025_11_11.md    (existing)
├── NPM_PUBLISH_SETUP.md              (NEW: setup guide)
└── README.md                         (updated: Contributing section)
```

## Next Steps

1. **Add NPM_TOKEN to GitHub Secrets** (required)
2. **Enable write permissions for Actions** (required)
3. **Test workflow** by merging a small PR to main
4. **Monitor first publish** in Actions tab
5. **Verify package** on npmjs.com

## Best Practices

### Before Merging

- ✅ Run tests locally: `pnpm test`
- ✅ Build successfully: `pnpm build`
- ✅ No type errors: `pnpm typecheck`
- ✅ Code formatted: `pnpm check`

### For Breaking Changes

1. Bump major version manually before merging
2. Create `changelog/BREAKING_[date]_[description].md`
3. Update migration guide in README
4. Announce to users

### For New Features

1. Let workflow auto-bump patch version
2. Create `changelog/FEATURE_[date]_[name].md`
3. Update documentation
4. Add tests

## Security Notes

- ✅ NPM_TOKEN stored encrypted in GitHub Secrets
- ✅ Token type: "Automation" (limited permissions)
- ✅ Workflow runs in isolated environment
- ✅ No secrets exposed in logs
- ⚠️ Rotate token every 90 days

## Monitoring

### After Each Publish

1. Check GitHub Actions for success ✅
2. Verify version on npmjs.com
3. Test installation: `npm install gaia-agent@latest`
4. Check changelog file created

### Regular Maintenance

- Review changelogs monthly
- Archive old release changelogs (optional)
- Rotate NPM_TOKEN every 90 days
- Monitor download stats on npmjs.com

## Support

For issues:
- Workflow problems: Check `.github/workflows/README.md`
- Setup help: See `NPM_PUBLISH_SETUP.md`
- Changelog questions: See `changelog/README.md`
- General: Open GitHub issue

---

**Status:** ✅ Setup complete, ready to use
**Next:** Add NPM_TOKEN to GitHub Secrets and test!
