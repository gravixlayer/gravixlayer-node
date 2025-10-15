#!/usr/bin/env node

/**
 * Simple script: Commit changes and push to GitHub
 * GitHub Actions will handle the rest automatically
 */

const { execSync } = require('child_process');
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

async function main() {
  console.log('🚀 Push & Auto-Publish via GitHub Actions');
  console.log('==========================================\n');

  // Check if there are uncommitted changes
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (!status.trim()) {
      console.log('✅ No uncommitted changes found');
      
      const shouldPush = await askQuestion('🤔 Push current commits to trigger auto-publish? (y/n): ');
      if (shouldPush.toLowerCase() === 'y') {
        runCommand('git push origin main', 'Pushing to GitHub');
        console.log('\n🎉 Pushed to GitHub! GitHub Actions will handle publishing automatically.');
        console.log('📋 Monitor progress: https://github.com/gravixlayer/gravixlayer-node/actions');
        return;
      } else {
        console.log('❌ Push cancelled');
        return;
      }
    }

    console.log('📝 Uncommitted changes detected:');
    console.log(status);
    
    const shouldCommit = await askQuestion('\n🤔 Commit all changes and push for auto-publish? (y/n): ');
    if (shouldCommit.toLowerCase() !== 'y') {
      console.log('❌ Push cancelled');
      return;
    }
    
    // Ask for commit message
    const commitMessage = await askQuestion('📝 Enter commit message: ');
    if (!commitMessage.trim()) {
      console.log('❌ Commit message is required');
      return;
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
    } else {
      console.log('\n🎉 Changes pushed to GitHub! Auto-publish will start shortly.');
      console.log('📋 Monitor progress: https://github.com/gravixlayer/gravixlayer-node/actions');
      console.log('📦 NPM releases: https://www.npmjs.com/package/gravixlayer');
      console.log('🏷️  GitHub releases: https://github.com/gravixlayer/gravixlayer-node/releases');
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}