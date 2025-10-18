/**
 * Mock API test for GravixLayer JavaScript SDK
 * Tests implementation without requiring real API calls
 */
const { GravixLayer } = require('../dist/index.cjs');

// Mock fetch to simulate API responses
const originalFetch = global.fetch;

function mockFetch(url, options) {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      let mockResponse;
      
      if (url.includes('/chat/completions')) {
        if (options.body && JSON.parse(options.body).stream) {
          // Mock streaming response
          const chunks = [
            'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
            'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
            'data: {"choices":[{"delta":{"content":"!"}}]}\n\n',
            'data: [DONE]\n\n'
          ];
          
          let index = 0;
          mockResponse = {
            ok: true,
            status: 200,
            body: {
              getReader: () => ({
                read: () => {
                  if (index < chunks.length) {
                    return Promise.resolve({
                      done: false,
                      value: new TextEncoder().encode(chunks[index++])
                    });
                  }
                  return Promise.resolve({ done: true });
                }
              })
            }
          };
        } else {
          // Mock non-streaming response
          mockResponse = {
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              id: 'chatcmpl-123',
              object: 'chat.completion',
              created: Date.now(),
              model: 'test-model',
              choices: [{
                index: 0,
                message: {
                  role: 'assistant',
                  content: 'Hello! This is a mock response.'
                },
                finish_reason: 'stop'
              }],
              usage: {
                prompt_tokens: 10,
                completion_tokens: 8,
                total_tokens: 18
              }
            })
          };
        }
      } else if (url.includes('/completions')) {
        if (options.body && JSON.parse(options.body).stream) {
          // Mock streaming text completion
          const chunks = [
            'data: {"choices":[{"text":"The"}]}\n\n',
            'data: {"choices":[{"text":" answer"}]}\n\n',
            'data: {"choices":[{"text":" is"}]}\n\n',
            'data: [DONE]\n\n'
          ];
          
          let index = 0;
          mockResponse = {
            ok: true,
            status: 200,
            body: {
              getReader: () => ({
                read: () => {
                  if (index < chunks.length) {
                    return Promise.resolve({
                      done: false,
                      value: new TextEncoder().encode(chunks[index++])
                    });
                  }
                  return Promise.resolve({ done: true });
                }
              })
            }
          };
        } else {
          mockResponse = {
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              id: 'cmpl-123',
              object: 'text_completion',
              created: Date.now(),
              model: 'test-model',
              choices: [{
                text: 'This is a mock completion response.',
                index: 0,
                finish_reason: 'stop'
              }]
            })
          };
        }
      } else if (url.includes('/embeddings')) {
        mockResponse = {
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            object: 'list',
            data: [{
              object: 'embedding',
              embedding: new Array(1536).fill(0).map(() => Math.random() - 0.5),
              index: 0
            }],
            model: 'microsoft/multilingual-e5-large',
            usage: {
              prompt_tokens: 5,
              total_tokens: 5
            }
          })
        };
      } else if (url.includes('/deployments')) {
        mockResponse = {
          ok: true,
          status: 200,
          json: () => Promise.resolve([
            {
              deployment_id: 'dep-123',
              deployment_name: 'test-deployment',
              model_name: 'test-model',
              status: 'running',
              hardware: 'nvidia-t4-16gb-pcie_1',
              min_replicas: 1,
              created_at: new Date().toISOString()
            }
          ])
        };
      } else if (url.includes('/accelerators')) {
        mockResponse = {
          ok: true,
          status: 200,
          json: () => Promise.resolve([
            {
              name: 'NVIDIA T4',
              hardware_string: 'nvidia-t4-16gb-pcie_1',
              memory: '16GB',
              gpu_type: 'NVIDIA_T4_16GB'
            }
          ])
        };
      } else if (url.includes('/files')) {
        if (options.method === 'POST') {
          mockResponse = {
            ok: true,
            status: 201,
            json: () => Promise.resolve({
              message: 'File uploaded successfully',
              file_name: 'test-file.txt',
              purpose: 'assistants'
            })
          };
        } else if (options.method === 'GET') {
          mockResponse = {
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              data: [{
                id: 'file-123',
                object: 'file',
                bytes: 1024,
                created_at: Math.floor(Date.now() / 1000),
                filename: 'test-file.txt',
                purpose: 'assistants'
              }]
            })
          };
        } else if (options.method === 'DELETE') {
          mockResponse = {
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              message: 'File deleted successfully',
              file_id: 'file-123',
              file_name: 'test-file.txt'
            })
          };
        }
      } else if (url.includes('/vector-db')) {
        if (url.includes('/indexes') && options.method === 'POST') {
          mockResponse = {
            ok: true,
            status: 201,
            json: () => Promise.resolve({
              id: 'idx-123',
              name: 'test-index',
              vector_type: 'dense',
              delete_protection: false,
              dimension: 1536,
              metric: 'cosine',
              created_at: new Date().toISOString(),
              status: 'ready'
            })
          };
        } else if (url.includes('/indexes') && options.method === 'GET') {
          mockResponse = {
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              indexes: [{
                id: 'idx-123',
                name: 'test-index',
                dimension: 1536,
                metric: 'cosine',
                status: 'ready',
                created_at: new Date().toISOString()
              }],
              pagination: {}
            })
          };
        } else if (url.includes('/vectors/text') && options.method === 'POST') {
          mockResponse = {
            ok: true,
            status: 201,
            json: () => Promise.resolve({
              id: 'vec-123',
              text: 'test text',
              model: 'microsoft/multilingual-e5-large',
              embedding: new Array(1536).fill(0).map(() => Math.random() - 0.5),
              metadata: { test: true },
              delete_protection: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              usage: { prompt_tokens: 2, total_tokens: 2 }
            })
          };
        } else if (url.includes('/search/text') && options.method === 'POST') {
          mockResponse = {
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              hits: [{
                id: 'vec-123',
                score: 0.95,
                metadata: { test: true }
              }],
              query_time_ms: 50,
              usage: { prompt_tokens: 2, total_tokens: 2 }
            })
          };
        }
      }

      // Default mock response
      if (!mockResponse) {
        mockResponse = {
          ok: true,
          status: 200,
          json: () => Promise.resolve({ message: 'Mock response' })
        };
      }

      resolve(mockResponse);
    }, 100); // 100ms delay
  });
}

