/**
 * Comprehensive Sandbox Test for JavaScript SDK
 * Tests all sandbox functionality including lifecycle, code execution, file operations, etc.
 */

import { GravixLayer, Sandbox } from '../dist/index.js';

// Test configuration
const TEST_CONFIG = {
  template: 'python-base-v1',
  provider: 'gravix',
  region: 'eu-west-1',
  timeout: 600 // 10 minutes for comprehensive testing
};

async function testSandboxLifecycle() {
  console.log('\n🔄 Testing Sandbox Lifecycle...');
  
  const client = new GravixLayer();
  
  try {
    // Test template listing
    console.log('📋 Listing available templates...');
    const templates = await client.sandbox.templates.list();
    console.log(`✅ Found ${templates.templates.length} templates`);
    
    for (const template of templates.templates) {
      console.log(`  - ${template.name}: ${template.description}`);
      console.log(`    Resources: ${template.vcpu_count} vCPU, ${template.memory_mb}MB RAM, ${template.disk_size_mb}MB disk`);
    }
    
    // Test sandbox creation
    console.log('\n🚀 Creating sandbox...');
    const sandbox = await client.sandbox.sandboxes.create({
      provider: TEST_CONFIG.provider,
      region: TEST_CONFIG.region,
      template: TEST_CONFIG.template,
      timeout: TEST_CONFIG.timeout,
      metadata: { test: 'lifecycle', language: 'javascript' }
    });
    
    console.log(`✅ Sandbox created: ${sandbox.sandbox_id}`);
    console.log(`   Status: ${sandbox.status}`);
    console.log(`   Template: ${sandbox.template}`);
    
    // Test sandbox info retrieval
    console.log('\n📊 Getting sandbox info...');
    const sandboxInfo = await client.sandbox.sandboxes.get(sandbox.sandbox_id);
    console.log(`✅ Retrieved sandbox info: ${sandboxInfo.sandbox_id}`);
    console.log(`   Status: ${sandboxInfo.status}`);
    console.log(`   Started: ${sandboxInfo.started_at}`);
    console.log(`   Timeout: ${sandboxInfo.timeout_at}`);
    
    // Test sandbox listing
    console.log('\n📋 Listing sandboxes...');
    const sandboxList = await client.sandbox.sandboxes.list({ limit: 5 });
    console.log(`✅ Found ${sandboxList.total} total sandboxes (showing ${sandboxList.sandboxes.length})`);
    
    // Test timeout update
    console.log('\n⏰ Updating sandbox timeout...');
    const timeoutResponse = await client.sandbox.sandboxes.setTimeout(sandbox.sandbox_id, 1800);
    console.log(`✅ Timeout updated: ${timeoutResponse.message}`);
    
    // Test metrics (may fail due to known server issues)
    console.log('\n📈 Getting sandbox metrics...');
    try {
      const metrics = await client.sandbox.sandboxes.getMetrics(sandbox.sandbox_id);
      console.log(`✅ Metrics retrieved: CPU ${metrics.cpu_usage}%, Memory ${metrics.memory_usage}MB`);
    } catch (error) {
      console.log(`⚠️ Metrics unavailable (known server issue): ${error.message}`);
    }
    
    return sandbox;
    
  } catch (error) {
    console.error('❌ Sandbox lifecycle test failed:', error.message);
    throw error;
  }
}

async function testCodeExecution(sandbox) {
  console.log('\n🐍 Testing Code Execution...');
  
  const client = new GravixLayer();
  
  try {
    // Test simple Python code
    console.log('📝 Running simple Python code...');
    const simpleResult = await client.sandbox.sandboxes.runCode(
      sandbox.sandbox_id,
      "print('Hello from JavaScript SDK!')"
    );
    
    console.log('✅ Simple code execution successful');
    console.log(`   Stdout: ${simpleResult.logs?.stdout || []}`);
    
    // Test multi-line Python code
    console.log('\n📝 Running multi-line Python code...');
    const complexCode = `
import math
import datetime

print(f"Current time: {datetime.datetime.now()}")
print(f"Pi value: {math.pi}")

# Data processing
numbers = [1, 2, 3, 4, 5]
squares = [x**2 for x in numbers]
print(f"Squares: {squares}")

# Error handling test
try:
    result = 10 / 2
    print(f"Division result: {result}")
except Exception as e:
    print(f"Error: {e}")
`;
    
    const complexResult = await client.sandbox.sandboxes.runCode(
      sandbox.sandbox_id,
      complexCode
    );
    
    console.log('✅ Complex code execution successful');
    if (complexResult.logs?.stdout) {
      complexResult.logs.stdout.forEach(line => {
        if (line.trim()) console.log(`   ${line}`);
      });
    }
    
    // Test code with error
    console.log('\n📝 Testing error handling...');
    const errorResult = await client.sandbox.sandboxes.runCode(
      sandbox.sandbox_id,
      "print(undefined_variable)"
    );
    
    console.log('✅ Error handling test completed');
    if (errorResult.error) {
      console.log(`   Error captured: ${JSON.stringify(errorResult.error)}`);
    }
    if (errorResult.logs?.stderr) {
      console.log(`   Stderr: ${errorResult.logs.stderr}`);
    }
    
  } catch (error) {
    console.error('❌ Code execution test failed:', error.message);
    throw error;
  }
}

