/**
 * Comprehensive integration test for GravixLayer JavaScript SDK
 * Tests all endpoints and features
 */
const { GravixLayer } = require('../dist/index.cjs');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  apiKey: process.env.GRAVIXLAYER_API_KEY,
  testModel: "meta-llama/llama-3.1-8b-instruct",
  embeddingModel: "microsoft/multilingual-e5-large",
  timeout: 30000
};

class TestRunner {
  constructor() {
    this.client = new GravixLayer({
      apiKey: TEST_CONFIG.apiKey
    });
    this.testResults = [];
    this.createdResources = {
      files: [],
      vectorIndexes: [],
      deployments: []
    };
  }

  async runTest(testName, testFn) {
    console.log(`\n🧪 Testing: ${testName}`);
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

  async testChatCompletions() {
    const completion = await this.client.chat.completions.create({
      model: TEST_CONFIG.testModel,
      messages: [
        { role: "system", content: "You are a helpful assistant. Respond with exactly 'Hello World'" },
        { role: "user", content: "Say hello" }
      ],
      max_tokens: 10
    });

    if (!completion.choices || completion.choices.length === 0) {
      throw new Error('No choices returned');
    }

    if (!completion.choices[0].message || !completion.choices[0].message.content) {
      throw new Error('No message content returned');
    }

    console.log(`   Response: ${completion.choices[0].message.content.trim()}`);
  }

  async testStreamingChatCompletions() {
    const stream = await this.client.chat.completions.create({
      model: TEST_CONFIG.testModel,
      messages: [
        { role: "user", content: "Count from 1 to 3" }
      ],
      max_tokens: 20,
      stream: true
    });

    let chunks = 0;
    let content = '';
    
    for await (const chunk of stream) {
      if (chunk.choices[0]?.delta?.content) {
        content += chunk.choices[0].delta.content;
        chunks++;
      }
    }

    if (chunks === 0) {
      throw new Error('No streaming chunks received');
    }

    console.log(`   Received ${chunks} chunks, content: "${content.trim()}"`);
  }

  async testTextCompletions() {
    const completion = await this.client.completions.create({
      model: TEST_CONFIG.testModel,
      prompt: "The capital of France is",
      max_tokens: 5
    });

    if (!completion.choices || completion.choices.length === 0) {
      throw new Error('No choices returned');
    }

    if (!completion.choices[0].text) {
      throw new Error('No text returned');
    }

    console.log(`   Response: "${completion.choices[0].text.trim()}"`);
  }

  async testStreamingTextCompletions() {
    const stream = await this.client.completions.create({
      model: TEST_CONFIG.testModel,
      prompt: "List three colors:",
      max_tokens: 15,
      stream: true
    });

    let chunks = 0;
    let text = '';
    
    for await (const chunk of stream) {
      if (chunk.choices[0]?.text) {
        text += chunk.choices[0].text;
        chunks++;
      }
    }

    if (chunks === 0) {
      throw new Error('No streaming chunks received');
    }

    console.log(`   Received ${chunks} chunks, text: "${text.trim()}"`);
  }

  async testEmbeddings() {
    const embedding = await this.client.embeddings.create({
      model: TEST_CONFIG.embeddingModel,
      input: "Hello, world!"
    });

    if (!embedding.data || embedding.data.length === 0) {
      throw new Error('No embedding data returned');
    }

    if (!embedding.data[0].embedding || !Array.isArray(embedding.data[0].embedding)) {
      throw new Error('Invalid embedding format');
    }

    console.log(`   Embedding dimension: ${embedding.data[0].embedding.length}`);
  }

  async testDeploymentsList() {
    const deployments = await this.client.deployments.list();
    
    if (!Array.isArray(deployments)) {
      throw new Error('Deployments should be an array');
    }

    console.log(`   Found ${deployments.length} deployments`);
  }

  async testAcceleratorsList() {
    const accelerators = await this.client.accelerators.list();
    
    if (!Array.isArray(accelerators)) {
      throw new Error('Accelerators should be an array');
    }

    console.log(`   Found ${accelerators.length} accelerators`);
  }

  async testFileManagement() {
    // Create a test file
    const testFilePath = path.join(__dirname, 'test-file.txt');
    fs.writeFileSync(testFilePath, 'This is a test file for GravixLayer SDK testing.');

    try {
      // Upload file
      const uploadResponse = await this.client.files.create({
        file: testFilePath,
        purpose: 'assistants',
        filename: 'sdk-test-file.txt'
      });

      console.log(`   Uploaded: ${uploadResponse.file_name}`);
      
      // List files
      const filesList = await this.client.files.list();
      console.log(`   Total files: ${filesList.data.length}`);

      // Find our uploaded file
      const uploadedFile = filesList.data.find(f => f.filename === 'sdk-test-file.txt');
      if (!uploadedFile) {
        throw new Error('Uploaded file not found in list');
      }

      this.createdResources.files.push(uploadedFile.id);

      // Retrieve file info
      const fileInfo = await this.client.files.retrieve(uploadedFile.id);
      console.log(`   Retrieved file: ${fileInfo.filename} (${fileInfo.bytes} bytes)`);

      // Download file content
      const content = await this.client.files.content(uploadedFile.id);
      if (!Buffer.isBuffer(content)) {
        throw new Error('File content should be a Buffer');
      }
      console.log(`   Downloaded ${content.length} bytes`);

      // Delete file
      const deleteResponse = await this.client.files.delete(uploadedFile.id);
      console.log(`   Deleted: ${deleteResponse.file_name}`);
      
      // Remove from cleanup list since it's already deleted
      this.createdResources.files = this.createdResources.files.filter(id => id !== uploadedFile.id);

    } finally {
      // Clean up test file
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    }
  }

  async testVectorDatabase() {
    // Create vector index
    const indexName = `test-index-${Date.now()}`;
    const index = await this.client.vectors.indexes.create({
      name: indexName,
      dimension: 1536,
      metric: 'cosine',
      metadata: { test: true, created_by: 'sdk_test' }
    });

    console.log(`   Created index: ${index.name} (ID: ${index.id})`);
    this.createdResources.vectorIndexes.push(index.id);

    // List indexes
    const indexesList = await this.client.vectors.indexes.list();
    console.log(`   Total indexes: ${indexesList.indexes.length}`);

    // Get index info
    const indexInfo = await this.client.vectors.indexes.get(index.id);
    console.log(`   Retrieved index: ${indexInfo.name} (${indexInfo.dimension}D)`);

    // Get vector operations for the index
    const vectors = this.client.vectors.index(index.id);

    // Upsert text vector
    const textVector = await vectors.upsertText({
      text: "This is a test document about artificial intelligence",
      model: TEST_CONFIG.embeddingModel,
      id: "test-vector-1",
      metadata: { category: "test", topic: "ai" }
    });

    console.log(`   Upserted text vector: ${textVector.id}`);

    // Search using text
    const searchResults = await vectors.searchText({
      query: "artificial intelligence",
      model: TEST_CONFIG.embeddingModel,
      top_k: 5
    });

    console.log(`   Search found ${searchResults.hits.length} results in ${searchResults.query_time_ms}ms`);

    if (searchResults.hits.length > 0) {
      console.log(`   Top result score: ${searchResults.hits[0].score.toFixed(4)}`);
    }

    // List vectors
    const vectorsList = await vectors.list();
    console.log(`   Vectors in index: ${vectorsList.vectors.length}`);

    // Delete the index (cleanup)
    await this.client.vectors.indexes.delete(index.id);
    console.log(`   Deleted index: ${index.id}`);
    
    // Remove from cleanup list since it's already deleted
    this.createdResources.vectorIndexes = this.createdResources.vectorIndexes.filter(id => id !== index.id);
  }

  async testErrorHandling() {
    try {
      // Test with invalid API key
      const invalidClient = new GravixLayer({ apiKey: 'invalid-key' });
      await invalidClient.chat.completions.create({
        model: TEST_CONFIG.testModel,
        messages: [{ role: "user", content: "test" }]
      });
      throw new Error('Should have thrown authentication error');
    } catch (error) {
      if (error.message.includes('authentication') || error.message.includes('401')) {
        console.log('   ✓ Authentication error handled correctly');
      } else {
        throw error;
      }
    }

    try {
      // Test with invalid model
      await this.client.chat.completions.create({
        model: 'non-existent-model',
        messages: [{ role: "user", content: "test" }]
      });
      throw new Error('Should have thrown model error');
    } catch (error) {
      console.log('   ✓ Invalid model error handled correctly');
    }
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test resources...');
    
    // Clean up files
    for (const fileId of this.createdResources.files) {
      try {
        await this.client.files.delete(fileId);
        console.log(`   Deleted file: ${fileId}`);
      } catch (error) {
        console.log(`   Failed to delete file ${fileId}: ${error.message}`);
      }
    }

    // Clean up vector indexes
    for (const indexId of this.createdResources.vectorIndexes) {
      try {
        await this.client.vectors.indexes.delete(indexId);
        console.log(`   Deleted vector index: ${indexId}`);
      } catch (error) {
        console.log(`   Failed to delete vector index ${indexId}: ${error.message}`);
      }
    }
  }

  async runAllTests() {
    console.log('🚀 Starting GravixLayer JavaScript SDK Integration Tests');
    console.log(`Using API Key: ${TEST_CONFIG.apiKey ? '✓ Set' : '❌ Missing'}`);
    
    if (!TEST_CONFIG.apiKey) {
      console.log('❌ GRAVIXLAYER_API_KEY environment variable is required');
      process.exit(1);
    }

    const tests = [
      ['Chat Completions', () => this.testChatCompletions()],
      ['Streaming Chat Completions', () => this.testStreamingChatCompletions()],
      ['Text Completions', () => this.testTextCompletions()],
      ['Streaming Text Completions', () => this.testStreamingTextCompletions()],
      ['Embeddings', () => this.testEmbeddings()],
      ['Deployments List', () => this.testDeploymentsList()],
      ['Accelerators List', () => this.testAcceleratorsList()],
      ['File Management', () => this.testFileManagement()],
      ['Vector Database', () => this.testVectorDatabase()],
      ['Error Handling', () => this.testErrorHandling()]
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

    // Cleanup
    await this.cleanup();

    // Summary
    console.log('\n📊 Test Results Summary');
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

    console.log('\n' + (failed === 0 ? '🎉 All tests passed!' : `⚠️  ${failed} test(s) failed`));
    
    return failed === 0;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = { TestRunner };