class MockAPITester {
  constructor() {
    this.testResults = [];
  }

  async runTest(testName, testFn) {
    console.log(`\n🧪 Mock API Test: ${testName}`);
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
    // Mock fetch globally
    global.fetch = mockFetch;
    
    const client = new GravixLayer({ apiKey: 'mock-key' });
    
    const completion = await client.chat.completions.create({
      model: 'test-model',
      messages: [{ role: 'user', content: 'Hello' }]
    });

    if (!completion.choices || completion.choices.length === 0) {
      throw new Error('No choices returned');
    }

    console.log(`   Response: ${completion.choices[0].message.content}`);
  }

  async testStreamingChat() {
    global.fetch = mockFetch;
    
    const client = new GravixLayer({ apiKey: 'mock-key' });
    
    const stream = await client.chat.completions.create({
      model: 'test-model',
      messages: [{ role: 'user', content: 'Hello' }],
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

    console.log(`   Received ${chunks} chunks: "${content}"`);
  }

  async testTextCompletions() {
    global.fetch = mockFetch;
    
    const client = new GravixLayer({ apiKey: 'mock-key' });
    
    const completion = await client.completions.create({
      model: 'test-model',
      prompt: 'Hello'
    });

    if (!completion.choices || completion.choices.length === 0) {
      throw new Error('No choices returned');
    }

    console.log(`   Response: "${completion.choices[0].text}"`);
  }

  async testEmbeddings() {
    global.fetch = mockFetch;
    
    const client = new GravixLayer({ apiKey: 'mock-key' });
    
    const embedding = await client.embeddings.create({
      model: 'microsoft/multilingual-e5-large',
      input: 'Hello'
    });

    if (!embedding.data || embedding.data.length === 0) {
      throw new Error('No embedding data returned');
    }

    console.log(`   Embedding dimension: ${embedding.data[0].embedding.length}`);
  }

  async testDeployments() {
    global.fetch = mockFetch;
    
    const client = new GravixLayer({ apiKey: 'mock-key' });
    
    const deployments = await client.deployments.list();
    
    if (!Array.isArray(deployments)) {
      throw new Error('Deployments should be an array');
    }

    console.log(`   Found ${deployments.length} deployments`);
  }

  async testVectorOperations() {
    global.fetch = mockFetch;
    
    const client = new GravixLayer({ apiKey: 'mock-key' });
    
    // Create index
    const index = await client.vectors.indexes.create({
      name: 'test-index',
      dimension: 1536,
      metric: 'cosine'
    });

    console.log(`   Created index: ${index.name}`);

    // Upsert text vector
    const vectors = client.vectors.index(index.id);
    const textVector = await vectors.upsertText({
      text: 'test text',
      model: 'microsoft/multilingual-e5-large',
      metadata: { test: true }
    });

    console.log(`   Upserted vector: ${textVector.id}`);

    // Search
    const searchResults = await vectors.searchText({
      query: 'test',
      model: 'microsoft/multilingual-e5-large',
      top_k: 5
    });

    console.log(`   Search found ${searchResults.hits.length} results`);
  }

  async runAllTests() {
    console.log('🚀 Starting Mock API Tests (No real API calls)');
    
    const tests = [
      ['Chat Completions', () => this.testChatCompletions()],
      ['Streaming Chat', () => this.testStreamingChat()],
      ['Text Completions', () => this.testTextCompletions()],
      ['Embeddings', () => this.testEmbeddings()],
      ['Deployments', () => this.testDeployments()],
      ['Vector Operations', () => this.testVectorOperations()]
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

    // Restore original fetch
    global.fetch = originalFetch;

    // Summary
    console.log('\n📊 Mock API Test Results Summary');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${tests.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);

    console.log('\n' + (failed === 0 ? '🎉 All mock API tests passed!' : `⚠️  ${failed} test(s) failed`));
    
    return failed === 0;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new MockAPITester();
  tester.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Mock API test runner failed:', error);
      process.exit(1);
    });
}

module.exports = { MockAPITester };