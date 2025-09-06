#!/usr/bin/env node

import { GravixLayer } from './client';
import { program } from 'commander';

interface ChatOptions {
  apiKey?: string;
  model: string;
  system?: string;
  user?: string;
  prompt?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  mode: 'chat' | 'completions';
}

interface DeploymentCreateOptions {
  apiKey?: string;
  deploymentName: string;
  hwType: string;
  hardware: string;
  minReplicas: number;
  modelName: string;
  autoRetry?: boolean;
  wait?: boolean;
}

interface DeploymentListOptions {
  apiKey?: string;
  json?: boolean;
}

interface DeploymentDeleteOptions {
  apiKey?: string;
}

interface HardwareOptions {
  apiKey?: string;
  list?: boolean;
  json?: boolean;
}

async function handleChatCommands(options: ChatOptions) {
  if (options.mode === 'chat' && !options.user) {
    console.error('Error: --user is required for chat mode');
    process.exit(1);
  }
  if (options.mode === 'completions' && !options.prompt) {
    console.error('Error: --prompt is required for completions mode');
    process.exit(1);
  }

  const client = new GravixLayer({
    apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY
  });

  try {
    if (options.mode === 'chat') {
      const messages: any[] = [];
      if (options.system) {
        messages.push({ role: 'system', content: options.system });
      }
      messages.push({ role: 'user', content: options.user });

      if (options.stream) {
        const stream = await client.chat.completions.create({
          model: options.model,
          messages,
          temperature: options.temperature,
          max_tokens: options.maxTokens,
          stream: true
        }) as unknown as AsyncIterable<any>;

        for await (const chunk of stream) {
          if (chunk.choices[0]?.delta?.content) {
            process.stdout.write(chunk.choices[0].delta.content);
          }
        }
        console.log();
      } else {
        const completion = await client.chat.completions.create({
          model: options.model,
          messages,
          temperature: options.temperature,
          max_tokens: options.maxTokens
        });
        console.log(completion.choices[0]?.message?.content);
      }
    } else {
      // Text completions mode
      if (options.stream) {
        const stream = await client.completions.create({
          model: options.model,
          prompt: options.prompt!,
          temperature: options.temperature,
          max_tokens: options.maxTokens,
          stream: true
        }) as unknown as AsyncIterable<any>;

        for await (const chunk of stream) {
          if (chunk.choices[0]?.text) {
            process.stdout.write(chunk.choices[0].text);
          }
        }
        console.log();
      } else {
        const completion = await client.completions.create({
          model: options.model,
          prompt: options.prompt!,
          temperature: options.temperature,
          max_tokens: options.maxTokens
        });
        console.log(completion.choices[0]?.text);
      }
    }
  } catch (error) {
    console.error(`❌ Error: ${error}`);
    process.exit(1);
  }
}

async function waitForDeploymentReady(client: GravixLayer, deploymentId: string, deploymentName: string) {
  console.log();
  console.log(`⏳ Waiting for deployment '${deploymentName}' to be ready...`);
  console.log('   Press Ctrl+C to stop monitoring (deployment will continue in background)');

  const checkStatus = async () => {
    try {
      const deployments = await client.deployments.list();
      const currentDeployment = deployments.find(dep => dep.deployment_id === deploymentId);

      if (currentDeployment) {
        const status = currentDeployment.status.toLowerCase();
        console.log(`   Status: ${currentDeployment.status}`);

        if (['running', 'ready', 'active'].includes(status)) {
          console.log();
          console.log('🚀 Deployment is now ready!');
          console.log(`Deployment ID: ${currentDeployment.deployment_id}`);
          console.log(`Deployment Name: ${currentDeployment.deployment_name}`);
          console.log(`Status: ${currentDeployment.status}`);
          console.log(`Model: ${currentDeployment.model_name}`);
          console.log(`Hardware: ${currentDeployment.hardware}`);
          return true;
        } else if (['failed', 'error', 'stopped'].includes(status)) {
          console.log();
          console.log(`❌ Deployment failed with status: ${currentDeployment.status}`);
          return true;
        } else {
          // Still creating/pending
          return false;
        }
      } else {
        console.log('   ❌ Deployment not found');
        return true;
      }
    } catch (error) {
      console.log(`   Error checking status: ${error}`);
      return false;
    }
  };

  const interval = setInterval(async () => {
    const isDone = await checkStatus();
    if (isDone) {
      clearInterval(interval);
    }
  }, 10000); // Check every 10 seconds

  // Handle Ctrl+C
  process.on('SIGINT', () => {
    clearInterval(interval);
    console.log();
    console.log('⏹️  Monitoring stopped. Deployment continues in background.');
    console.log('   Check status with: gravixlayer deployments list');
    process.exit(0);
  });
}

