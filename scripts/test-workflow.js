#!/usr/bin/env node

/**
 * Test script to verify workflow components work locally
 */

const { execSync } = require('child_process');
const fs = require('fs');

function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    const output = execSync(command, { encoding: 'utf8' });
    console.log(`✅ ${description} - SUCCESS`);
    return output.trim();
  } catch (error) {
    console.log(`❌ ${description} - FAILED`);
    console.log(`Error: ${error.message}`);
    return null;
  }
}

function main() {
  console.log('🧪 Testing Workflow Components Locally');
  console.log('======================================\n');

  // Test 1: Check NPM authentication
  const whoami = runCommand('npm whoami', 'NPM Authentication');
  if (!whoami) {
    console.log('\n❌ NPM authentication failed. Please run: npm login');
    return;
  }

  // Test 2: Run pre-build tests
  const preTests = runCommand('npm test', 'Pre-build tests');
  if (!preTests) return;

  // Test 3: Build project
  const build = runCommand('npm run build', 'Build project');
  if (!build) return;

  // Test 4: Run post-build tests
  const postTests = runCommand('npm run test:unit', 'Post-build tests');
  if (!postTests) return;

  // Test 5: Test version bump (dry run)
  const currentVersion = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
  console.log(`\n📦 Current version: ${currentVersion}`);
  
  // Create a backup of package.json
  const packageBackup = fs.readFileSync('package.json', 'utf8');
  
  const versionBump = runCommand('npm version patch --no-git-tag-version', 'Version bump (test)');
  if (versionBump) {
    const newVersion = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
    console.log(`📈 New version would be: ${newVersion}`);
    
    // Restore package.json
    fs.writeFileSync('package.json', packageBackup);
    console.log('📄 Restored original package.json');
  }

  // Test 6: Test NPM publish (dry run)
  const publishTest = runCommand('npm publish --dry-run', 'NPM publish (dry run)');
  if (!publishTest) return;

  console.log('\n🎉 All workflow components tested successfully!');
  console.log('\n📋 Summary:');
  console.log(`✅ NPM authenticated as: ${whoami}`);
  console.log('✅ Pre-build tests pass');
  console.log('✅ Build succeeds');
  console.log('✅ Post-build tests pass');
  console.log('✅ Version bump works');
  console.log('✅ NPM publish ready');
  
  console.log('\n🚀 Your GitHub Actions workflow should work now!');
  console.log('Go to: https://github.com/gravixlayer/gravixlayer-node/actions');
  console.log('Run: "Manual Release and Publish" workflow');
}

if (require.main === module) {
  main();
}