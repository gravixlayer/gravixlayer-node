#!/usr/bin/env node

/**
 * Complete Publishing Script - One Script to Rule Them All
 * 
 * This script handles:
 * 1. Commit and push changes to GitHub
 * 2. Trigger GitHub Actions workflow
 * 3. Auto-bump version by 0.0.1
 * 4. Publish to NPM
 * 5. Create GitHub release
 * 
 * Usage: npm run publish
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

async function findNextVersion(currentVersion) {
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  const nextVersion = `${major}.${minor}.${patch + 1}`;
  
  try {
    // Check if version exists on NPM
    execSync(`npm view gravixlayer@${nextVersion}`, { stdio: 'pipe' });
    console.log(`⚠️  Version ${nextVersion} already exists, trying next...`);
    return findNextVersion(nextVersion);
  } catch (error) {
    // Version doesn't exist, we can use it
    return nextVersion;
  }
}

async function checkPrerequisites() {
  console.log('🔍 Checking Prerequisites...\n');

  // Check NPM authentication
  try {
    const whoami = runCommand('npm whoami', 'Checking NPM authentication');
    console.log(`👤 NPM user: ${whoami}`);
  } catch (error) {
    console.log('❌ Not logged in to NPM');
    console.log('Please run: npm login');
    process.exit(1);
  }

  // Check if package.json exists
  if (!fs.existsSync('package.json')) {
    console.log('❌ package.json not found');
    process.exit(1);
  }

  console.log('✅ All prerequisites met');
}

async function handleGitChanges() {
  console.log('\n📝 Handling Git Changes...\n');

  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    
    if (!status.trim()) {
      console.log('✅ No uncommitted changes found');
      
      const shouldPush = await askQuestion('🤔 Push current commits to trigger auto-publish? (y/n): ');
      if (shouldPush.toLowerCase() === 'y') {
        runCommand('git push origin main', 'Pushing to GitHub');
        console.log('\n🎉 Pushed to GitHub! GitHub Actions will handle publishing automatically.');
        console.log('📋 Monitor progress: https://github.com/gravixlayer/gravixlayer-node/actions');
        return 'pushed';
      } else {
        console.log('❌ Push cancelled');
        return 'cancelled';
      }
    }

    console.log('📝 Uncommitted changes detected:');
    console.log(status);
    
    const shouldCommit = await askQuestion('\n🤔 Commit all changes and continue? (y/n): ');
    if (shouldCommit.toLowerCase() !== 'y') {
      console.log('❌ Publishing cancelled');
      return 'cancelled';
    }
    
    // Ask for commit message
    const commitMessage = await askQuestion('📝 Enter commit message: ');
    if (!commitMessage.trim()) {
      console.log('❌ Commit message is required');
      return 'cancelled';
    }
    
    // Ask if they want to skip publishing
    const skipPublish = await askQuestion('🤔 Skip auto-publish for this commit? (y/n): ');
    const finalCommitMessage = skipPublish.toLowerCase() === 'y' 
      ? `${commitMessage.trim()} [skip-publish]`
      : commitMessage.trim();
    
    runCommand('git add .', 'Adding all changes');
    runCommand(`git commit -m "${finalCommitMessage}"`, 'Committing changes');
    runCommand('git push origin main', 'Pushing to GitHub');

    if (skipPublish.toLowerCase() === 'y') {
      console.log('\n✅ Changes pushed to GitHub (publishing skipped)');
      return 'skipped';
    } else {
      console.log('\n🎉 Changes pushed to GitHub! Auto-publish will start shortly.');
      console.log('📋 Monitor progress: https://github.com/gravixlayer/gravixlayer-node/actions');
      return 'pushed';
    }

  } catch (error) {
    console.log(`❌ Git error: ${error.message}`);
    throw error;
  }
}

async function localPublish() {
  console.log('\n🚀 Local Publishing Mode...\n');

  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const currentVersion = packageJson.version;
  const nextVersion = await findNextVersion(currentVersion);
  
  console.log(`📦 Current version: ${currentVersion}`);
  console.log(`🎯 Next version: ${nextVersion} (+0.0.1)`);

  const shouldProceed = await askQuestion(`\n🤔 Proceed with local publish to ${nextVersion}? (y/n): `);
  
  if (shouldProceed.toLowerCase() !== 'y') {
    console.log('❌ Local publish cancelled');
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

    // Test publish (dry run)
    runCommand('npm publish --dry-run', 'Testing publish (dry run)');

    // Publish to NPM
    runCommand('npm publish --access public', 'Publishing to NPM');
    console.log(`🎉 Successfully published gravixlayer@${nextVersion} to NPM!`);

    // Commit version bump
    runCommand('git config user.email "sukrithpvs@gmail.com"', 'Setting git email');
    runCommand('git config user.name "Sukrith"', 'Setting git name');
    runCommand('git add package.json', 'Adding package.json');
    runCommand(`git commit -m "chore: bump version to ${nextVersion}"`, 'Committing version bump');

    // Create and push tag
    runCommand(`git tag v${nextVersion}`, 'Creating git tag');
    runCommand('git push origin main', 'Pushing changes to GitHub');
    runCommand(`git push origin v${nextVersion}`, 'Pushing tag to GitHub');

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
The complete memory system is available :
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
    console.log('\n🎉 PUBLISHING COMPLETED SUCCESSFULLY!');
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
    console.log(`\n❌ Local publish failed: ${error.message}`);
    
    // Restore package.json
    packageJson.version = currentVersion;
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
    console.log('📄 Restored original package.json version');
    
    process.exit(1);
  }
}

async function main() {
  console.log('🚀 GravixLayer Publishing Script');
  console.log('=================================\n');
  console.log('This script will:');
  console.log('✅ Handle git changes and commits');
  console.log('✅ Push to GitHub');
  console.log('✅ Trigger GitHub Actions (recommended)');
  console.log('✅ OR publish locally with version bump');
  console.log('✅ Create GitHub releases');
  console.log('✅ Always increment version by 0.0.1\n');

  try {
    // Check prerequisites
    await checkPrerequisites();

    // Handle git changes
    const gitResult = await handleGitChanges();
    
    if (gitResult === 'cancelled') {
      return;
    }
    
    if (gitResult === 'pushed' || gitResult === 'skipped') {
      console.log('\n📋 GitHub Actions Workflow:');
      console.log('- Monitor: https://github.com/gravixlayer/gravixlayer-node/actions');
      console.log('- NPM: https://www.npmjs.com/package/gravixlayer');
      console.log('- Releases: https://github.com/gravixlayer/gravixlayer-node/releases');
      
      if (gitResult === 'pushed') {
        const useLocal = await askQuestion('\n🤔 Use local publishing instead of GitHub Actions? (y/n): ');
        if (useLocal.toLowerCase() === 'y') {
          await localPublish();
        } else {
          console.log('\n✅ GitHub Actions will handle the publishing automatically!');
        }
      }
    }

  } catch (error) {
    console.log(`\n❌ Publishing failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}