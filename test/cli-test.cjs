/**
 * CLI Test Script for GravixLayer JavaScript SDK
 * Tests all CLI commands and functionality
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class CLITester {
  constructor() {
    this.cliPath = path.join(__dirname, '../dist/cli.js');
    this.testResults = [];
    this.createdFiles = [];
  }

  async runCLICommand(args, input = null) {
    return new Promise((resolve, reject) => {
      const child = spawn('node', [this.cliPath, ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env }
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      if (input) {
        child.stdin.write(input);
        child.stdin.end();
      }

      child.on('close', (code) => {
        resolve({ code, stdout, stderr });
      });

      child.on('error', (error) => {
        reject(error);
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        child.kill();
        reject(new Error('Command timeout'));
      }, 30000);
    });
  }

  async testCLICommand(testName, args, expectedInOutput = null, input = null) {
    console.log(`\n🧪 Testing CLI: ${testName}`);
    console.log(`   Command: gravixlayer ${args.join(' ')}`);
    
    try {
      const result = await this.runCLICommand(args, input);
      
      if (result.code !== 0) {
        throw new Error(`Command failed with code ${result.code}: ${result.stderr}`);
      }

      if (expectedInOutput && !result.stdout.includes(expectedInOutput)) {
        throw new Error(`Expected "${expectedInOutput}" in output, got: ${result.stdout}`);
      }

      console.log(`✅ PASSED: ${testName}`);
      console.log(`   Output: ${result.stdout.split('\n')[0]}...`);
      this.testResults.push({ name: testName, status: 'PASSED' });
      return result;
    } catch (error) {
      console.log(`❌ FAILED: ${testName}`);
      console.log(`   Error: ${error.message}`);
      this.testResults.push({ name: testName, status: 'FAILED', error: error.message });
      return null;
    }
  }

  async testBasicChatCompletion() {
    return await this.testCLICommand(
      'Basic Chat Completion',
      [
        '--model', 'meta-llama/llama-3.1-8b-instruct',
        '--user', 'Say hello',
        '--max-tokens', '10'
      ],
      null // Don't check for specific output as it may vary
    );
  }

  async testStreamingChat() {
    return await this.testCLICommand(
      'Streaming Chat',
      [
        '--model', 'meta-llama/llama-3.1-8b-instruct',
        '--user', 'Count to 3',
        '--stream',
        '--max-tokens', '20'
      ]
    );
  }

  async testTextCompletion() {
    return await this.testCLICommand(
      'Text Completion',
      [
        '--mode', 'completions',
        '--model', 'meta-llama/llama-3.1-8b-instruct',
        '--prompt', 'The capital of France is',
        '--max-tokens', '5'
      ]
    );
  }

  async testDeploymentsList() {
    return await this.testCLICommand(
      'List Deployments',
      ['deployments', 'list']
    );
  }

  async testDeploymentsListJSON() {
    return await this.testCLICommand(
      'List Deployments JSON',
      ['deployments', 'list', '--json']
    );
  }

  async testHardwareList() {
    return await this.testCLICommand(
      'List Hardware',
      ['deployments', 'hardware', '--list']
    );
  }

  async testGPUList() {
    return await this.testCLICommand(
      'List GPUs',
      ['deployments', 'gpu', '--list']
    );
  }

  async testFileOperations() {
    // Create a test file
    const testFilePath = path.join(__dirname, 'cli-test-file.txt');
    fs.writeFileSync(testFilePath, 'This is a CLI test file.');
    this.createdFiles.push(testFilePath);

    try {
      // Test file upload
      const uploadResult = await this.testCLICommand(
        'File Upload',
        ['files', 'upload', testFilePath, '--purpose', 'assistants', '--file-name', 'cli-test.txt'],
        'uploaded successfully'
      );

      if (!uploadResult) return;

      // Test file list
      const listResult = await this.testCLICommand(
        'File List',
        ['files', 'list']
      );

      if (!listResult) return;

      // Test file list JSON
      await this.testCLICommand(
        'File List JSON',
        ['files', 'list', '--json']
      );

      // Extract file ID or name from list for further operations
      const fileLines = listResult.stdout.split('\n');
      let fileId = null;
      
      for (const line of fileLines) {
        if (line.includes('ID: file-')) {
          fileId = line.split('ID: ')[1].trim();
          break;
        }
      }

      if (fileId) {
        // Test file info
        await this.testCLICommand(
          'File Info',
          ['files', 'info', fileId]
        );

        // Test file download
        const downloadPath = path.join(__dirname, 'downloaded-cli-test.txt');
        await this.testCLICommand(
          'File Download',
          ['files', 'download', fileId, '--output', downloadPath]
        );

        if (fs.existsSync(downloadPath)) {
          fs.unlinkSync(downloadPath);
        }

        // Test file delete
        await this.testCLICommand(
          'File Delete',
          ['files', 'delete', fileId],
          'deleted successfully'
        );
      }

    } finally {
      // Clean up test files
      this.createdFiles.forEach(file => {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      });
    }
  }

  async testVectorOperations() {
    const indexName = `cli-test-index-${Date.now()}`;
    let indexId = null;

    try {
      // Test vector index creation
      const createResult = await this.testCLICommand(
        'Vector Index Create',
        [
          'vectors', 'index', 'create',
          '--name', indexName,
          '--dimension', '1536',
          '--metric', 'cosine',
          '--metadata', '{"test": true}'
        ],
        'created successfully'
      );

      if (!createResult) return;

      // Extract index ID from output
      const lines = createResult.stdout.split('\n');
      for (const line of lines) {
        if (line.includes('Index ID:')) {
          indexId = line.split('Index ID: ')[1].trim();
          break;
        }
      }

      // Test vector index list
      await this.testCLICommand(
        'Vector Index List',
        ['vectors', 'index', 'list']
      );

      if (indexId) {
        // Test vector upsert text
        await this.testCLICommand(
          'Vector Upsert Text',
          [
            'vectors', 'vector', 'upsert-text', indexId,
            '--text', 'This is a test document',
            '--model', 'text-embedding-ada-002',
            '--id', 'test-vector-1',
            '--metadata', '{"category": "test"}'
          ],
          'upserted successfully'
        );

        // Test vector search text
        await this.testCLICommand(
          'Vector Search Text',
          [
            'vectors', 'vector', 'search-text', indexId,
            '--query', 'test document',
            '--model', 'text-embedding-ada-002',
            '--top-k', '5'
          ],
          'Search completed'
        );

        // Test vector list
        await this.testCLICommand(
          'Vector List',
          ['vectors', 'vector', 'list', indexId]
        );

        // Test vector delete
        await this.testCLICommand(
          'Vector Delete',
          ['vectors', 'vector', 'delete', indexId, 'test-vector-1'],
          'deleted successfully'
        );

        // Test index delete
        await this.testCLICommand(
          'Vector Index Delete',
          ['vectors', 'index', 'delete', indexId],
          'deleted successfully'
        );
      }

    } catch (error) {
      console.log(`Vector operations test failed: ${error.message}`);
    }
  }

  async testHelpCommands() {
    // Test main help
    await this.testCLICommand(
      'Main Help',
      ['--help'],
      'GravixLayer CLI'
    );

    // Test deployments help
    await this.testCLICommand(
      'Deployments Help',
      ['deployments', '--help'],
      'Deployment management'
    );

    // Test files help
    await this.testCLICommand(
      'Files Help',
      ['files', '--help'],
      'File management'
    );

    // Test vectors help
    await this.testCLICommand(
      'Vectors Help',
      ['vectors', '--help'],
      'Vector database management'
    );
  }

  async runAllTests() {
    console.log('🚀 Starting GravixLayer CLI Tests');
    console.log(`CLI Path: ${this.cliPath}`);
    console.log(`API Key: ${process.env.GRAVIXLAYER_API_KEY ? '✓ Set' : '❌ Missing'}`);

    if (!process.env.GRAVIXLAYER_API_KEY) {
      console.log('❌ GRAVIXLAYER_API_KEY environment variable is required');
      process.exit(1);
    }

    if (!fs.existsSync(this.cliPath)) {
      console.log('❌ CLI binary not found. Run "npm run build" first.');
      process.exit(1);
    }

    const tests = [
      ['Help Commands', () => this.testHelpCommands()],
      ['Basic Chat Completion', () => this.testBasicChatCompletion()],
      ['Streaming Chat', () => this.testStreamingChat()],
      ['Text Completion', () => this.testTextCompletion()],
      ['Deployments List', () => this.testDeploymentsList()],
      ['Deployments List JSON', () => this.testDeploymentsListJSON()],
      ['Hardware List', () => this.testHardwareList()],
      ['GPU List', () => this.testGPUList()],
      ['File Operations', () => this.testFileOperations()],
      ['Vector Operations', () => this.testVectorOperations()]
    ];

    let passed = 0;
    let failed = 0;

    for (const [testName, testFn] of tests) {
      try {
        await testFn();
        passed++;
      } catch (error) {
        console.log(`❌ Test group failed: ${testName} - ${error.message}`);
        failed++;
      }
    }

    // Summary
    console.log('\n📊 CLI Test Results Summary');
    console.log('='.repeat(50));
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.status === 'PASSED').length;
    const failedTests = this.testResults.filter(r => r.status === 'FAILED').length;

    console.log(`Total CLI Commands Tested: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests > 0) {
      console.log('\n❌ Failed CLI Commands:');
      this.testResults
        .filter(r => r.status === 'FAILED')
        .forEach(r => console.log(`   - ${r.name}: ${r.error}`));
    }

    console.log('\n' + (failedTests === 0 ? '🎉 All CLI tests passed!' : `⚠️  ${failedTests} CLI test(s) failed`));
    
    return failedTests === 0;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new CLITester();
  tester.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ CLI test runner failed:', error);
      process.exit(1);
    });
}

module.exports = { CLITester };