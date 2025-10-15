# Version Fix Guide for GravixLayer JavaScript SDK

## 🎯 Current Issues & Solutions

### Issue 1: NPM Version 0.1.1 Needs to be Removed
**Problem**: Version 0.1.1 exists on NPM but you want to start fresh with 0.0.2

**Solution**:
```bash
# Run the reset script
npm run reset-version
```

This script will:
- Try to unpublish 0.1.1 (if within 72 hours)
- Set version to 0.0.2
- Run tests and build
- Publish 0.0.2 to NPM
- Create git tag and push

### Issue 2: GitHub Releases Not Showing Up
**Problem**: Releases aren't appearing on GitHub releases page

**Solutions**:

#### Option A: Use GitHub CLI (Recommended)
```bash
# Install GitHub CLI if not installed
# Windows: winget install GitHub.cli
# macOS: brew install gh
# Linux: https://github.com/cli/cli/blob/trunk/docs/install_linux.md

# Authenticate
gh auth login

# Create release
npm run create-release
```

#### Option B: Use GitHub Actions Workflow
1. Go to: https://github.com/gravixlayer/gravixlayer-node/actions
2. Click "Manual Release and Publish"
3. Click "Run workflow"
4. Choose version type: patch (0.0.1 → 0.0.2)
5. Add release notes
6. Click "Run workflow"

### Issue 3: Version Management
**Current State**: Version is 0.1.2 in package.json
**Target State**: Version should be 0.0.2

## 🚀 Step-by-Step Fix Process

### Step 1: Reset Version and Publish
```bash
cd gravixlayer-js
npm run reset-version
```

### Step 2: Create GitHub Release (if not created automatically)
```bash
npm run create-release
```

### Step 3: Verify Everything Works
```bash
# Check NPM package
npm view gravixlayer

# Test installation
npm install gravixlayer@0.0.2

# Check GitHub releases
# Visit: https://github.com/gravixlayer/gravixlayer-node/releases
```

## 🔧 Manual Steps (If Scripts Fail)

### Manual NPM Unpublish (if needed)
```bash
# Only works within 72 hours of publishing
npm unpublish gravixlayer@0.1.1
```

### Manual Version Set
```bash
# Edit package.json manually
# Set "version": "0.0.2"

# Or use npm
npm version 0.0.2 --no-git-tag-version
```

### Manual Publish
```bash
npm test
npm run build
npm run test:unit
npm publish --access public
```

### Manual GitHub Release
```bash
# Create tag
git tag v0.0.2
git push origin v0.0.2

# Create release via GitHub CLI
gh release create v0.0.2 --title "Release v0.0.2" --notes "Initial release with memory system"
```

## 📋 Verification Checklist

After running the fixes:

- [ ] NPM shows gravixlayer@0.0.2: https://www.npmjs.com/package/gravixlayer
- [ ] GitHub releases shows v0.0.2: https://github.com/gravixlayer/gravixlayer-node/releases
- [ ] Can install: `npm install gravixlayer@0.0.2`
- [ ] Package.json shows version 0.0.2
- [ ] Git tag v0.0.2 exists

## 🛠️ Available Scripts

| Script         | Command                  | Description                      |
| -------------- | ------------------------ | -------------------------------- |
| Reset Version  | `npm run reset-version`  | Reset to 0.0.2 and publish       |
| Create Release | `npm run create-release` | Create GitHub release            |
| Manual Publish | `npm run publish:manual` | Manual publish with version bump |
| Patch Release  | `npm run release`        | Standard patch release           |

## 🚨 Troubleshooting

### NPM Unpublish Fails
- NPM only allows unpublish within 72 hours
- If older than 72 hours, you'll need to use a different version number
- Consider using 0.0.3 instead of 0.0.2

### GitHub CLI Not Found
```bash
# Install GitHub CLI
# Windows
winget install GitHub.cli

# macOS
brew install gh

# Then authenticate
gh auth login
```

### GitHub Actions Fails
- Check if NPM_TOKEN secret is set in repository settings
- Verify GitHub token has proper permissions
- Check workflow logs for specific errors

### Git Push Fails
```bash
# If you need to force push (be careful!)
git push origin main --force
git push origin v0.0.2 --force
```

## 🎉 Success Indicators

When everything is fixed, you should see:
1. ✅ NPM package at version 0.0.2
2. ✅ GitHub release v0.0.2 visible
3. ✅ Can install with `npm install gravixlayer@0.0.2`
4. ✅ Memory system tests pass
5. ✅ All documentation examples work

## 📞 Next Steps After Fix

1. Test the memory system: `node tests/test_mem_comprehensive.mjs`
2. Update documentation if needed
3. Announce the new version
4. Set up automated releases for future versions