async function handleDeploymentCreate(deploymentName: string, options: DeploymentCreateOptions) {
  const client = new GravixLayer({
    apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY
  });

  console.log(`Creating deployment '${deploymentName}' with model '${options.modelName}'...`);

  let finalDeploymentName = deploymentName;
  if (options.autoRetry) {
    const timestamp = Date.now().toString().slice(-4);
    const suffix = Math.random().toString(36).substring(2, 6);
    finalDeploymentName = `${deploymentName}-${timestamp}${suffix}`;
    console.log(`Using unique name: '${finalDeploymentName}'`);
  }

  try {
    const response = await client.deployments.create({
      deployment_name: finalDeploymentName,
      model_name: options.modelName,
      hardware: options.hardware,
      min_replicas: options.minReplicas,
      hw_type: options.hwType
    });

    console.log('✅ Deployment created successfully!');
    console.log(`Deployment ID: ${response.deployment_id}`);
    console.log(`Deployment Name: ${finalDeploymentName}`);
    console.log(`Status: ${response.status}`);
    console.log(`Model: ${options.modelName}`);
    console.log(`Hardware: ${options.hardware}`);

    if (options.wait) {
      await waitForDeploymentReady(client, response.deployment_id, finalDeploymentName);
    } else {
      if (response.status && ['creating', 'pending'].includes(response.status.toLowerCase())) {
        console.log();
        console.log('💡 Tip: Use --wait flag to monitor deployment status automatically');
        console.log('   Or check status with: gravixlayer deployments list');
      } else if (response.status && ['running', 'ready'].includes(response.status.toLowerCase())) {
        console.log('🚀 Deployment is ready to use!');
      }
    }
  } catch (error: any) {
    const errorStr = error.message || String(error);
    
    try {
      if (errorStr.startsWith('{') && errorStr.endsWith('}')) {
        const errorData = JSON.parse(errorStr);
        const errorMessage = errorData.error || errorStr;
        
        if (errorMessage.toLowerCase().includes('already exists')) {
          // Wait a moment and check if deployment was created
          setTimeout(async () => {
            try {
              const deployments = await client.deployments.list();
              const deploymentFound = deployments.find(dep => dep.deployment_name === finalDeploymentName);
              
              if (deploymentFound) {
                console.log('✅ Deployment created successfully!');
                console.log(`Deployment ID: ${deploymentFound.deployment_id}`);
                console.log(`Deployment Name: ${deploymentFound.deployment_name}`);
                console.log(`Status: ${deploymentFound.status}`);
                console.log(`Model: ${deploymentFound.model_name}`);
                console.log(`Hardware: ${deploymentFound.hardware}`);
                
                if (options.wait) {
                  await waitForDeploymentReady(client, deploymentFound.deployment_id, deploymentFound.deployment_name);
                }
              } else {
                console.log(`❌ Deployment creation failed: ${errorMessage}`);
                if (!options.autoRetry) {
                  console.log(`Try with --auto-retry flag: gravixlayer deployments create --deployment-name "${deploymentName}" --hardware "${options.hardware}" --model-name "${options.modelName}" --auto-retry`);
                }
              }
            } catch {
              console.log(`❌ Deployment creation failed: ${errorMessage}`);
            }
          }, 3000);
        } else {
          console.log(`❌ Deployment creation failed: ${errorMessage}`);
        }
      } else {
        console.log(`❌ Deployment creation failed: ${errorStr}`);
      }
    } catch {
      console.log(`❌ Deployment creation failed: ${errorStr}`);
    }
  }
}

