/**
 * Test CLI sandbox functionality
 */

import { execSync } from 'child_process';

function runCLI(command) {
    try {
        const result = execSync(`node ../dist/cli.cjs ${command}`, { 
            encoding: 'utf8',
            cwd: process.cwd()
        });
        return { success: true, output: result };
    } catch (error) {
        return { success: false, output: error.message, stderr: error.stderr };
    }
}

async function testCLISandbox() {
    console.log('🧪 Testing CLI Sandbox Commands');
    console.log('=' .repeat(50));
    
    try {
        // Test template listing
        console.log('📋 Testing template list...');
        const templatesResult = runCLI('sandbox template list');
        if (templatesResult.success) {
            console.log('✅ Template list command works');
            console.log(templatesResult.output);
        } else {
            console.log('❌ Template list failed:', templatesResult.output);
        }
        
        // Test sandbox creation
        console.log('\n🚀 Testing sandbox creation...');
        const createResult = runCLI('sandbox create --provider gravix --region eu-west-1 --template python-base-v1');
        if (createResult.success) {
            console.log('✅ Sandbox creation command works');
            
            // Extract sandbox ID from output (assuming it's in the output)
            const sandboxIdMatch = createResult.output.match(/sandbox_id["\s:]+([a-f0-9-]+)/i);
            if (sandboxIdMatch) {
                const sandboxId = sandboxIdMatch[1];
                console.log(`📝 Created sandbox: ${sandboxId}`);
                
                // Test sandbox info
                console.log('\n📊 Testing sandbox info...');
                const infoResult = runCLI(`sandbox get ${sandboxId}`);
                if (infoResult.success) {
                    console.log('✅ Sandbox info command works');
                } else {
                    console.log('❌ Sandbox info failed:', infoResult.output);
                }
                
                // Test code execution
                console.log('\n📝 Testing code execution...');
                const codeResult = runCLI(`sandbox code ${sandboxId} "print('Hello from CLI!')"`);
                if (codeResult.success) {
                    console.log('✅ Code execution command works');
                    console.log(codeResult.output);
                } else {
                    console.log('❌ Code execution failed:', codeResult.output);
                }
                
                // Test command execution
                console.log('\n💻 Testing command execution...');
                const cmdResult = runCLI(`sandbox run ${sandboxId} python --args "--version"`);
                if (cmdResult.success) {
                    console.log('✅ Command execution works');
                    console.log(cmdResult.output);
                } else {
                    console.log('❌ Command execution failed:', cmdResult.output);
                }
                
                // Test file operations
                console.log('\n📁 Testing file operations...');
                const fileWriteResult = runCLI(`sandbox file write ${sandboxId} "/home/user/cli_test.txt" "Hello from CLI!"`);
                if (fileWriteResult.success) {
                    console.log('✅ File write command works');
                    
                    const fileReadResult = runCLI(`sandbox file read ${sandboxId} "/home/user/cli_test.txt"`);
                    if (fileReadResult.success) {
                        console.log('✅ File read command works');
                        console.log(fileReadResult.output);
                    } else {
                        console.log('❌ File read failed:', fileReadResult.output);
                    }
                } else {
                    console.log('❌ File write failed:', fileWriteResult.output);
                }
                
                // Clean up
                console.log('\n🧹 Cleaning up sandbox...');
                const killResult = runCLI(`sandbox kill ${sandboxId}`);
                if (killResult.success) {
                    console.log('✅ Sandbox cleanup successful');
                } else {
                    console.log('❌ Sandbox cleanup failed:', killResult.output);
                }
            } else {
                console.log('❌ Could not extract sandbox ID from creation output');
            }
        } else {
            console.log('❌ Sandbox creation failed:', createResult.output);
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('🎉 CLI Sandbox Tests Completed');
        
    } catch (error) {
        console.error('❌ CLI test failed:', error.message);
    }
}

// Run the CLI tests
testCLISandbox().catch(console.error);