#!/usr/bin/env node

/**
 * Script to reset version to 0.0.2 and handle NPM version cleanup
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
      process.exit(1);
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
  console.log('🔄 Version Reset Script');
  console.log('=======================\n');

  // Check NPM authentication
  const whoami = runCommand('npm whoami', 'Checking NPM authentication');
  console.log(`👤 NPM user: ${whoami}`);

  // Get current version
  const currentVersion = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
  console.log(`📦 Current version: ${currentVersion}`);

  // Ask about unpublishing 0.1.1
  console.log('\n⚠️  NPM Version Management:');
  console.log('You mentioned wanting to delete version 0.1.1 from NPM.');
  console.log('Note: NPM unpublish is only allowed within 72 hours of publishing.');
  
  const shouldTryUnpublish = await askQuestion('🤔 Do you want to try unpublishing gravixlayer@0.1.1? (y/n): ');
  
  if (shouldTryUnpublish.toLowerCase() === 'y') {
    console.log('\n🗑️  Attempting to unpublish version 0.1.1...');
    runCommand('npm unpublish gravixlayer@0.1.1', 'Unpublishing version 0.1.1', true);
  }

  // Set version to 0.0.2
  console.log('\n📝 Setting version to 0.0.2...');
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  packageJson.version = '0.0.2';
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
  console.log('✅ Version set to 0.0.2');

  // Run tests
  runCommand('npm test', 'Running pre-build tests');

  // Build project
  runCommand('npm run build', 'Building project');

  // Run post-build tests
  runCommand('npm run test:unit', 'Running post-build tests');

  // Test publish (dry run)
  runCommand('npm publish --dry-run', 'Testing publish (dry run)');

  // Ask for confirmation to publish
  const shouldPublish = await askQuestion('\n🤔 Do you want to publish gravixlayer@0.0.2 to NPM now? (y/n): ');
  
  if (shouldPublish.toLowerCase() === 'y') {
    try {
      // Publish to NPM
      runCommand('npm publish --access public', 'Publishing to NPM');

      // Create git tag and push
      runCommand('git add package.json', 'Adding package.json to git');
      runCommand('git commit -m "chore: reset version to 0.0.2"', 'Committing version reset');
      runCommand('git tag v0.0.2', 'Creating git tag');
      runCommand('git push origin main', 'Pushing to main branch');
      runCommand('git push origin v0.0.2', 'Pushing tag');

      console.log('\n🎉 Version reset and publish completed successfully!');
      console.log('📦 Published: gravixlayer@0.0.2');
      console.log('🔗 NPM: https://www.npmjs.com/package/gravixlayer');
      console.log('🏷️  GitHub: https://github.com/gravixlayer/gravixlayer-node/releases/tag/v0.0.2');
      
      console.log('\n📋 Next Steps:');
      console.log('1. Check NPM package: https://www.npmjs.com/package/gravixlayer');
      console.log('2. Check GitHub releases: https://github.com/gravixlayer/gravixlayer-node/releases');
      console.log('3. Test installation: npm install gravixlayer@0.0.2');
      
    } catch (error) {
      console.log(`❌ Publishing failed: ${error.message}`);
      
      // Restore package.json
      packageJson.version = currentVersion;
      fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
      console.log('📄 Restored original package.json version');
    }
  } else {
    // Restore package.json
    packageJson.version = currentVersion;
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
    console.log('📄 Restored original package.json version');
    console.log('❌ Publishing cancelled');
  }
}

if (require.main === module) {
  main().catch(console.error);
}