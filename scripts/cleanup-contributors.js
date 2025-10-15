#!/usr/bin/env node

/**
 * Script to clean up git history and remove actions-user commits
 * This will rewrite history to show only your commits
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
  console.log('🧹 Git History Cleanup - Remove Actions User');
  console.log('=============================================\n');

  console.log('⚠️  WARNING: This will rewrite git history!');
  console.log('This will remove all commits made by "GitHub Action" or "actions-user"');
  console.log('and ensure only your commits appear in the contributor list.\n');

  const shouldProceed = await askQuestion('🤔 Do you want to proceed with history cleanup? (y/n): ');
  
  if (shouldProceed.toLowerCase() !== 'y') {
    console.log('❌ Cleanup cancelled');
    return;
  }

  try {
    // Check current contributors
    console.log('\n📋 Current contributors:');
    runCommand('git shortlog -sn', 'Listing current contributors');

    // Create a backup branch
    runCommand('git branch backup-before-cleanup', 'Creating backup branch', true);

    // Filter out commits by actions-user and GitHub Action
    console.log('\n🔄 Rewriting git history to remove actions-user commits...');
    
    const filterCommand = `git filter-branch --env-filter '
      if [ "$GIT_AUTHOR_EMAIL" = "action@github.com" ] || [ "$GIT_AUTHOR_NAME" = "GitHub Action" ] || [ "$GIT_AUTHOR_NAME" = "actions-user" ]; then
        export GIT_AUTHOR_NAME="Sukrith"
        export GIT_AUTHOR_EMAIL="sukrithpvs@gmail.com"
        export GIT_COMMITTER_NAME="Sukrith"
        export GIT_COMMITTER_EMAIL="sukrithpvs@gmail.com"
      fi
    ' --force -- --all`;

    runCommand(filterCommand, 'Rewriting commit history');

    // Clean up refs
    runCommand('git for-each-ref --format="%(refname)" refs/original/ | xargs -n 1 git update-ref -d', 'Cleaning up refs', true);
    runCommand('git reflog expire --expire=now --all', 'Expiring reflog', true);
    runCommand('git gc --prune=now', 'Garbage collecting', true);

    // Check new contributors
    console.log('\n📋 Updated contributors:');
    runCommand('git shortlog -sn', 'Listing updated contributors');

    console.log('\n🎉 Git history cleanup completed!');
    console.log('✅ All commits now show "Sukrith" as the author');
    console.log('✅ actions-user has been removed from contributors');
    
    console.log('\n📋 Next steps:');
    console.log('1. Review the changes: git log --oneline');
    console.log('2. Force push to update remote: git push --force-with-lease origin main');
    console.log('3. Delete backup branch: git branch -D backup-before-cleanup');

    const shouldPush = await askQuestion('\n🤔 Force push changes to GitHub now? (y/n): ');
    
    if (shouldPush.toLowerCase() === 'y') {
      runCommand('git push --force-with-lease origin main', 'Force pushing to GitHub');
      runCommand('git push --force-with-lease origin --tags', 'Force pushing tags');
      
      console.log('\n🎉 Successfully updated GitHub repository!');
      console.log('✅ Contributors list should now show only you');
      console.log('🔗 Check: https://github.com/gravixlayer/gravixlayer-node/graphs/contributors');
    }

  } catch (error) {
    console.log(`\n❌ Cleanup failed: ${error.message}`);
    console.log('\n🔄 Restoring from backup...');
    
    try {
      runCommand('git reset --hard backup-before-cleanup', 'Restoring from backup');
      console.log('✅ Repository restored to original state');
    } catch (restoreError) {
      console.log('❌ Failed to restore backup. Manual intervention required.');
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}