async function handleDeploymentList(options: DeploymentListOptions) {
  const client = new GravixLayer({
    apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY
  });

  try {
    const deployments = await client.deployments.list();

    if (options.json) {
      console.log(JSON.stringify(deployments, null, 2));
    } else {
      if (deployments.length === 0) {
        console.log('No deployments found.');
      } else {
        console.log(`Found ${deployments.length} deployment(s):`);
        console.log();
        for (const deployment of deployments) {
          console.log(`Deployment ID: ${deployment.deployment_id}`);
          console.log(`Deployment Name: ${deployment.deployment_name}`);
          console.log(`Model: ${deployment.model_name}`);
          console.log(`Status: ${deployment.status}`);
          console.log(`Hardware: ${deployment.hardware}`);
          console.log(`Replicas: ${deployment.min_replicas}`);
          console.log(`Created: ${deployment.created_at}`);
          console.log();
        }
      }
    }
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
}

async function handleDeploymentDelete(deploymentId: string, options: DeploymentDeleteOptions) {
  const client = new GravixLayer({
    apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY
  });

  try {
    console.log(`Deleting deployment ${deploymentId}...`);
    const response = await client.deployments.delete(deploymentId);
    console.log('Deployment deleted successfully!');
    console.log(`   Response:`, response);
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
}

async function handleHardwareList(type: 'hardware' | 'gpu', options: HardwareOptions) {
  const client = new GravixLayer({
    apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY
  });

  try {
    const accelerators = await client.accelerators.list();

    if (options.json) {
      // Filter out unwanted fields from JSON output
      const filteredAccelerators = accelerators.map(a => {
        const { name, memory, gpu_type, use_case, ...filtered } = a;
        return filtered;
      });
      console.log(JSON.stringify(filteredAccelerators, null, 2));
    } else {
      if (accelerators.length === 0) {
        console.log(`No ${type === 'hardware' ? 'accelerators/GPUs' : 'GPUs'} found.`);
      } else {
        console.log(`Available ${type === 'hardware' ? 'Hardware' : 'GPUs'} (${accelerators.length} found):`);
        console.log();
        console.log(`${'Accelerator'.padEnd(15)} ${'Hardware String'.padEnd(35)} ${'Memory'.padEnd(10)}`);
        console.log('-'.repeat(60));

        for (const accelerator of accelerators) {
          const gpuType = accelerator.gpu_type || accelerator.name;
          const hardwareString = accelerator.hardware_string;
          const memory = accelerator.memory || 'N/A';

          console.log(`${gpuType.padEnd(15)} ${hardwareString.padEnd(35)} ${memory.padEnd(10)}`);
        }
      }
    }
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
}

// Set up CLI
program
  .name('gravixlayer')
  .description('GravixLayer CLI – Chat Completions, Text Completions, and Deployment Management')
  .version('0.0.1');

// Chat command
const chatCmd = program
  .command('chat')
  .description('Chat completions')
  .option('--api-key <key>', 'API key')
  .requiredOption('--model <model>', 'Model name')
  .option('--system <prompt>', 'System prompt (optional)')
  .option('--user <message>', 'User prompt/message (chat mode)')
  .option('--prompt <prompt>', 'Direct prompt (completions mode)')
  .option('--temperature <temp>', 'Temperature', parseFloat)
  .option('--max-tokens <tokens>', 'Maximum tokens to generate', parseInt)
  .option('--stream', 'Stream output')
  .option('--mode <mode>', 'API mode', 'chat')
  .action((options) => handleChatCommands(options));

// Deployments command
const deploymentsCmd = program
  .command('deployments')
  .description('Deployment management');

// Create deployment
deploymentsCmd
  .command('create')
  .description('Create a new deployment')
  .option('--api-key <key>', 'API key')
  .requiredOption('--deployment-name <name>', 'Deployment name')
  .option('--hw-type <type>', 'Hardware type', 'dedicated')
  .requiredOption('--hardware <hardware>', 'Hardware specification')
  .option('--min-replicas <replicas>', 'Minimum replicas', parseInt, 1)
  .requiredOption('--model-name <model>', 'Model name to deploy')
  .option('--auto-retry', 'Auto-retry with unique name if deployment name exists')
  .option('--wait', 'Wait for deployment to be ready before exiting')
  .action((options) => handleDeploymentCreate(options.deploymentName, options));

// List deployments
deploymentsCmd
  .command('list')
  .description('List all deployments')
  .option('--api-key <key>', 'API key')
  .option('--json', 'Output as JSON')
  .action((options) => handleDeploymentList(options));

// Delete deployment
deploymentsCmd
  .command('delete <deploymentId>')
  .description('Delete a deployment')
  .option('--api-key <key>', 'API key')
  .action((deploymentId, options) => handleDeploymentDelete(deploymentId, options));

// Hardware listing
deploymentsCmd
  .command('hardware')
  .description('List available hardware/GPUs')
  .option('--api-key <key>', 'API key')
  .option('--list', 'List available hardware')
  .option('--json', 'Output as JSON')
  .action((options) => {
    if (options.list) {
      handleHardwareList('hardware', options);
    } else {
      console.log('Use --list flag to list available hardware');
      console.log('Example: gravixlayer deployments hardware --list');
    }
  });

// GPU listing (alias for hardware)
deploymentsCmd
  .command('gpu')
  .description('List available GPUs')
  .option('--api-key <key>', 'API key')
  .option('--list', 'List available GPUs')
  .option('--json', 'Output as JSON')
  .action((options) => {
    if (options.list) {
      handleHardwareList('gpu', options);
    } else {
      console.log('Use --list flag to list available GPUs');
      console.log('Example: gravixlayer deployments gpu --list');
    }
  });

// For backward compatibility, add top-level options
program
  .option('--api-key <key>', 'API key')
  .option('--model <model>', 'Model name')
  .option('--system <prompt>', 'System prompt (optional)')
  .option('--user <message>', 'User prompt/message')
  .option('--prompt <prompt>', 'Direct prompt')
  .option('--temperature <temp>', 'Temperature', parseFloat)
  .option('--max-tokens <tokens>', 'Maximum tokens to generate', parseInt)
  .option('--stream', 'Stream output')
  .option('--mode <mode>', 'API mode', 'chat');

// Handle top-level execution (backward compatibility)
program.action((options) => {
  if (options.model) {
    handleChatCommands(options);
  } else {
    program.help();
  }
});

program.parse();