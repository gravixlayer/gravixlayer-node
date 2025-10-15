#!/usr/bin/env node

/**
 * Script to create GitHub releases manually
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
      return null;
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
  console.log('🏷️  GitHub Release Creator');
  console.log('==========================\n');

  // Get current version
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const version = packageJson.version;
  console.log(`📦 Current version: ${version}`);

  // Check if GitHub CLI is available
  const ghCheck = runCommand('gh --version', 'Checking GitHub CLI', true);
  if (!ghCheck) {
    console.log('\n❌ GitHub CLI not found!');
    console.log('Please install GitHub CLI:');
    console.log('- Windows: winget install GitHub.cli');
    console.log('- macOS: brew install gh');
    console.log('- Linux: https://github.com/cli/cli/blob/trunk/docs/install_linux.md');
    console.log('\nThen run: gh auth login');
    process.exit(1);
  }

  // Check if authenticated
  const authCheck = runCommand('gh auth status', 'Checking GitHub authentication', true);
  if (!authCheck) {
    console.log('\n❌ Not authenticated with GitHub!');
    console.log('Please run: gh auth login');
    process.exit(1);
  }

  // Ask for release notes
  console.log('\n📝 Release Notes:');
  const releaseNotes = await askQuestion('Enter release notes (or press Enter for default): ');
  
  const finalNotes = releaseNotes.trim() || `Release v${version} with updates and improvements.

## What's New
- Updated memory system implementation
- Improved JavaScript SDK functionality
- Enhanced error handling and performance

## Installation
\`\`\`bash
npm install gravixlayer@${version}
\`\`\`

## Documentation
- [Memory System](https://docs.gravixlayer.com/memory)
- [JavaScript SDK](https://docs.gravixlayer.com/sdks/javascript)`;

  console.log('\n📋 Release notes preview:');
  console.log('------------------------');
  console.log(finalNotes);
  console.log('------------------------');

  const shouldCreate = await askQuestion('\n🤔 Create this GitHub release? (y/n): ');
  
  if (shouldCreate.toLowerCase() === 'y') {
    // Create the release
    const releaseCommand = `gh release create v${version} --title "Release v${version}" --notes "${finalNotes.replace(/"/g, '\\"')}" --latest`;
    
    const result = runCommand(releaseCommand, 'Creating GitHub release');
    
    if (result) {
      console.log('\n🎉 GitHub release created successfully!');
      console.log(`🔗 Release URL: https://github.com/gravixlayer/gravixlayer-node/releases/tag/v${version}`);
      
      // Also create a tag if it doesn't exist
      const tagExists = runCommand(`git tag -l v${version}`, 'Checking if tag exists', true);
      if (!tagExists) {
        runCommand(`git tag v${version}`, 'Creating git tag');
        runCommand(`git push origin v${version}`, 'Pushing tag to GitHub');
      }
      
      console.log('\n📋 Verification Links:');
      console.log(`- GitHub Release: https://github.com/gravixlayer/gravixlayer-node/releases/tag/v${version}`);
      console.log(`- NPM Package: https://www.npmjs.com/package/gravixlayer`);
      console.log(`- All Releases: https://github.com/gravixlayer/gravixlayer-node/releases`);
    }
  } else {
    console.log('❌ Release creation cancelled');
  }
}

if (require.main === module) {
  main().catch(console.error);
}