#!/usr/bin/env node

/**
 * Interactive script to help set up NPM publishing with GitHub Actions
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function main() {
  console.log('🚀 GitHub Actions NPM Publishing Setup');
  console.log('=====================================\n');

  // Step 1: Check NPM login
  console.log('Step 1: Checking NPM authentication...');
  try {
    const whoami = execSync('npm whoami', { encoding: 'utf8' }).trim();
    console.log(`✅ Logged in to NPM as: ${whoami}\n`);
  } catch (error) {
    console.log('❌ Not logged in to NPM');
    console.log('Please run: npm login');
    console.log('Then run this script again.\n');
    process.exit(1);
  }

  // Step 2: Create NPM token
  console.log('Step 2: Creating NPM token...');
  console.log('We need to create an NPM token for GitHub Actions.');
  
  const createToken = await ask('Do you want to create a new NPM token? (y/n): ');
  
  if (createToken.toLowerCase() === 'y') {
    console.log('\nCreating NPM token...');
    try {
      const tokenOutput = execSync('npm token create --read-only=false', { encoding: 'utf8' });
      console.log('\n✅ NPM Token created!');
      console.log('Token output:');
      console.log(tokenOutput);
      
      // Extract token from output
      const tokenMatch = tokenOutput.match(/npm_[a-zA-Z0-9_]+/);
      if (tokenMatch) {
        const token = tokenMatch[0];
        console.log(`\n🔑 Your NPM Token: ${token}`);
        console.log('⚠️  IMPORTANT: Copy this token now! You won\'t see it again.\n');
      }
    } catch (error) {
      console.log('❌ Failed to create NPM token');
      console.log('Please create it manually: npm token create --read-only=false\n');
    }
  }

  // Step 3: GitHub setup instructions
  console.log('Step 3: Add NPM token to GitHub repository');
  console.log('==========================================');
  console.log('1. Copy the NPM token from above');
  console.log('2. Go to: https://github.com/gravixlayer/gravixlayer-node/settings/secrets/actions');
  console.log('3. Click "New repository secret"');
  console.log('4. Name: NPM_TOKEN');
  console.log('5. Value: Paste your NPM token');
  console.log('6. Click "Add secret"\n');

  const tokenAdded = await ask('Have you added the NPM_TOKEN to GitHub secrets? (y/n): ');
  
  if (tokenAdded.toLowerCase() === 'y') {
    console.log('\n✅ Great! Now you can run the GitHub Actions workflow.');
    console.log('\nStep 4: Run the workflow');
    console.log('========================');
    console.log('1. Go to: https://github.com/gravixlayer/gravixlayer-node/actions');
    console.log('2. Click "Manual Release and Publish"');
    console.log('3. Click "Run workflow"');
    console.log('4. Choose version type (patch/minor/major)');
    console.log('5. Add release notes (optional)');
    console.log('6. Click "Run workflow"\n');
    
    console.log('🎉 Your package should be published automatically!');
    console.log('📦 Check: https://www.npmjs.com/package/gravixlayer');
  } else {
    console.log('\n⚠️  Please add the NPM_TOKEN to GitHub secrets first.');
    console.log('The workflow will fail without it.');
  }

  // Step 5: Test locally (optional)
  console.log('\nStep 5: Test locally (optional)');
  console.log('===============================');
  const testLocally = await ask('Do you want to test publishing locally first? (y/n): ');
  
  if (testLocally.toLowerCase() === 'y') {
    console.log('\nTesting local publishing...');
    try {
      console.log('Running dry run...');
      const dryRun = execSync('npm publish --dry-run', { encoding: 'utf8' });
      console.log('✅ Dry run successful!');
      console.log('Files that would be published:');
      console.log(dryRun);
      
      const publishNow = await ask('\nDo you want to publish now? (y/n): ');
      if (publishNow.toLowerCase() === 'y') {
        console.log('Publishing to NPM...');
        execSync('npm publish --access public', { stdio: 'inherit' });
        console.log('✅ Published successfully!');
      }
    } catch (error) {
      console.log('❌ Publishing test failed:');
      console.log(error.message);
    }
  }

  rl.close();
  console.log('\n🎯 Setup complete! Your NPM publishing should work now.');
}

main().catch(console.error);