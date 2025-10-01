#!/usr/bin/env node

/**
 * Manual publishing script as backup for GitHub Actions
 */

const { execSync } = require('child_process');
const fs = require('fs');

function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${description} completed`);
    return output;
  } catch (error) {
    console.log(`❌ ${description} failed:`);
    console.log(error.message);
    process.exit(1);
  }
}

function main() {
  console.log('🚀 Manual NPM Publishing Script');
  console.log('================================\n');

  // Check if logged in
  console.log('1. Checking NPM authentication...');
  try {
    const whoami = execSync('npm whoami', { encoding: 'utf8' }).trim();
    console.log(`✅ Logged in as: ${whoami}`);
  } catch (error) {
    console.log('❌ Not logged in to NPM');
    console.log('Please run: npm login');
    process.exit(1);
  }

  // Get current version
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`\n📦 Current version: ${packageJson.version}`);

  // Ask for version type
  const versionType = process.argv[2] || 'patch';
  console.log(`🔢 Version bump type: ${versionType}`);

  // Run tests
  runCommand('npm test', 'Running pre-build tests');

  // Build project
  runCommand('npm run build', 'Building project');

  // Run post-build tests
  runCommand('npm run test:unit', 'Running post-build tests');

  // Bump version
  const newVersion = runCommand(`npm version ${versionType} --no-git-tag-version`, 'Bumping version').trim();
  console.log(`📈 New version: ${newVersion}`);

  // Test publish (dry run)
  runCommand('npm publish --dry-run', 'Testing publish (dry run)');

  // Actual publish
  runCommand('npm publish --access public', 'Publishing to NPM');

  // Create git tag and push
  const version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
  runCommand('git add package.json', 'Adding package.json to git');
  runCommand(`git commit -m "chore: bump version to ${version}"`, 'Committing version bump');
  runCommand(`git tag v${version}`, 'Creating git tag');
  runCommand('git push origin main', 'Pushing to main branch');
  runCommand(`git push origin v${version}`, 'Pushing tag');

  console.log('\n🎉 Publishing completed successfully!');
  console.log(`📦 Package published: gravixlayer@${version}`);
  console.log(`🔗 NPM: https://www.npmjs.com/package/gravixlayer`);
  console.log(`🏷️  GitHub Release: https://github.com/gravixlayer/gravixlayer-node/releases/tag/v${version}`);
}

if (require.main === module) {
  main();
}