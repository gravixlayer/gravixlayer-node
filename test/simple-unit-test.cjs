/**
 * Simple unit tests that don't require built files
 * These tests can run before the build step in CI/CD
 */

const fs = require('fs');
const path = require('path');

class SimpleUnitTester {
  constructor() {
    this.testResults = [];
  }

  async runTest(testName, testFn) {
    console.log(`🧪 Testing: ${testName}`);
    const startTime = Date.now();

    try {
      await testFn();
      const duration = Date.now() - startTime;
      console.log(`✅ PASSED: ${testName} (${duration}ms)`);
      this.testResults.push({ name: testName, status: 'PASSED', duration });
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`❌ FAILED: ${testName} (${duration}ms)`);
      console.log(`   Error: ${error.message}`);
      this.testResults.push({ name: testName, status: 'FAILED', duration, error: error.message });
      return false;
    }
  }

  async testPackageJson() {
    const packagePath = path.join(__dirname, '..', 'package.json');
    if (!fs.existsSync(packagePath)) {
      throw new Error('package.json not found');
    }

    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    if (!packageJson.name) {
      throw new Error('Package name is missing');
    }

    if (!packageJson.version) {
      throw new Error('Package version is missing');
    }

    if (!packageJson.main) {
      throw new Error('Package main entry is missing');
    }

    if (!packageJson.types) {
      throw new Error('Package types entry is missing');
    }

    console.log(`   ✓ Package: ${packageJson.name}@${packageJson.version}`);
  }

  async testSourceFiles() {
    const srcPath = path.join(__dirname, '..', 'src');
    if (!fs.existsSync(srcPath)) {
      throw new Error('src directory not found');
    }

    const requiredFiles = [
      'index.ts',
      'client.ts',
      'cli.ts'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(srcPath, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Required source file missing: ${file}`);
      }
    }

    console.log(`   ✓ All required source files present`);
  }

  async testTypeDefinitions() {
    const typesPath = path.join(__dirname, '..', 'src', 'types');
    if (!fs.existsSync(typesPath)) {
      throw new Error('types directory not found');
    }

    const requiredTypes = [
      'chat.ts',
      'completions.ts',
      'embeddings.ts',
      'deployments.ts',
      'accelerators.ts',
      'files.ts',
      'vectors.ts',
      'exceptions.ts'
    ];

    for (const file of requiredTypes) {
      const filePath = path.join(typesPath, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Required type file missing: ${file}`);
      }
    }

    console.log(`   ✓ All type definition files present`);
  }

  async testResourceFiles() {
    const resourcesPath = path.join(__dirname, '..', 'src', 'resources');
    if (!fs.existsSync(resourcesPath)) {
      throw new Error('resources directory not found');
    }

    const requiredResources = [
      'embeddings.ts',
      'completions.ts',
      'deployments.ts',
      'accelerators.ts',
      'files.ts'
    ];

    for (const file of requiredResources) {
      const filePath = path.join(resourcesPath, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Required resource file missing: ${file}`);
      }
    }

    // Check nested resources
    const chatPath = path.join(resourcesPath, 'chat', 'completions.ts');
    if (!fs.existsSync(chatPath)) {
      throw new Error('Chat completions resource missing');
    }

    const vectorsPath = path.join(resourcesPath, 'vectors', 'main.ts');
    if (!fs.existsSync(vectorsPath)) {
      throw new Error('Vectors main resource missing');
    }

    console.log(`   ✓ All resource files present`);
  }

  async testBuildConfiguration() {
    const tsupConfigPath = path.join(__dirname, '..', 'tsup.config.ts');
    if (!fs.existsSync(tsupConfigPath)) {
      throw new Error('tsup.config.ts not found');
    }

    const tsconfigPath = path.join(__dirname, '..', 'tsconfig.json');
    if (!fs.existsSync(tsconfigPath)) {
      throw new Error('tsconfig.json not found');
    }

    console.log(`   ✓ Build configuration files present`);
  }

  async runAllTests() {
    console.log('🚀 Starting Simple Unit Tests (Pre-Build)');
    console.log('These tests verify the source code structure and configuration');
    console.log();

    const tests = [
      ['Package Configuration', () => this.testPackageJson()],
      ['Source Files', () => this.testSourceFiles()],
      ['Type Definitions', () => this.testTypeDefinitions()],
      ['Resource Files', () => this.testResourceFiles()],
      ['Build Configuration', () => this.testBuildConfiguration()]
    ];

    let passed = 0;
    let failed = 0;

    for (const [testName, testFn] of tests) {
      const success = await this.runTest(testName, testFn);
      if (success) {
        passed++;
      } else {
        failed++;
      }
    }

    // Summary
    console.log('\n📊 Simple Unit Test Results');
    console.log('='.repeat(40));
    console.log(`Total Tests: ${tests.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => r.status === 'FAILED')
        .forEach(r => console.log(`   - ${r.name}: ${r.error}`));
    }

    console.log('\n' + (failed === 0 ? '🎉 All pre-build tests passed!' : `⚠️  ${failed} test(s) failed`));

    return failed === 0;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new SimpleUnitTester();
  tester.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = { SimpleUnitTester };