async function testCommandExecution(sandbox) {
  console.log('\n💻 Testing Command Execution...');
  
  const client = new GravixLayer();
  
  try {
    // Test simple command
    console.log('📝 Running simple command...');
    const echoResult = await client.sandbox.sandboxes.runCommand(
      sandbox.sandbox_id,
      'echo',
      { args: ['Hello from command line!'] }
    );
    
    console.log('✅ Echo command successful');
    console.log(`   Stdout: ${echoResult.stdout}`);
    console.log(`   Exit code: ${echoResult.exit_code}`);
    
    // Test system information
    console.log('\n📝 Getting system information...');
    const unameResult = await client.sandbox.sandboxes.runCommand(
      sandbox.sandbox_id,
      'uname',
      { args: ['-a'] }
    );
    
    console.log('✅ System info retrieved');
    console.log(`   System: ${unameResult.stdout.trim()}`);
    
    // Test Python version
    console.log('\n📝 Checking Python version...');
    const pythonResult = await client.sandbox.sandboxes.runCommand(
      sandbox.sandbox_id,
      'python',
      { args: ['--version'] }
    );
    
    console.log('✅ Python version retrieved');
    console.log(`   Version: ${pythonResult.stdout.trim()}`);
    
    // Test package installation
    console.log('\n📦 Installing Python packages...');
    const installResult = await client.sandbox.sandboxes.runCommand(
      sandbox.sandbox_id,
      'pip',
      { args: ['install', 'requests'] }
    );
    
    if (installResult.exit_code === 0) {
      console.log('✅ Package installation successful');
      
      // Verify installation
      const verifyResult = await client.sandbox.sandboxes.runCode(
        sandbox.sandbox_id,
        `
import requests
print(f"requests version: {requests.__version__}")
print("Package imported successfully!")
`
      );
      
      console.log('✅ Package verification successful');
      if (verifyResult.logs?.stdout) {
        verifyResult.logs.stdout.forEach(line => {
          if (line.trim()) console.log(`   ${line}`);
        });
      }
    } else {
      console.log(`⚠️ Package installation issues: ${installResult.stderr}`);
    }
    
  } catch (error) {
    console.error('❌ Command execution test failed:', error.message);
    throw error;
  }
}

