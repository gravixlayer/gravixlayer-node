#!/usr/bin/env node

/**
 * Simple patch release script - always increments by 0.0.1
 */

const { execSync } = require('child_process');
const fs = require('fs');

function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${description} - SUCCESS`);
    return output.trim();
  } catch (error) {
    console.log(`❌ ${description} - FAILED`);
    console.log(`Error: ${error.message}`);
    process.exit(1);
  }
}

function main() {
  console.log('🚀 Patch Release (0.0.1 increment)');
  console.log('==================================\n');

  // Get current version
  const currentVersion = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
  console.log(`📦 Current version: ${currentVersion}`);

  // Check NPM authentication
  const whoami = runCommand('npm whoami', 'Checking NPM authentication');
  console.log(`👤 NPM user: ${whoami}`);

  // Run tests
  runCommand('npm test', 'Running pre-build tests');

  // Build project
  runCommand('npm run build', 'Building project');

  // Run post-build tests
  runCommand('npm run test:unit', 'Running post-build tests');

  // Bump patch version
  runCommand('npm version patch --no-git-tag-version', 'Bumping patch version');

  // Get new version
  const newVersion = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
  console.log(`\n📈 Version bumped: ${currentVersion} → ${newVersion}`);

  // Test publish (dry run)
  runCommand('npm publish --dry-run', 'Testing publish (dry run)');

  // Ask for confirmation
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('\n🤔 Do you want to publish to NPM now? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      try {
        // Publish to NPM
        runCommand('npm publish --access public', 'Publishing to NPM');

        // Create git tag and push
        runCommand('git add package.json', 'Adding package.json to git');
        runCommand(`git commit -m "chore: bump version to ${newVersion}"`, 'Committing version bump');
        runCommand(`git tag v${newVersion}`, 'Creating git tag');
        runCommand('git push origin main', 'Pushing to main branch');
        runCommand(`git push origin v${newVersion}`, 'Pushing tag');

        console.log('\n🎉 Patch release completed successfully!');
        console.log(`📦 Published: gravixlayer@${newVersion}`);
        console.log(`🔗 NPM: https://www.npmjs.com/package/gravixlayer`);
        console.log(`🏷️  GitHub: https://github.com/gravixlayer/gravixlayer-node/releases/tag/v${newVersion}`);
      } catch (error) {
        console.log(`❌ Publishing failed: ${error.message}`);
        
        // Restore package.json
        const originalPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        originalPackage.version = currentVersion;
        fs.writeFileSync('package.json', JSON.stringify(originalPackage, null, 2) + '\n');
        console.log('📄 Restored original package.json version');
      }
    } else {
      // Restore package.json
      const originalPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      originalPackage.version = currentVersion;
      fs.writeFileSync('package.json', JSON.stringify(originalPackage, null, 2) + '\n');
      console.log('📄 Restored original package.json version');
      console.log('❌ Publishing cancelled');
    }
    rl.close();
  });
}

if (require.main === module) {
  main();
}