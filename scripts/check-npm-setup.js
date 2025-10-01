#!/usr/bin/env node

/**
 * Script to check NPM publishing setup
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Checking NPM Publishing Setup...\n');

// Check if user is logged in to NPM
console.log('1. Checking NPM authentication...');
try {
  const whoami = execSync('npm whoami', { encoding: 'utf8' }).trim();
  console.log(`✅ Logged in as: ${whoami}`);
} catch (error) {
  console.log('❌ Not logged in to NPM');
  console.log('   Run: npm login');
  process.exit(1);
}

// Check package.json
console.log('\n2. Checking package.json...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

if (!packageJson.name) {
  console.log('❌ Package name is missing');
  process.exit(1);
}

if (!packageJson.version) {
  console.log('❌ Package version is missing');
  process.exit(1);
}

console.log(`✅ Package: ${packageJson.name}@${packageJson.version}`);

// Check if package name is available
console.log('\n3. Checking package availability...');
try {
  execSync(`npm view ${packageJson.name}`, { stdio: 'pipe' });
  console.log(`✅ Package exists on NPM (will be updated)`);
} catch (error) {
  console.log(`✅ Package name is available (new package)`);
}

// Check build
console.log('\n4. Checking build...');
if (!fs.existsSync('dist')) {
  console.log('❌ dist/ directory not found');
  console.log('   Run: npm run build');
  process.exit(1);
}

const distFiles = fs.readdirSync('dist');
const requiredFiles = ['index.js', 'index.mjs', 'index.d.ts', 'cli.js'];
const missingFiles = requiredFiles.filter(file => !distFiles.includes(file));

if (missingFiles.length > 0) {
  console.log(`❌ Missing build files: ${missingFiles.join(', ')}`);
  console.log('   Run: npm run build');
  process.exit(1);
}

console.log('✅ Build files present');

// Check publishConfig
console.log('\n5. Checking publish configuration...');
if (packageJson.publishConfig && packageJson.publishConfig.access === 'public') {
  console.log('✅ Package configured for public publishing');
} else {
  console.log('⚠️  Package not configured for public publishing');
  console.log('   Add to package.json: "publishConfig": { "access": "public" }');
}

// Test publish (dry run)
console.log('\n6. Testing publish (dry run)...');
try {
  const result = execSync('npm publish --dry-run', { encoding: 'utf8' });
  console.log('✅ Dry run successful');
  
  // Show what would be published
  const lines = result.split('\n');
  const filesLine = lines.find(line => line.includes('files:'));
  if (filesLine) {
    console.log(`   ${filesLine}`);
  }
} catch (error) {
  console.log('❌ Dry run failed');
  console.log(error.message);
  process.exit(1);
}

console.log('\n🎉 NPM setup looks good!');
console.log('\n📝 To publish manually:');
console.log('   npm publish');
console.log('\n📝 To publish via GitHub Actions:');
console.log('   1. Make sure NPM_TOKEN secret is set in GitHub repository');
console.log('   2. Go to Actions tab and run "Manual Release and Publish" workflow');