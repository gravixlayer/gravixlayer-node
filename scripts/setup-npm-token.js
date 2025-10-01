#!/usr/bin/env node

/**
 * Script to help set up NPM token for GitHub Actions
 */

const { execSync } = require('child_process');

console.log('🔑 NPM Token Setup for GitHub Actions\n');

console.log('Step 1: Make sure you\'re logged in to NPM');
try {
  const whoami = execSync('npm whoami', { encoding: 'utf8' }).trim();
  console.log(`✅ Logged in as: ${whoami}\n`);
} catch (error) {
  console.log('❌ Not logged in to NPM');
  console.log('Please run: npm login\n');
  process.exit(1);
}

console.log('Step 2: Create an NPM token');
console.log('Run this command to create a token:');
console.log('   npm token create --read-only=false\n');

console.log('Step 3: Add the token to GitHub');
console.log('1. Copy the token from the command above');
console.log('2. Go to: https://github.com/gravixlayer/gravixlayer-node/settings/secrets/actions');
console.log('3. Click "New repository secret"');
console.log('4. Name: NPM_TOKEN');
console.log('5. Value: Paste your token');
console.log('6. Click "Add secret"\n');

console.log('Step 4: Run the GitHub Actions workflow');
console.log('1. Go to: https://github.com/gravixlayer/gravixlayer-node/actions');
console.log('2. Click "Manual Release and Publish"');
console.log('3. Click "Run workflow"');
console.log('4. Choose version type and click "Run workflow"\n');

console.log('🎉 Your package will be published to NPM automatically!');