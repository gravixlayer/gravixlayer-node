#!/usr/bin/env node

/**
 * Complete publish script that handles NPM publishing and GitHub releases
 */

const { execSync } = require('child_process');
const fs = require('fs');
const readline = require('readline');

function runCommand(command, description, ignoreError = false) {
  console.log(`\n🔄 ${description}...`);
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${description} - SUCCESS`);
    return output.trim();
  } catch (error) {
    if (ignoreError) {
      console.log(`⚠️  ${description} - WARNING: ${error.message}`);
      return null;
    } else {
      console.log(`❌ ${description} - FAILED`);
      console.log(`Error: ${error.message}`);
      throw error;
    }
  }
}

async function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function findNextAvailableVersion(currentVersion) {
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  
  for (let testPatch = patch + 1; testPatch <= patch + 10; testPatch++) {
    const testVersion = `${major}.${minor}.${testPatch}`;
    
    try {
      // Check if version exists on NPM
      execSync(`npm view gravixlayer@${testVersion}`, { stdio: 'pipe' });
      console.log(`⚠️  Version ${testVersion} already exists on NPM`);
    } catch (error) {
      // Version doesn't exist, we can use it
      console.log(`✅ Found available version: ${testVersion}`);
      return testVersion;
    }
  }
  
  throw new Error('Could not find available version in range');
}

async function main() {
  console.log('🚀 Complete Publish & Release Script');
  console.log('====================================\n');

  // Check NPM authentication
  const whoami = runCommand('npm whoami', 'Checking NPM authentication');
  console.log(`👤 NPM user: ${whoami}`);

  // Check GitHub CLI
  const ghCheck = runCommand('gh --version', 'Checking GitHub CLI', true);
  if (!ghCheck) {
    console.log('\n⚠️  GitHub CLI not found. Install it for automatic GitHub releases:');
    console.log('- Windows: winget install GitHub.cli');
    console.log('- macOS: brew install gh');
    console.log('- Then run: gh auth login\n');
  }

  // Get current version
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const currentVersion = packageJson.version;
  console.log(`📦 Current version: ${currentVersion}`);

  // Find next available version
  const nextVersion = await findNextAvailableVersion(currentVersion);
  console.log(`🎯 Target version: ${nextVersion}`);

  // Ask for confirmation
  const shouldProceed = await askQuestion(`\n🤔 Proceed with publishing gravixlayer@${nextVersion}? (y/n): `);
  
  if (shouldProceed.toLowerCase() !== 'y') {
    console.log('❌ Publishing cancelled');
    return;
  }

  try {
    // Update version in package.json
    packageJson.version = nextVersion;
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`✅ Updated package.json to version ${nextVersion}`);

    // Run tests
    runCommand('npm test', 'Running pre-build tests');

    // Build project
    runCommand('npm run build', 'Building project');

    // Run post-build tests
    runCommand('npm run test:unit', 'Running post-build tests');

    // Test publish (dry run)
    runCommand('npm publish --dry-run', 'Testing publish (dry run)');

    // Publish to NPM
    runCommand('npm publish --access public', 'Publishing to NPM');
    console.log(`🎉 Successfully published gravixlayer@${nextVersion} to NPM!`);

    // Create git tag
    runCommand('git add package.json', 'Adding package.json to git');
    runCommand(`git commit -m "chore: bump version to ${nextVersion}"`, 'Committing version bump');
    runCommand(`git tag v${nextVersion}`, 'Creating git tag');
    runCommand('git push origin main', 'Pushing to main branch');
    runCommand(`git push origin v${nextVersion}`, 'Pushing tag to GitHub');

    // Create GitHub release if GitHub CLI is available
    if (ghCheck) {
      try {
        const authCheck = runCommand('gh auth status', 'Checking GitHub authentication', true);
        if (authCheck) {
          // Ask for release notes
          console.log('\n📝 Creating GitHub Release...');
          const releaseNotes = await askQuestion('Enter release notes (or press Enter for default): ');
          
          const finalNotes = releaseNotes.trim() || `Release v${nextVersion}

## What's New
- Updated JavaScript SDK with full memory system support
- Fixed all memory operations (add, search, update, delete, list)
- Enhanced error handling and performance improvements
- Complete Mem0 API compatibility

## Memory System Features
✅ Add Memory (Simple & Conversation with AI inference)
✅ Search Memory (Semantic search with relevance scores)
✅ Update Memory (Content updates with re-embedding)
✅ Delete Memory (Individual and batch operations)
✅ List Memory (Get all memories for a user)
✅ Memory Statistics (Analytics and insights)
✅ Advanced Methods (Type filtering, cleanup, sorting)

## Installation
\`\`\`bash
npm install gravixlayer@${nextVersion}
\`\`\`

## Quick Start
\`\`\`javascript
import { GravixLayer } from 'gravixlayer';

const client = new GravixLayer({apiKey: 'your-api-key'});
const memory = client.memory;

// Add a memory
const result = await memory.add({
    messages: "I love Italian food",
    user_id: "alice"
});
\`\`\`

## Documentation
- [Memory System](https://docs.gravixlayer.com/memory)
- [JavaScript SDK](https://docs.gravixlayer.com/sdks/javascript)`;

          const releaseCommand = `gh release create v${nextVersion} --title "Release v${nextVersion}" --notes "${finalNotes.replace(/"/g, '\\"')}" --latest`;
          runCommand(releaseCommand, 'Creating GitHub release');
          
          console.log(`🎉 GitHub release created successfully!`);
        } else {
          console.log('⚠️  GitHub CLI not authenticated. Run: gh auth login');
        }
      } catch (error) {
        console.log('⚠️  Could not create GitHub release automatically');
        console.log('You can create it manually at: https://github.com/gravixlayer/gravixlayer-node/releases/new');
      }
    }

    // Success summary
    console.log('\n🎉 Publishing completed successfully!');
    console.log('=====================================');
    console.log(`📦 NPM Package: gravixlayer@${nextVersion}`);
    console.log(`🔗 NPM URL: https://www.npmjs.com/package/gravixlayer`);
    console.log(`🏷️  GitHub Tag: v${nextVersion}`);
    console.log(`📋 GitHub Releases: https://github.com/gravixlayer/gravixlayer-node/releases`);
    
    console.log('\n📋 Verification Steps:');
    console.log(`1. Check NPM: npm view gravixlayer@${nextVersion}`);
    console.log(`2. Test install: npm install gravixlayer@${nextVersion}`);
    console.log('3. Check GitHub releases page');
    console.log('4. Test memory system functionality');

  } catch (error) {
    console.log(`\n❌ Publishing failed: ${error.message}`);
    
    // Restore package.json
    packageJson.version = currentVersion;
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
    console.log('📄 Restored original package.json version');
    
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}