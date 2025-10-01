/**
 * Unit tests for GravixLayer JavaScript SDK
 * Tests core functionality, error handling, and edge cases
 */
const { GravixLayer } = require('../dist/index.js');

class UnitTester {
  constructor() {
    this.testResults = [];
  }

  async runTest(testName, testFn) {
    console.log(`\n🧪 Unit Test: ${testName}`);
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

  async testClientInitialization() {
    // Test with API key
    const client1 = new GravixLayer({ apiKey: 'test-key' });
    if (!client1) throw new Error('Client not created');

    // Test with environment variable
    process.env.GRAVIXLAYER_API_KEY = 'env-test-key';
    const client2 = new GravixLayer();
    if (!client2) throw new Error('Client not created from env');

    // Test missing API key
    delete process.env.GRAVIXLAYER_API_KEY;
    try {
      new GravixLayer();
      throw new Error('Should have thrown error for missing API key');
    } catch (error) {
      if (!error.message.includes('API key')) {
        throw error;
      }
    }

    // Test invalid base URL
    try {
      new GravixLayer({ apiKey: 'test', baseURL: 'invalid-url' });
      throw new Error('Should have thrown error for invalid URL');
    } catch (error) {
      if (!error.message.includes('protocol')) {
        throw error;
      }
    }

    console.log('   ✓ Client initialization validation works');
  }

  async testResourceInitialization() {
    const client = new GravixLayer({ apiKey: 'test-key' });

    // Check all resources are initialized
    const resources = [
      'chat', 'embeddings', 'completions', 
      'deployments', 'accelerators', 'files', 'vectors'
    ];

    for (const resource of resources) {
      if (!client[resource]) {
        throw new Error(`Resource ${resource} not initialized`);
      }
    }

    // Check nested resources
    if (!client.chat.completions) {
      throw new Error('Chat completions not initialized');
    }

    if (!client.vectors.indexes) {
      throw new Error('Vector indexes not initialized');
    }

    console.log('   ✓ All resources initialized correctly');
  }

  async testParameterValidation() {
    const client = new GravixLayer({ apiKey: 'test-key' });

    // Test file upload validation
    try {
      await client.files.create({
        file: 'non-existent-file.txt',
        purpose: 'invalid-purpose'
      });
      throw new Error('Should have thrown validation error');
    } catch (error) {
      if (!error.message.includes('Invalid purpose')) {
        // File not found error is also acceptable
        if (!error.message.includes('not found')) {
          throw error;
        }
      }
    }

    // Test vector index validation
    try {
      await client.vectors.indexes.create({
        name: '',
        dimension: -1,
        metric: 'invalid-metric'
      });
      throw new Error('Should have thrown validation error');
    } catch (error) {
      if (!error.message.includes('required') && !error.message.includes('positive')) {
        throw error;
      }
    }

    console.log('   ✓ Parameter validation works');
  }

  async testTypeDefinitions() {
    // Test that all exported types exist
    const {
      GravixLayer,
      AsyncGravixLayer,
      GravixLayerError,
      GravixLayerAuthenticationError,
      GravixLayerRateLimitError,
      GravixLayerServerError,
      GravixLayerBadRequestError,
      GravixLayerConnectionError
    } = require('../dist/index.js');

    const requiredExports = [
      GravixLayer,
      AsyncGravixLayer,
      GravixLayerError,
      GravixLayerAuthenticationError,
      GravixLayerRateLimitError,
      GravixLayerServerError,
      GravixLayerBadRequestError,
      GravixLayerConnectionError
    ];

    for (let i = 0; i < requiredExports.length; i++) {
      if (!requiredExports[i]) {
        throw new Error(`Required export ${i} is missing`);
      }
    }

    console.log('   ✓ All required types exported');
  }

  async testErrorTypes() {
    const {
      GravixLayerError,
      GravixLayerAuthenticationError,
      GravixLayerRateLimitError,
      GravixLayerServerError,
      GravixLayerBadRequestError,
      GravixLayerConnectionError
    } = require('../dist/index.js');

    // Test error inheritance
    const authError = new GravixLayerAuthenticationError('test');
    if (!(authError instanceof GravixLayerError)) {
      throw new Error('Authentication error should inherit from GravixLayerError');
    }

    const rateLimitError = new GravixLayerRateLimitError('test');
    if (!(rateLimitError instanceof GravixLayerError)) {
      throw new Error('Rate limit error should inherit from GravixLayerError');
    }

    console.log('   ✓ Error type hierarchy correct');
  }

  async testVectorIndexOperations() {
    const client = new GravixLayer({ apiKey: 'test-key' });
    
    // Test vector index method exists
    const vectors = client.vectors.index('test-index-id');
    if (!vectors) {
      throw new Error('Vector index method should return vectors instance');
    }

    // Test vector methods exist
    const vectorMethods = [
      'upsert', 'upsertText', 'batchUpsert', 'batchUpsertText',
      'search', 'searchText', 'list', 'getVectors', 'get', 'update', 'delete'
    ];

    for (const method of vectorMethods) {
      if (typeof vectors[method] !== 'function') {
        throw new Error(`Vector method ${method} not found or not a function`);
      }
    }

    console.log('   ✓ Vector operations interface correct');
  }

  async testFileOperationsInterface() {
    const client = new GravixLayer({ apiKey: 'test-key' });
    
    // Test file methods exist
    const fileMethods = ['create', 'upload', 'list', 'retrieve', 'content', 'delete'];

    for (const method of fileMethods) {
      if (typeof client.files[method] !== 'function') {
        throw new Error(`File method ${method} not found or not a function`);
      }
    }

    console.log('   ✓ File operations interface correct');
  }

  async testStreamingInterface() {
    const client = new GravixLayer({ apiKey: 'test-key' });

    // Test that streaming methods exist and are callable
    // (We won't actually call them to avoid API calls)
    
    const chatStreamMethod = client.chat.completions.create;
    const completionsStreamMethod = client.completions.create;

    if (typeof chatStreamMethod !== 'function') {
      throw new Error('Chat completions create method not found');
    }

    if (typeof completionsStreamMethod !== 'function') {
      throw new Error('Completions create method not found');
    }

    console.log('   ✓ Streaming interface available');
  }

  async testCompatibilityParameters() {
    // Test that compatibility parameters are accepted without errors
    const client = new GravixLayer({
      apiKey: 'test-key',
      organization: 'test-org',
      project: 'test-project',
      timeout: 30000,
      maxRetries: 5,
      headers: { 'Custom-Header': 'test' },
      userAgent: 'test-agent'
    });

    if (!client) {
      throw new Error('Client should accept compatibility parameters');
    }

    console.log('   ✓ Compatibility parameters accepted');
  }

  async runAllTests() {
    console.log('🚀 Starting GravixLayer JavaScript SDK Unit Tests');

    const tests = [
      ['Client Initialization', () => this.testClientInitialization()],
      ['Resource Initialization', () => this.testResourceInitialization()],
      ['Parameter Validation', () => this.testParameterValidation()],
      ['Type Definitions', () => this.testTypeDefinitions()],
      ['Error Types', () => this.testErrorTypes()],
      ['Vector Index Operations', () => this.testVectorIndexOperations()],
      ['File Operations Interface', () => this.testFileOperationsInterface()],
      ['Streaming Interface', () => this.testStreamingInterface()],
      ['Compatibility Parameters', () => this.testCompatibilityParameters()]
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
    console.log('\n📊 Unit Test Results Summary');
    console.log('='.repeat(50));
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

    console.log('\n' + (failed === 0 ? '🎉 All unit tests passed!' : `⚠️  ${failed} test(s) failed`));
    
    return failed === 0;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new UnitTester();
  tester.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Unit test runner failed:', error);
      process.exit(1);
    });
}

module.exports = { UnitTester };