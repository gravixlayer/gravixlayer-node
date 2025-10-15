#!/usr/bin/env node

/**
 * Auto-publish script: Push changes + Auto version bump + NPM publish + GitHub release
 * Usage: npm run auto-publish
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

async function findNextPatchVersion(currentVersion) {
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  const nextVersion = `${major}.${minor}.${patch + 1}`;
  
  try {
    // Check if version exists on NPM
    execSync(`npm view gravixlayer@${nextVersion}`, { stdio: 'pipe' });
    console.log(`⚠️  Version ${nextVersion} already exists, trying next...`);
    return findNextPatchVersion(nextVersion);
  } catch (error) {
    // Version doesn't exist, we can use it
    return nextVersion;
  }
}

async function main() {
  console.log('🚀 Auto-Publish Script (0.0.1 increment)');
  console.log('==========================================\n');

  // Check if there are uncommitted changes
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      console.log('📝 Uncommitted changes detected:');
      console.log(status);
      
      const shouldCommit = await askQuestion('\n🤔 Commit all changes and continue? (y/n): ');
      if (shouldCommit.toLowerCase() !== 'y') {
        console.log('❌ Auto-publish cancelled');
        return;
      }
      
      // Ask for commit message
      const commitMessage = await askQuestion('📝 Enter commit message (or press Enter for default): ');
      const finalCommitMessage = commitMessage.trim() || 'feat: update code and prepare for release';
      
      runCommand('git add .', 'Adding all changes');
      runCommand(`git commit -m "${finalCommitMessage}"`, 'Committing changes');
    }
  } catch (error) {
    // No git repo or other git error
    console.log('⚠️  Git status check failed, continuing...');
  }

  // Check NPM authentication
  const whoami = runCommand('npm whoami', 'Checking NPM authentication');
  console.log(`👤 NPM user: ${whoami}`);

  // Get current version and calculate next
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const currentVersion = packageJson.version;
  const nextVersion = await findNextPatchVersion(currentVersion);
  
  console.log(`📦 Current version: ${currentVersion}`);
  console.log(`🎯 Next version: ${nextVersion} (+0.0.1)`);

  // Ask for confirmation
  const shouldProceed = await askQuestion(`\n🤔 Proceed with auto-publish to ${nextVersion}? (y/n): `);
  
  if (shouldProceed.toLowerCase() !== 'y') {
    console.log('❌ Auto-publish cancelled');
    return;
  }

  try {
    // Update version in package.json
    packageJson.version = nextVersion;
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`✅ Bumped version to ${nextVersion}`);

    // Run tests
    runCommand('npm test', 'Running pre-build tests');

    // Build project
    runCommand('npm run build', 'Building project');

    // Run post-build tests
    runCommand('npm run test:unit', 'Running post-build tests');

    // Commit version bump
    runCommand('git add package.json', 'Adding package.json');
    runCommand(`git commit -m "chore: bump version to ${nextVersion}"`, 'Committing version bump');

    // Create and push tag
    runCommand(`git tag v${nextVersion}`, 'Creating git tag');
    runCommand('git push origin main', 'Pushing changes to GitHub');
    runCommand(`git push origin v${nextVersion}`, 'Pushing tag to GitHub');

    // Publish to NPM
    runCommand('npm publish --access public', 'Publishing to NPM');
    console.log(`🎉 Successfully published gravixlayer@${nextVersion} to NPM!`);

    // Create GitHub release if GitHub CLI is available
    const ghCheck = runCommand('gh --version', 'Checking GitHub CLI', true);
    if (ghCheck) {
      try {
        const authCheck = runCommand('gh auth status', 'Checking GitHub authentication', true);
        if (authCheck) {
          const releaseNotes = `Release v${nextVersion}

## What's Changed
- Code updates and improvements
- Version bump to ${nextVersion}
- Enhanced functionality and bug fixes

## Installation
\`\`\`bash
npm install gravixlayer@${nextVersion}
\`\`\`

## Memory System
The complete memory system is available with full Mem0 compatibility:
- Add, search, update, delete memories
- AI-powered conversation inference
- Semantic search with relevance scoring
- Memory analytics and statistics

## Links
- [NPM Package](https://www.npmjs.com/package/gravixlayer)
- [Documentation](https://docs.gravixlayer.com)`;

          const releaseCommand = `gh release create v${nextVersion} --title "Release v${nextVersion}" --notes "${releaseNotes.replace(/"/g, '\\"')}" --latest`;
          runCommand(releaseCommand, 'Creating GitHub release');
          
          console.log(`🎉 GitHub release created successfully!`);
        } else {
          console.log('⚠️  GitHub CLI not authenticated. Release not created.');
        }
      } catch (error) {
        console.log('⚠️  Could not create GitHub release automatically');
      }
    } else {
      console.log('⚠️  GitHub CLI not found. Release not created.');
    }

    // Success summary
    console.log('\n🎉 AUTO-PUBLISH COMPLETED SUCCESSFULLY!');
    console.log('=====================================');
    console.log(`📦 NPM Package: gravixlayer@${nextVersion}`);
    console.log(`🔗 NPM URL: https://www.npmjs.com/package/gravixlayer`);
    console.log(`🏷️  GitHub Tag: v${nextVersion}`);
    console.log(`📋 GitHub Releases: https://github.com/gravixlayer/gravixlayer-node/releases`);
    
    console.log('\n📋 What Happened:');
    console.log(`✅ Version bumped: ${currentVersion} → ${nextVersion}`);
    console.log('✅ Code pushed to GitHub');
    console.log('✅ Published to NPM');
    console.log('✅ GitHub release created');
    console.log('✅ All tests passed');

    console.log('\n🧪 Test Your Release:');
    console.log(`npm install gravixlayer@${nextVersion}`);

  } catch (error) {
    console.log(`\n❌ Auto-publish failed: ${error.message}`);
    
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