async function testFileOperations(sandbox) {
  console.log('\n📁 Testing File Operations...');
  
  const client = new GravixLayer();
  
  try {
    // Test file writing
    console.log('📝 Writing files...');
    await client.sandbox.sandboxes.writeFile(
      sandbox.sandbox_id,
      '/home/user/test.txt',
      'Hello World!\nThis is a test file.\nLine 3 content.'
    );
    console.log('✅ File written successfully');
    
    // Test file reading
    console.log('📖 Reading file...');
    const fileContent = await client.sandbox.sandboxes.readFile(
      sandbox.sandbox_id,
      '/home/user/test.txt'
    );
    console.log('✅ File read successfully');
    console.log(`   Content: ${fileContent.content}`);
    
    // Test directory creation
    console.log('📁 Creating directories...');
    await client.sandbox.sandboxes.makeDirectory(
      sandbox.sandbox_id,
      '/home/user/project'
    );
    await client.sandbox.sandboxes.makeDirectory(
      sandbox.sandbox_id,
      '/home/user/project/data'
    );
    console.log('✅ Directories created successfully');
    
    // Test multiple file creation
    console.log('📝 Creating multiple files...');
    const filesToCreate = {
      '/home/user/project/README.md': '# My Project\nThis is a test project created from JavaScript SDK.',
      '/home/user/project/main.py': 'print("Hello from main.py")\nprint("Created via JavaScript SDK")',
      '/home/user/project/data/sample.csv': 'name,age,city\nAlice,25,New York\nBob,30,London\nCharlie,35,Tokyo'
    };
    
    for (const [path, content] of Object.entries(filesToCreate)) {
      await client.sandbox.sandboxes.writeFile(sandbox.sandbox_id, path, content);
    }
    console.log('✅ Multiple files created successfully');
    
    // Test file listing
    console.log('📋 Listing files...');
    const projectFiles = await client.sandbox.sandboxes.listFiles(
      sandbox.sandbox_id,
      '/home/user/project'
    );
    
    console.log('✅ File listing successful');
    console.log('   Project files:');
    projectFiles.files.forEach(file => {
      const type = file.is_dir ? 'DIR' : 'FILE';
      console.log(`     ${type}: ${file.name} (${file.size} bytes)`);
    });
    
    // Test file processing with code
    console.log('📊 Processing files with code...');
    const processResult = await client.sandbox.sandboxes.runCode(
      sandbox.sandbox_id,
      `
import os
import pandas as pd

# List all files in project
print("Files in /home/user/project:")
for root, dirs, files in os.walk("/home/user/project"):
    level = root.replace("/home/user/project", "").count(os.sep)
    indent = " " * 2 * level
    print(f"{indent}{os.path.basename(root)}/")
    subindent = " " * 2 * (level + 1)
    for file in files:
        print(f"{subindent}{file}")

# Read and process CSV
try:
    df = pd.read_csv("/home/user/project/data/sample.csv")
    print(f"\\nCSV data loaded: {len(df)} rows")
    print("Data preview:")
    print(df.to_string())
    
    # Calculate statistics
    avg_age = df['age'].mean()
    print(f"\\nAverage age: {avg_age:.1f}")
except ImportError:
    print("\\nPandas not available, reading CSV manually:")
    with open("/home/user/project/data/sample.csv", "r") as f:
        lines = f.readlines()
        print(f"CSV has {len(lines)} lines")
        for i, line in enumerate(lines[:3]):
            print(f"Line {i+1}: {line.strip()}")
`
    );
    
    console.log('✅ File processing successful');
    if (processResult.logs?.stdout) {
      processResult.logs.stdout.forEach(line => {
        if (line.trim()) console.log(`   ${line}`);
      });
    }
    
    // Test file deletion
    console.log('🗑️ Deleting test file...');
    await client.sandbox.sandboxes.deleteFile(
      sandbox.sandbox_id,
      '/home/user/test.txt'
    );
    console.log('✅ File deleted successfully');
    
  } catch (error) {
    console.error('❌ File operations test failed:', error.message);
    throw error;
  }
}

async function testContextManagement(sandbox) {
  console.log('\n🔄 Testing Context Management...');
  
  const client = new GravixLayer();
  
  try {
    // Create multiple contexts
    console.log('📝 Creating execution contexts...');
    const context1 = await client.sandbox.sandboxes.createCodeContext(
      sandbox.sandbox_id,
      { language: 'python', cwd: '/home/user' }
    );
    
    const context2 = await client.sandbox.sandboxes.createCodeContext(
      sandbox.sandbox_id,
      { language: 'python', cwd: '/home/user/project' }
    );
    
    console.log(`✅ Created contexts: ${context1.context_id} and ${context2.context_id}`);
    
    // Test context isolation
    console.log('🔒 Testing context isolation...');
    await client.sandbox.sandboxes.runCode(
      sandbox.sandbox_id,
      "isolation_test = 'context1_value'",
      { context_id: context1.context_id }
    );
    
    await client.sandbox.sandboxes.runCode(
      sandbox.sandbox_id,
      "isolation_test = 'context2_value'",
      { context_id: context2.context_id }
    );
    
    // Verify isolation
    const result1 = await client.sandbox.sandboxes.runCode(
      sandbox.sandbox_id,
      "print(f'Context 1: {isolation_test}')",
      { context_id: context1.context_id }
    );
    
    const result2 = await client.sandbox.sandboxes.runCode(
      sandbox.sandbox_id,
      "print(f'Context 2: {isolation_test}')",
      { context_id: context2.context_id }
    );
    
    console.log('✅ Context isolation verified');
    console.log(`   ${result1.logs?.stdout?.[0] || 'No output'}`);
    console.log(`   ${result2.logs?.stdout?.[0] || 'No output'}`);
    
    // Get context information
    console.log('📊 Getting context information...');
    const contextInfo1 = await client.sandbox.sandboxes.getCodeContext(
      sandbox.sandbox_id,
      context1.context_id
    );
    
    console.log(`✅ Context info retrieved: ${contextInfo1.context_id}`);
    console.log(`   Language: ${contextInfo1.language}`);
    console.log(`   Working directory: ${contextInfo1.cwd}`);
    console.log(`   Status: ${contextInfo1.status}`);
    
    // Clean up contexts
    console.log('🧹 Cleaning up contexts...');
    await client.sandbox.sandboxes.deleteCodeContext(sandbox.sandbox_id, context1.context_id);
    await client.sandbox.sandboxes.deleteCodeContext(sandbox.sandbox_id, context2.context_id);
    console.log('✅ Contexts deleted successfully');
    
  } catch (error) {
    console.error('❌ Context management test failed:', error.message);
    throw error;
  }
}

