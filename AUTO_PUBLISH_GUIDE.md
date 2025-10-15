# 🚀 Auto-Publish Guide

## 🎯 **Two Ways to Auto-Publish**

### **Option 1: GitHub Actions (Automatic) - RECOMMENDED**

**How it works:**
1. You make changes to your code
2. Push to GitHub (`git push`)
3. GitHub Actions automatically:
   - Runs tests
   - Builds project
   - Bumps version by 0.0.1
   - Publishes to NPM
   - Creates GitHub release

**Usage:**
```bash
# Make your changes
git add .
git commit -m "feat: add new feature"
git push

# That's it! GitHub Actions will handle the rest automatically
```

**To skip auto-publish for a specific commit:**
```bash
git commit -m "docs: update README [skip-publish]"
git push
```

### **Option 2: Local Script (Manual)**

**Usage:**
```bash
npm run auto-publish
```

**What it does:**
1. Checks for uncommitted changes (commits them if needed)
2. Runs all tests
3. Builds project
4. Bumps version by 0.0.1
5. Pushes to GitHub
6. Publishes to NPM
7. Creates GitHub release

## 📋 **Step-by-Step Workflow**

### **Daily Development Workflow:**

1. **Make Changes:**
   ```bash
   # Edit your code files
   # Add new features, fix bugs, etc.
   ```

2. **Push Changes:**
   ```bash
   git add .
   git commit -m "feat: your changes description"
   git push
   ```

3. **Auto-Magic Happens:**
   - GitHub Actions triggers automatically
   - Version bumps from 0.0.4 → 0.0.5
   - NPM package published
   - GitHub release created
   - All done! 🎉

### **Alternative - Local Publishing:**

```bash
# If you prefer to publish locally
npm run auto-publish
```

## 🔧 **Setup Requirements**

### **For GitHub Actions (Option 1):**
✅ NPM_TOKEN secret is already configured
✅ GitHub Actions workflow is set up
✅ Ready to use!

### **For Local Script (Option 2):**
```bash
# Install GitHub CLI (optional, for releases)
winget install GitHub.cli
gh auth login

# Make sure you're logged into NPM
npm login
```

## 📊 **Version Progression**

Your versions will automatically increment:
- Current: 0.0.4
- Next push: 0.0.5
- After that: 0.0.6
- And so on: 0.0.7, 0.0.8, 0.0.9, 0.0.10...

## 🎯 **Examples**

### **Example 1: Add New Feature**
```bash
# You add a new memory feature
git add .
git commit -m "feat: add memory batch operations"
git push

# Result: gravixlayer@0.0.5 published automatically
```

### **Example 2: Fix Bug**
```bash
# You fix a bug
git add .
git commit -m "fix: resolve memory search issue"
git push

# Result: gravixlayer@0.0.6 published automatically
```

### **Example 3: Update Docs (Skip Publish)**
```bash
# You update documentation only
git add .
git commit -m "docs: update API documentation [skip-publish]"
git push

# Result: No new version published (skipped)
```

## 🚨 **Important Notes**

1. **Auto-increment**: Always bumps by 0.0.1 (patch version)
2. **Skip publishing**: Add `[skip-publish]` to commit message
3. **Tests must pass**: Publishing fails if tests fail
4. **NPM conflicts**: Script automatically finds next available version

## 🔍 **Monitoring**

### **Check GitHub Actions:**
- Go to: https://github.com/gravixlayer/gravixlayer-node/actions
- See real-time progress of auto-publishing

### **Check Results:**
- **NPM**: https://www.npmjs.com/package/gravixlayer
- **Releases**: https://github.com/gravixlayer/gravixlayer-node/releases

## 🎉 **Benefits**

✅ **Zero manual work** - Just push your code
✅ **Always tested** - Won't publish if tests fail  
✅ **Consistent versioning** - Always +0.0.1
✅ **Complete automation** - NPM + GitHub releases
✅ **Safe publishing** - Checks for conflicts
✅ **Skip option** - Use `[skip-publish]` when needed

## 🛠️ **Troubleshooting**

### **GitHub Actions Failed:**
1. Check: https://github.com/gravixlayer/gravixlayer-node/actions
2. Look at the error logs
3. Common issues: NPM_TOKEN expired, tests failed

### **Local Script Failed:**
```bash
# Check NPM login
npm whoami

# Check GitHub CLI
gh auth status

# Re-run with debug
npm run auto-publish
```

### **Version Conflicts:**
The script automatically finds the next available version, so this shouldn't happen.

---

## 🚀 **Ready to Use!**

**Your new workflow:**
1. Make changes
2. `git push`
3. Done! ✨

Everything else happens automatically. Welcome to effortless publishing! 🎉