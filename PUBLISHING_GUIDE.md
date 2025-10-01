# NPM Publishing Guide for GravixLayer JavaScript SDK

## Current Issue
The GitHub Actions workflow is failing at the "Publish to npm" step because:
1. NPM authentication is not set up properly
2. The test command was trying to run Jest instead of our actual tests

## ✅ Fixes Applied
1. Updated `package.json` test script to run unit tests instead of Jest
2. Created setup verification script

## 🔧 Steps to Fix NPM Publishing

### Step 1: Login to NPM locally (for testing)
```bash
npm login
```
Enter your NPM credentials when prompted.

### Step 2: Test the package locally
```bash
# Build the package
npm run build

# Test the build
npm run test

# Test publishing (dry run)
npm publish --dry-run
```

### Step 3: Set up GitHub Actions NPM Token

1. **Get your NPM token:**
   ```bash
   npm token create --read-only=false
   ```
   Copy the token that's generated.

2. **Add the token to GitHub:**
   - Go to your GitHub repository: https://github.com/gravixlayer/gravixlayer-node
   - Go to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your NPM token
   - Click "Add secret"

### Step 4: Trigger the Release

1. **Go to GitHub Actions:**
   - Visit: https://github.com/gravixlayer/gravixlayer-node/actions
   - Click on "Manual Release and Publish" workflow
   - Click "Run workflow"
   - Choose version type (patch/minor/major)
   - Add release notes (optional)
   - Click "Run workflow"

### Step 5: Manual Publishing (Alternative)

If GitHub Actions still fails, you can publish manually:

```bash
# Make sure you're logged in
npm whoami

# Build the package
npm run build

# Bump version
npm version patch  # or minor/major

# Publish
npm publish

# Push the version tag
git push origin main --tags
```

## 🔍 Verification Commands

Run these to verify everything is set up correctly:

```bash
# Check if logged in
npm whoami

# Check package configuration
node scripts/check-npm-setup.js

# Test build
npm run build

# Test unit tests
npm run test

# Test publishing (dry run)
npm publish --dry-run
```

## 📦 Package Information

- **Package Name:** gravixlayer
- **Current Version:** 0.1.0
- **Registry:** https://registry.npmjs.org
- **Access:** Public

## 🚨 Common Issues

1. **"need auth" error:** Run `npm login`
2. **"package already exists" error:** The package name is taken, need to change it
3. **"403 Forbidden" error:** You don't have permission to publish to this package name
4. **Build files missing:** Run `npm run build` first

## ✅ Success Indicators

When everything works correctly, you should see:
- ✅ NPM login successful (`npm whoami` shows your username)
- ✅ Build successful (`dist/` folder contains all files)
- ✅ Tests pass (`npm test` completes without errors)
- ✅ Dry run successful (`npm publish --dry-run` shows what will be published)
- ✅ GitHub Actions workflow completes successfully
- ✅ Package appears on https://www.npmjs.com/package/gravixlayer

## 🎯 Next Steps

1. Follow Step 1-3 above to set up NPM authentication
2. Run the GitHub Actions workflow
3. Verify the package is published on NPM
4. Test installation: `npm install gravixlayer`