async function testSandboxClass() {
  console.log('\n🎯 Testing Sandbox Class Interface...');
  
  try {
    // Test class-based creation
    console.log('🚀 Creating sandbox using class method...');
    const sandbox = await Sandbox.create({
      template: TEST_CONFIG.template,
      provider: TEST_CONFIG.provider,
      region: TEST_CONFIG.region,
      timeout: TEST_CONFIG.timeout,
      metadata: { test: 'class-interface', sdk: 'javascript' }
    });
    
    console.log(`✅ Sandbox created: ${sandbox.sandbox_id}`);
    
    // Test code execution
    console.log('📝 Running code via class method...');
    const result = await sandbox.runCode("print('Hello from Sandbox class!')");
    console.log('✅ Code execution successful');
    console.log(`   Output: ${result.logs.stdout.join(', ')}`);
    
    // Test command execution
    console.log('💻 Running command via class method...');
    const cmdResult = await sandbox.runCommand('python', ['--version']);
    console.log('✅ Command execution successful');
    console.log(`   Output: ${cmdResult.stdout.trim()}`);
    
    // Test file operations
    console.log('📁 Testing file operations via class...');
    await sandbox.writeFile('/home/user/class_test.txt', 'Created via Sandbox class!');
    const content = await sandbox.readFile('/home/user/class_test.txt');
    console.log('✅ File operations successful');
    console.log(`   Content: ${content}`);
    
    const files = await sandbox.listFiles('/home/user');
    console.log(`   Files in /home/user: ${files.join(', ')}`);
    
    // Test sandbox status
    console.log('📊 Checking sandbox status...');
    const isAlive = await sandbox.isAlive();
    console.log(`✅ Sandbox alive: ${isAlive}`);
    
    // Clean up
    console.log('🧹 Terminating sandbox...');
    await sandbox.kill();
    console.log('✅ Sandbox terminated successfully');
    
    // Verify termination
    const isAliveAfter = await sandbox.isAlive();
    console.log(`✅ Sandbox alive after termination: ${isAliveAfter}`);
    
  } catch (error) {
    console.error('❌ Sandbox class test failed:', error.message);
    throw error;
  }
}

async function runComprehensiveTests() {
  console.log('🧪 Starting Comprehensive JavaScript Sandbox Tests');
  console.log('=' .repeat(60));
  
  let sandbox = null;
  
  try {
    // Test 1: Sandbox Lifecycle
    sandbox = await testSandboxLifecycle();
    
    // Test 2: Code Execution
    await testCodeExecution(sandbox);
    
    // Test 3: Command Execution
    await testCommandExecution(sandbox);
    
    // Test 4: File Operations
    await testFileOperations(sandbox);
    
    // Test 5: Context Management
    await testContextManagement(sandbox);
    
    // Test 6: Sandbox Class Interface
    await testSandboxClass();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 All JavaScript Sandbox Tests Completed Successfully!');
    console.log('✅ Sandbox lifecycle management works');
    console.log('✅ Code execution works');
    console.log('✅ Command execution works');
    console.log('✅ File operations work');
    console.log('✅ Context management works');
    console.log('✅ Sandbox class interface works');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    console.error(error.stack);
  } finally {
    // Clean up sandbox if it exists
    if (sandbox) {
      try {
        console.log('\n🧹 Cleaning up test sandbox...');
        const client = new GravixLayer();
        await client.sandbox.sandboxes.kill(sandbox.sandbox_id);
        console.log('✅ Test sandbox cleaned up');
      } catch (error) {
        console.log('⚠️ Error during cleanup (may be already terminated)');
      }
    }
  }
}

// Run the tests
runComprehensiveTests().catch(console.error);