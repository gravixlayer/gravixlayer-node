# 🚀 Simple Publishing Guide

## One Command to Rule Them All

```bash
npm run publish
```

That's it! This single command handles everything:

## ✅ What It Does

1. **Checks Prerequisites**
   - Verifies NPM authentication
   - Validates project structure

2. **Handles Git Changes**
   - Commits any uncommitted changes
   - Pushes to GitHub
   - Option to skip publishing

3. **Auto-Publishes**
   - **GitHub Actions** (recommended): Automatic publishing
   - **Local Publishing** (backup): Direct NPM publish

4. **Version Management**
   - Always bumps by **0.0.1** (patch version)
   - Finds next available version automatically
   - Updates package.json

5. **Creates Releases**
   - GitHub release with notes
   - NPM package publication
   - Git tags

## 🎯 Your Workflow

### Daily Development
```bash
# Make your changes
# ... edit files ...

# Publish everything
npm run publish
```

### What Happens
1. **Interactive prompts** guide you through the process
2. **Commits changes** with your message
3. **Pushes to GitHub** 
4. **GitHub Actions** automatically:
   - Runs tests
   - Builds project
   - Bumps version (+0.0.1)
   - Publishes to NPM
   - Creates GitHub release

## 📊 Version Progression

- Current: 0.0.6
- Next run: 0.0.7
- After that: 0.0.8, 0.0.9, 0.0.10...

## 🔍 Monitor Progress

- **GitHub Actions**: https://github.com/gravixlayer/gravixlayer-node/actions
- **NPM Package**: https://www.npmjs.com/package/gravixlayer
- **GitHub Releases**: https://github.com/gravixlayer/gravixlayer-node/releases

## 🎛️ Options

### Skip Publishing
Add `[skip-publish]` to your commit message when prompted.

### Local Publishing
Choose "local publishing" when prompted for direct NPM publish.

### GitHub Actions (Default)
Recommended approach - fully automated and tested.

## 🚨 Prerequisites

1. **NPM Login**: `npm login` (one-time setup)
2. **GitHub CLI** (optional): `winget install GitHub.cli` + `gh auth login`

## 🎉 Benefits

- **One command** for everything
- **Always tested** before publishing
- **Automatic versioning** (+0.0.1)
- **GitHub Actions** integration
- **Error recovery** built-in
- **Interactive guidance**

---

## 🚀 Ready to Publish?

```bash
npm run publish
```

**That's all you need!** The script handles the rest automatically. 🎉