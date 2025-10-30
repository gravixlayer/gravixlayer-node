import { GravixLayer } from "./client";
import { program } from "commander";
import { readFileSync, writeFileSync } from "fs";
import { FilePurpose } from "./types/files";

interface ChatOptions {
  apiKey?: string;
  model: string;
  system?: string;
  user?: string;
  prompt?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  mode: "chat" | "completions";
}

interface DeploymentCreateOptions {
  apiKey?: string;
  deploymentName: string;
  hwType: string;
  gpuModel: string;
  gpuCount: number;
  minReplicas: number;
  maxReplicas: number;
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

interface FileUploadOptions {
  apiKey?: string;
  purpose: FilePurpose;
  fileName?: string;
  expiresAfter?: number;
}

interface FileListOptions {
  apiKey?: string;
  json?: boolean;
}

interface FileInfoOptions {
  apiKey?: string;
}

interface FileDownloadOptions {
  apiKey?: string;
  output?: string;
}

interface FileDeleteOptions {
  apiKey?: string;
}

interface VectorIndexCreateOptions {
  apiKey?: string;
  name: string;
  dimension: number;
  metric: string;
  metadata?: string;
}

interface VectorIndexListOptions {
  apiKey?: string;
  json?: boolean;
}

interface VectorUpsertTextOptions {
  apiKey?: string;
  text: string;
  model: string;
  id?: string;
  metadata?: string;
}

interface VectorSearchTextOptions {
  apiKey?: string;
  query: string;
  model: string;
  topK: number;
  filter?: string;
}

async function handleChatCommands(options: ChatOptions) {
  if (options.mode === "chat" && !options.user) {
    console.error("Error: --user is required for chat mode");
    process.exit(1);
  }
  if (options.mode === "completions" && !options.prompt) {
    console.error("Error: --prompt is required for completions mode");
    process.exit(1);
  }

  const client = new GravixLayer({
    apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
  });

  try {
    if (options.mode === "chat") {
      const messages: any[] = [];
      if (options.system) {
        messages.push({ role: "system", content: options.system });
      }
      messages.push({ role: "user", content: options.user });

      if (options.stream) {
        const stream = (await client.chat.completions.create({
          model: options.model,
          messages,
          temperature: options.temperature,
          max_tokens: options.maxTokens,
          stream: true,
        })) as unknown as AsyncIterable<any>;

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
          max_tokens: options.maxTokens,
        });
        console.log(completion.choices[0]?.message?.content);
      }
    } else {
      // Text completions mode
      if (options.stream) {
        const stream = (await client.completions.create({
          model: options.model,
          prompt: options.prompt!,
          temperature: options.temperature,
          max_tokens: options.maxTokens,
          stream: true,
        })) as unknown as AsyncIterable<any>;

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
          max_tokens: options.maxTokens,
        });
        console.log(completion.choices[0]?.text);
      }
    }
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
}

async function waitForDeploymentReady(
  client: GravixLayer,
  deploymentId: string,
  deploymentName: string,
) {
  console.log();
  console.log(`⏳ Waiting for deployment '${deploymentName}' to be ready...`);
  console.log(
    "   Press Ctrl+C to stop monitoring (deployment will continue in background)",
  );

  const checkStatus = async () => {
    try {
      const deployments = await client.deployments.list();
      const currentDeployment = deployments.find(
        (dep) => dep.deployment_id === deploymentId,
      );

      if (currentDeployment) {
        const status = currentDeployment.status.toLowerCase();
        console.log(`   Status: ${currentDeployment.status}`);

        if (["running", "ready", "active"].includes(status)) {
          console.log();
          console.log("Deployment is now ready!");
          console.log(`Deployment ID: ${currentDeployment.deployment_id}`);
          console.log(`Deployment Name: ${currentDeployment.deployment_name}`);
          console.log(`Status: ${currentDeployment.status}`);
          console.log(`Model: ${currentDeployment.model_name}`);
          console.log(`GPU Model: ${currentDeployment.gpu_model}`);
          return true;
        } else if (["failed", "error", "stopped"].includes(status)) {
          console.log();
          console.log(
            `Deployment failed with status: ${currentDeployment.status}`,
          );
          return true;
        } else {
          // Still creating/pending
          return false;
        }
      } else {
        console.log("   Deployment not found");
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
  process.on("SIGINT", () => {
    clearInterval(interval);
    console.log();
    console.log("Monitoring stopped. Deployment continues in background.");
    console.log("   Check status with: gravixlayer deployments list");
    process.exit(0);
  });
}

async function handleDeploymentCreate(
  deploymentName: string,
  options: DeploymentCreateOptions,
) {
  const client = new GravixLayer({
    apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
  });

  console.log(
    `Creating deployment '${deploymentName}' with model '${options.modelName}'...`,
  );

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
      gpu_model: options.gpuModel,
      gpu_count: options.gpuCount,
      min_replicas: options.minReplicas,
      max_replicas: options.maxReplicas,
      hw_type: options.hwType,
    });

    console.log("✅ Deployment created successfully!");
    console.log(`Deployment ID: ${response.deployment_id}`);
    console.log(`Deployment Name: ${finalDeploymentName}`);
    console.log(`Status: ${response.status}`);
    console.log(`Model: ${options.modelName}`);
    console.log(`GPU Model: ${options.gpuModel}`);

    if (options.wait) {
      await waitForDeploymentReady(
        client,
        response.deployment_id,
        finalDeploymentName,
      );
    } else {
      if (
        response.status &&
        ["creating", "pending"].includes(response.status.toLowerCase())
      ) {
        console.log();
        console.log(
          "💡 Tip: Use --wait flag to monitor deployment status automatically",
        );
        console.log("   Or check status with: gravixlayer deployments list");
      } else if (
        response.status &&
        ["running", "ready"].includes(response.status.toLowerCase())
      ) {
        console.log("🚀 Deployment is ready to use!");
      }
    }
  } catch (error: any) {
    const errorStr = error.message || String(error);

    try {
      if (errorStr.startsWith("{") && errorStr.endsWith("}")) {
        const errorData = JSON.parse(errorStr);
        const errorMessage = errorData.error || errorStr;

        if (errorMessage.toLowerCase().includes("already exists")) {
          // Wait a moment and check if deployment was created
          setTimeout(async () => {
            try {
              const deployments = await client.deployments.list();
              const deploymentFound = deployments.find(
                (dep) => dep.deployment_name === finalDeploymentName,
              );

              if (deploymentFound) {
                console.log("✅ Deployment created successfully!");
                console.log(`Deployment ID: ${deploymentFound.deployment_id}`);
                console.log(
                  `Deployment Name: ${deploymentFound.deployment_name}`,
                );
                console.log(`Status: ${deploymentFound.status}`);
                console.log(`Model: ${deploymentFound.model_name}`);
                console.log(`Hardware: ${deploymentFound.hardware}`);

                if (options.wait) {
                  await waitForDeploymentReady(
                    client,
                    deploymentFound.deployment_id,
                    deploymentFound.deployment_name,
                  );
                }
              } else {
                console.log(`❌ Deployment creation failed: ${errorMessage}`);
                if (!options.autoRetry) {
                  console.log(
                    `Try with --auto-retry flag: gravixlayer deployments create --deployment-name "${deploymentName}" --gpu-model "${options.gpuModel}" --model-name "${options.modelName}" --auto-retry`,
                  );
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
    apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
  });

  try {
    const deployments = await client.deployments.list();

    if (options.json) {
      console.log(JSON.stringify(deployments, null, 2));
    } else {
      if (deployments.length === 0) {
        console.log("No deployments found.");
      } else {
        console.log(`Found ${deployments.length} deployment(s):`);
        console.log();
        for (const deployment of deployments) {
          console.log(`Deployment ID: ${deployment.deployment_id}`);
          console.log(`Deployment Name: ${deployment.deployment_name}`);
          console.log(`Model: ${deployment.model_name}`);
          console.log(`Status: ${deployment.status}`);
          console.log(`GPU Model: ${deployment.gpu_model}`);
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

async function handleDeploymentDelete(
  deploymentId: string,
  options: DeploymentDeleteOptions,
) {
  const client = new GravixLayer({
    apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
  });

  try {
    console.log(`Deleting deployment ${deploymentId}...`);
    const response = await client.deployments.delete(deploymentId);
    console.log("Deployment deleted successfully!");
    console.log(`   Response:`, response);
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
}

async function handleFileUpload(filePath: string, options: FileUploadOptions) {
  const client = new GravixLayer({
    apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
  });

  try {
    console.log(
      `Uploading file '${filePath}' with purpose '${options.purpose}'...`,
    );

    const response = await client.files.create({
      file: filePath,
      purpose: options.purpose,
      filename: options.fileName,
      expires_after: options.expiresAfter,
    });

    console.log("✅ File uploaded successfully!");
    console.log(`File Name: ${response.file_name}`);
    console.log(`Purpose: ${response.purpose}`);
    console.log(`Message: ${response.message}`);
  } catch (error) {
    console.error(`❌ Error uploading file: ${error}`);
    process.exit(1);
  }
}

async function handleFileList(options: FileListOptions) {
  const client = new GravixLayer({
    apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
  });

  try {
    const response = await client.files.list();

    if (options.json) {
      console.log(JSON.stringify(response.data, null, 2));
    } else {
      if (response.data.length === 0) {
        console.log("No files found.");
      } else {
        console.log(`Found ${response.data.length} file(s):`);
        console.log();
        for (const file of response.data) {
          console.log(`ID: ${file.id}`);
          console.log(`Filename: ${file.filename}`);
          console.log(`Size: ${file.bytes} bytes`);
          console.log(`Purpose: ${file.purpose}`);
          console.log(
            `Created: ${new Date(file.created_at * 1000).toISOString()}`,
          );
          if (file.expires_after) {
            console.log(`Expires After: ${file.expires_after} seconds`);
          }
          console.log("---");
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error listing files: ${error}`);
    process.exit(1);
  }
}

async function handleFileInfo(fileIdOrName: string, options: FileInfoOptions) {
  const client = new GravixLayer({
    apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
  });

  try {
    let fileId = fileIdOrName;

    // If it doesn't look like a file ID, try to find by filename
    if (!fileIdOrName.startsWith("file-")) {
      const files = await client.files.list();
      const file = files.data.find((f) => f.filename === fileIdOrName);
      if (!file) {
        console.error(`❌ File not found: ${fileIdOrName}`);
        process.exit(1);
      }
      fileId = file.id;
    }

    const file = await client.files.retrieve(fileId);

    console.log(`File Information:`);
    console.log(`ID: ${file.id}`);
    console.log(`Filename: ${file.filename}`);
    console.log(`Size: ${file.bytes} bytes`);
    console.log(`Purpose: ${file.purpose}`);
    console.log(`Created: ${new Date(file.created_at * 1000).toISOString()}`);
    if (file.expires_after) {
      console.log(`Expires After: ${file.expires_after} seconds`);
    }
  } catch (error) {
    console.error(`❌ Error getting file info: ${error}`);
    process.exit(1);
  }
}

async function handleFileDownload(
  fileIdOrName: string,
  options: FileDownloadOptions,
) {
  const client = new GravixLayer({
    apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
  });

  try {
    let fileId = fileIdOrName;
    let filename = options.output;

    // If it doesn't look like a file ID, try to find by filename
    if (!fileIdOrName.startsWith("file-")) {
      const files = await client.files.list();
      const file = files.data.find((f) => f.filename === fileIdOrName);
      if (!file) {
        console.error(`❌ File not found: ${fileIdOrName}`);
        process.exit(1);
      }
      fileId = file.id;
      if (!filename) {
        filename = file.filename;
      }
    }

    if (!filename) {
      // Get file info to determine filename
      const fileInfo = await client.files.retrieve(fileId);
      filename = fileInfo.filename;
    }

    console.log(`Downloading file to '${filename}'...`);
    const content = await client.files.content(fileId);
    writeFileSync(filename, content);

    console.log(`✅ File downloaded successfully to '${filename}'`);
  } catch (error) {
    console.error(`❌ Error downloading file: ${error}`);
    process.exit(1);
  }
}

async function handleFileDelete(
  fileIdOrName: string,
  options: FileDeleteOptions,
) {
  const client = new GravixLayer({
    apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
  });

  try {
    let fileId = fileIdOrName;

    // If it doesn't look like a file ID, try to find by filename
    if (!fileIdOrName.startsWith("file-")) {
      const files = await client.files.list();
      const file = files.data.find((f) => f.filename === fileIdOrName);
      if (!file) {
        console.error(`❌ File not found: ${fileIdOrName}`);
        process.exit(1);
      }
      fileId = file.id;
    }

    console.log(`Deleting file ${fileId}...`);
    const response = await client.files.delete(fileId);

    console.log("✅ File deleted successfully!");
    console.log(`File Name: ${response.file_name}`);
    console.log(`Message: ${response.message}`);
  } catch (error) {
    console.error(`❌ Error deleting file: ${error}`);
    process.exit(1);
  }
}

async function handleVectorIndexCreate(options: VectorIndexCreateOptions) {
  const client = new GravixLayer({
    apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
  });

  try {
    console.log(`Creating vector index '${options.name}'...`);

    const metadata = options.metadata
      ? JSON.parse(options.metadata)
      : undefined;

    const index = await client.vectors.indexes.create({
      name: options.name,
      dimension: options.dimension,
      metric: options.metric,
      metadata,
    });

    console.log("✅ Vector index created successfully!");
    console.log(`Index ID: ${index.id}`);
    console.log(`Name: ${index.name}`);
    console.log(`Dimension: ${index.dimension}`);
    console.log(`Metric: ${index.metric}`);
    console.log(`Status: ${index.status}`);
  } catch (error) {
    console.error(`❌ Error creating vector index: ${error}`);
    process.exit(1);
  }
}

async function handleVectorIndexList(options: VectorIndexListOptions) {
  const client = new GravixLayer({
    apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
  });

  try {
    const response = await client.vectors.indexes.list();

    if (options.json) {
      console.log(JSON.stringify(response.indexes, null, 2));
    } else {
      if (response.indexes.length === 0) {
        console.log("No vector indexes found.");
      } else {
        console.log(`Found ${response.indexes.length} vector index(es):`);
        console.log();
        for (const index of response.indexes) {
          console.log(`ID: ${index.id}`);
          console.log(`Name: ${index.name}`);
          console.log(`Dimension: ${index.dimension}`);
          console.log(`Metric: ${index.metric}`);
          console.log(`Status: ${index.status}`);
          console.log(`Created: ${index.created_at}`);
          if (index.metadata) {
            console.log(`Metadata: ${JSON.stringify(index.metadata)}`);
          }
          console.log("---");
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error listing vector indexes: ${error}`);
    process.exit(1);
  }
}

async function handleVectorUpsertText(
  indexId: string,
  options: VectorUpsertTextOptions,
) {
  const client = new GravixLayer({
    apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
  });

  try {
    console.log(`Upserting text vector to index '${indexId}'...`);

    const metadata = options.metadata
      ? JSON.parse(options.metadata)
      : undefined;

    const vector = await client.vectors.index(indexId).upsertText({
      text: options.text,
      model: options.model,
      id: options.id,
      metadata,
    });

    console.log("✅ Text vector upserted successfully!");
    console.log(`Vector ID: ${vector.id}`);
    console.log(`Text: ${vector.text}`);
    console.log(`Model: ${vector.model}`);
    console.log(`Embedding Dimension: ${vector.embedding.length}`);
  } catch (error) {
    console.error(`❌ Error upserting text vector: ${error}`);
    process.exit(1);
  }
}

async function handleVectorSearchText(
  indexId: string,
  options: VectorSearchTextOptions,
) {
  const client = new GravixLayer({
    apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
  });

  try {
    console.log(`Searching vectors in index '${indexId}'...`);

    const filter = options.filter ? JSON.parse(options.filter) : undefined;

    const results = await client.vectors.index(indexId).searchText({
      query: options.query,
      model: options.model,
      top_k: options.topK,
      filter,
    });

    console.log(`✅ Search completed in ${results.query_time_ms}ms`);
    console.log(`Found ${results.hits.length} result(s):`);
    console.log();

    for (const hit of results.hits) {
      console.log(`ID: ${hit.id}`);
      console.log(`Score: ${hit.score.toFixed(4)}`);
      if (hit.metadata) {
        console.log(`Metadata: ${JSON.stringify(hit.metadata)}`);
      }
      console.log("---");
    }
  } catch (error) {
    console.error(`❌ Error searching vectors: ${error}`);
    process.exit(1);
  }
}

async function handleHardwareList(
  type: "hardware" | "gpu",
  options: HardwareOptions,
) {
  const client = new GravixLayer({
    apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
  });

  try {
    const accelerators = await client.accelerators.list();

    if (options.json) {
      // Filter out unwanted fields from JSON output
      const filteredAccelerators = accelerators.map((a) => {
        const { name, memory, gpu_type, use_case, ...filtered } = a;
        return filtered;
      });
      console.log(JSON.stringify(filteredAccelerators, null, 2));
    } else {
      if (accelerators.length === 0) {
        console.log(
          `No ${type === "hardware" ? "accelerators/GPUs" : "GPUs"} found.`,
        );
      } else {
        console.log(
          `Available ${type === "hardware" ? "Hardware" : "GPUs"} (${accelerators.length} found):`,
        );
        console.log();
        console.log(
          `${"Accelerator".padEnd(15)} ${"Hardware String".padEnd(35)} ${"Memory".padEnd(10)}`,
        );
        console.log("-".repeat(60));

        for (const accelerator of accelerators) {
          const gpuType = accelerator.gpu_type || accelerator.name;
          const hardwareString = accelerator.hardware_string;
          const memory = accelerator.memory || "N/A";

          console.log(
            `${gpuType.padEnd(15)} ${hardwareString.padEnd(35)} ${memory.padEnd(10)}`,
          );
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
  .name("gravixlayer")
  .description(
    "GravixLayer CLI – Chat Completions, Text Completions, and Deployment Management",
  )
  .version("0.0.1");

// Chat command
const chatCmd = program
  .command("chat")
  .description("Chat completions")
  .option("--api-key <key>", "API key")
  .requiredOption("--model <model>", "Model name")
  .option("--system <prompt>", "System prompt (optional)")
  .option("--user <message>", "User prompt/message (chat mode)")
  .option("--prompt <prompt>", "Direct prompt (completions mode)")
  .option("--temperature <temp>", "Temperature", parseFloat)
  .option("--max-tokens <tokens>", "Maximum tokens to generate", parseInt)
  .option("--stream", "Stream output")
  .option("--mode <mode>", "API mode", "chat")
  .action((options) => handleChatCommands(options));

// Deployments command
const deploymentsCmd = program
  .command("deployments")
  .description("Deployment management");

// Create deployment
deploymentsCmd
  .command("create")
  .description("Create a new deployment")
  .option("--api-key <key>", "API key")
  .requiredOption("--deployment-name <name>", "Deployment name")
  .option("--hw-type <type>", "Hardware type", "dedicated")
  .requiredOption(
    "--gpu-model <model>",
    "GPU model specification (e.g., NVIDIA_T4_16GB)",
  )
  .option("--gpu-count <count>", "Number of GPUs", parseInt, 1)
  .option("--min-replicas <replicas>", "Minimum replicas", parseInt, 1)
  .option("--max-replicas <replicas>", "Maximum replicas", parseInt, 1)
  .requiredOption("--model-name <model>", "Model name to deploy")
  .option(
    "--auto-retry",
    "Auto-retry with unique name if deployment name exists",
  )
  .option("--wait", "Wait for deployment to be ready before exiting")
  .action((options) => handleDeploymentCreate(options.deploymentName, options));

// List deployments
deploymentsCmd
  .command("list")
  .description("List all deployments")
  .option("--api-key <key>", "API key")
  .option("--json", "Output as JSON")
  .action((options) => handleDeploymentList(options));

// Delete deployment
deploymentsCmd
  .command("delete <deploymentId>")
  .description("Delete a deployment")
  .option("--api-key <key>", "API key")
  .action((deploymentId, options) =>
    handleDeploymentDelete(deploymentId, options),
  );

// Hardware listing
deploymentsCmd
  .command("hardware")
  .description("List available hardware/GPUs")
  .option("--api-key <key>", "API key")
  .option("--list", "List available hardware")
  .option("--json", "Output as JSON")
  .action((options) => {
    if (options.list) {
      handleHardwareList("hardware", options);
    } else {
      console.log("Use --list flag to list available hardware");
      console.log("Example: gravixlayer deployments hardware --list");
    }
  });

// GPU listing (alias for hardware)
deploymentsCmd
  .command("gpu")
  .description("List available GPUs")
  .option("--api-key <key>", "API key")
  .option("--list", "List available GPUs")
  .option("--json", "Output as JSON")
  .action((options) => {
    if (options.list) {
      handleHardwareList("gpu", options);
    } else {
      console.log("Use --list flag to list available GPUs");
      console.log("Example: gravixlayer deployments gpu --list");
    }
  });

// Files command
const filesCmd = program.command("files").description("File management");

// Upload file
filesCmd
  .command("upload <file>")
  .description("Upload a file")
  .option("--api-key <key>", "API key")
  .requiredOption(
    "--purpose <purpose>",
    "File purpose (assistants, batch, batch_output, fine-tune, vision, user_data, evals)",
  )
  .option("--file-name <name>", "Custom filename for the uploaded file")
  .option(
    "--expires-after <seconds>",
    "File expiration time in seconds",
    parseInt,
  )
  .action((file, options) => handleFileUpload(file, options));

// List files
filesCmd
  .command("list")
  .description("List all files")
  .option("--api-key <key>", "API key")
  .option("--json", "Output as JSON")
  .action((options) => handleFileList(options));

// Get file info
filesCmd
  .command("info <fileIdOrName>")
  .description("Get file information (by ID or filename)")
  .option("--api-key <key>", "API key")
  .action((fileIdOrName, options) => handleFileInfo(fileIdOrName, options));

// Download file
filesCmd
  .command("download <fileIdOrName>")
  .description("Download file content (by ID or filename)")
  .option("--api-key <key>", "API key")
  .option("--output <filename>", "Output filename")
  .action((fileIdOrName, options) => handleFileDownload(fileIdOrName, options));

// Delete file
filesCmd
  .command("delete <fileIdOrName>")
  .description("Delete a file (by ID or filename)")
  .option("--api-key <key>", "API key")
  .action((fileIdOrName, options) => handleFileDelete(fileIdOrName, options));

// Vectors command
const vectorsCmd = program
  .command("vectors")
  .description("Vector database management");

// Vector index commands
const vectorIndexCmd = vectorsCmd
  .command("index")
  .description("Vector index management");

// Create vector index
vectorIndexCmd
  .command("create")
  .description("Create a vector index")
  .option("--api-key <key>", "API key")
  .requiredOption("--name <name>", "Index name")
  .requiredOption("--dimension <dimension>", "Vector dimension", parseInt)
  .requiredOption(
    "--metric <metric>",
    "Distance metric (cosine, euclidean, dot_product)",
  )
  .option("--metadata <metadata>", "Index metadata as JSON string")
  .action((options) => handleVectorIndexCreate(options));

// List vector indexes
vectorIndexCmd
  .command("list")
  .description("List all vector indexes")
  .option("--api-key <key>", "API key")
  .option("--json", "Output as JSON")
  .action((options) => handleVectorIndexList(options));

// Delete vector index
vectorIndexCmd
  .command("delete <indexId>")
  .description("Delete a vector index")
  .option("--api-key <key>", "API key")
  .action(async (indexId, options) => {
    const client = new GravixLayer({
      apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
    });

    try {
      console.log(`Deleting vector index ${indexId}...`);
      const response = await client.vectors.indexes.delete(indexId);
      console.log("✅ Vector index deleted successfully!");
      console.log(`Message: ${response.message}`);
    } catch (error) {
      console.error(`❌ Error deleting vector index: ${error}`);
      process.exit(1);
    }
  });

// Vector operations commands
const vectorCmd = vectorsCmd.command("vector").description("Vector operations");

// Upsert text vector
vectorCmd
  .command("upsert-text <indexId>")
  .description("Upsert a text vector")
  .option("--api-key <key>", "API key")
  .requiredOption("--text <text>", "Text to embed")
  .requiredOption("--model <model>", "Embedding model")
  .option("--id <id>", "Vector ID")
  .option("--metadata <metadata>", "Vector metadata as JSON string")
  .action((indexId, options) => handleVectorUpsertText(indexId, options));

// Search text vectors
vectorCmd
  .command("search-text <indexId>")
  .description("Search vectors using text query")
  .option("--api-key <key>", "API key")
  .requiredOption("--query <query>", "Search query")
  .requiredOption("--model <model>", "Embedding model")
  .option("--top-k <k>", "Number of results to return", parseInt, 5)
  .option("--filter <filter>", "Search filter as JSON string")
  .action((indexId, options) => handleVectorSearchText(indexId, options));

// List vectors
vectorCmd
  .command("list <indexId>")
  .description("List vectors in an index")
  .option("--api-key <key>", "API key")
  .action(async (indexId, options) => {
    const client = new GravixLayer({
      apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
    });

    try {
      const response = await client.vectors.index(indexId).list();
      console.log(
        `Found ${response.vectors.length} vector(s) in index '${indexId}':`,
      );
      console.log();
      for (const vector of response.vectors) {
        console.log(`ID: ${vector.id || "N/A"}`);
        console.log("---");
      }
    } catch (error) {
      console.error(`❌ Error listing vectors: ${error}`);
      process.exit(1);
    }
  });

// Delete vector
vectorCmd
  .command("delete <indexId> <vectorId>")
  .description("Delete a vector")
  .option("--api-key <key>", "API key")
  .action(async (indexId, vectorId, options) => {
    const client = new GravixLayer({
      apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
    });

    try {
      console.log(`Deleting vector ${vectorId} from index ${indexId}...`);
      const response = await client.vectors.index(indexId).delete(vectorId);
      console.log("✅ Vector deleted successfully!");
      console.log(`Message: ${response.message}`);
    } catch (error) {
      console.error(`❌ Error deleting vector: ${error}`);
      process.exit(1);
    }
  });

// Memory command
const memoryCmd = program
  .command("memory")
  .description("Intelligent memory management");

// Add memory
memoryCmd
  .command("add <userId>")
  .description("Add a memory for a user")
  .option("--api-key <key>", "API key")
  .requiredOption("--message <message>", "Message content to remember")
  .option("--metadata <metadata>", "Memory metadata as JSON string")
  .option("--no-infer", "Disable AI inference for memory processing")
  .action(async (userId, options) => {
    const client = new GravixLayer({
      apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
    });

    try {
      console.log(`Adding memory for user '${userId}'...`);

      const metadata = options.metadata
        ? JSON.parse(options.metadata)
        : undefined;

      const result = await client.memory.add({
        messages: options.message,
        user_id: userId,
        metadata,
        infer: options.infer !== false,
      });

      console.log("✅ Memory added successfully!");
      console.log(`Added ${result.results.length} memory(ies):`);
      for (const memory of result.results) {
        console.log(`- ID: ${memory.id}`);
        console.log(`  Content: ${memory.memory}`);
        console.log(`  Event: ${memory.event}`);
      }
    } catch (error) {
      console.error(`❌ Error adding memory: ${error}`);
      process.exit(1);
    }
  });

// Search memories
memoryCmd
  .command("search <userId>")
  .description("Search memories for a user")
  .option("--api-key <key>", "API key")
  .requiredOption("--query <query>", "Search query")
  .option("--limit <limit>", "Maximum number of results", parseInt, 10)
  .option("--threshold <threshold>", "Minimum similarity threshold", parseFloat)
  .action(async (userId, options) => {
    const client = new GravixLayer({
      apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
    });

    try {
      console.log(
        `Searching memories for user '${userId}' with query: "${options.query}"`,
      );

      const result = await client.memory.search({
        query: options.query,
        user_id: userId,
        limit: options.limit,
        threshold: options.threshold,
      });

      console.log(`✅ Found ${result.results.length} memory(ies):`);
      console.log();
      for (const item of result.results) {
        console.log(`ID: ${item.memory.id}`);
        console.log(`Content: ${item.memory.content}`);
        console.log(`Relevance Score: ${item.relevance_score.toFixed(3)}`);
        console.log(`Created: ${item.memory.created_at}`);
        console.log("---");
      }
    } catch (error) {
      console.error(`❌ Error searching memories: ${error}`);
      process.exit(1);
    }
  });

// Get all memories
memoryCmd
  .command("list <userId>")
  .description("List all memories for a user")
  .option("--api-key <key>", "API key")
  .option("--limit <limit>", "Maximum number of results", parseInt, 100)
  .option("--json", "Output as JSON")
  .action(async (userId, options) => {
    const client = new GravixLayer({
      apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
    });

    try {
      console.log(`Listing memories for user '${userId}'...`);

      const result = await client.memory.getAll({
        user_id: userId,
        limit: options.limit,
      });

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`✅ Found ${result.results.length} memory(ies):`);
        console.log();
        for (const memory of result.results) {
          console.log(`ID: ${memory.id}`);
          console.log(`Content: ${memory.content}`);
          console.log(`Type: ${memory.memory_type}`);
          console.log(`Created: ${memory.created_at}`);
          console.log("---");
        }
      }
    } catch (error) {
      console.error(`❌ Error listing memories: ${error}`);
      process.exit(1);
    }
  });

// Get specific memory
memoryCmd
  .command("get <userId> <memoryId>")
  .description("Get a specific memory by ID")
  .option("--api-key <key>", "API key")
  .action(async (userId, memoryId, options) => {
    const client = new GravixLayer({
      apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
    });

    try {
      console.log(`Getting memory '${memoryId}' for user '${userId}'...`);

      const memory = await client.memory.get({
        memory_id: memoryId,
        user_id: userId,
      });

      if (memory) {
        console.log("✅ Memory found:");
        console.log(`ID: ${memory.id}`);
        console.log(`Content: ${memory.content}`);
        console.log(`Type: ${memory.memory_type}`);
        console.log(`Created: ${memory.created_at}`);
        console.log(`Updated: ${memory.updated_at}`);
        console.log(`Importance Score: ${memory.importance_score}`);
        console.log(`Access Count: ${memory.access_count}`);
      } else {
        console.log("❌ Memory not found");
      }
    } catch (error) {
      console.error(`❌ Error getting memory: ${error}`);
      process.exit(1);
    }
  });

// Update memory
memoryCmd
  .command("update <userId> <memoryId>")
  .description("Update a memory")
  .option("--api-key <key>", "API key")
  .requiredOption("--data <data>", "New memory content")
  .action(async (userId, memoryId, options) => {
    const client = new GravixLayer({
      apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
    });

    try {
      console.log(`Updating memory '${memoryId}' for user '${userId}'...`);

      const result = await client.memory.update({
        memory_id: memoryId,
        user_id: userId,
        data: options.data,
      });

      console.log("✅ Memory updated successfully!");
      console.log(`Message: ${result.message}`);
    } catch (error) {
      console.error(`❌ Error updating memory: ${error}`);
      process.exit(1);
    }
  });

// Delete memory
memoryCmd
  .command("delete <userId> <memoryId>")
  .description("Delete a specific memory")
  .option("--api-key <key>", "API key")
  .action(async (userId, memoryId, options) => {
    const client = new GravixLayer({
      apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
    });

    try {
      console.log(`Deleting memory '${memoryId}' for user '${userId}'...`);

      const result = await client.memory.delete({
        memory_id: memoryId,
        user_id: userId,
      });

      console.log("✅ Memory deleted successfully!");
      console.log(`Message: ${result.message}`);
    } catch (error) {
      console.error(`❌ Error deleting memory: ${error}`);
      process.exit(1);
    }
  });

// Delete all memories
memoryCmd
  .command("delete-all <userId>")
  .description("Delete all memories for a user")
  .option("--api-key <key>", "API key")
  .option("--confirm", "Skip confirmation prompt")
  .action(async (userId, options) => {
    const client = new GravixLayer({
      apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
    });

    try {
      if (!options.confirm) {
        console.log(
          `⚠️  This will delete ALL memories for user '${userId}'. This action cannot be undone.`,
        );
        console.log("Use --confirm flag to proceed without this warning.");
        process.exit(1);
      }

      console.log(`Deleting all memories for user '${userId}'...`);

      const result = await client.memory.deleteAll({
        user_id: userId,
      });

      console.log("✅ All memories deleted successfully!");
      console.log(`Message: ${result.message}`);
    } catch (error) {
      console.error(`❌ Error deleting all memories: ${error}`);
      process.exit(1);
    }
  });

// Sandbox command
const sandboxCmd = program.command("sandbox").description("Sandbox management");

// Create sandbox
sandboxCmd
  .command("create")
  .description("Create a new sandbox")
  .option("--api-key <key>", "API key")
  .requiredOption(
    "--provider <provider>",
    "Cloud provider (gravix, aws, gcp, azure)",
  )
  .requiredOption("--region <region>", "Cloud region")
  .option("--template <template>", "Template name", "python-base-v1")
  .option("--timeout <timeout>", "Timeout in seconds", parseInt, 300)
  .option("--env-vars <envVars>", "Environment variables as JSON")
  .option("--metadata <metadata>", "Metadata as JSON")
  .action(async (options) => {
    const client = new GravixLayer({
      apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
    });

    try {
      const createOptions: any = {
        provider: options.provider,
        region: options.region,
        template: options.template,
        timeout: options.timeout,
      };

      if (options.envVars) {
        createOptions.env_vars = JSON.parse(options.envVars);
      }

      if (options.metadata) {
        createOptions.metadata = JSON.parse(options.metadata);
      }

      const sandbox = await client.sandbox.sandboxes.create(createOptions);

      console.log(`Created sandbox: ${sandbox.sandbox_id}`);
      console.log(`Status: ${sandbox.status}`);
      console.log(`Template: ${sandbox.template}`);
      console.log(`Started: ${sandbox.started_at}`);
      console.log(`Timeout: ${sandbox.timeout_at}`);
    } catch (error) {
      console.error(`ERROR: ${error}`);
      process.exit(1);
    }
  });

// List sandboxes
sandboxCmd
  .command("list")
  .description("List all sandboxes")
  .option("--api-key <key>", "API key")
  .option("--limit <limit>", "Maximum number of results", parseInt, 100)
  .option("--offset <offset>", "Number of results to skip", parseInt, 0)
  .option("--json", "Output as JSON")
  .action(async (options) => {
    const client = new GravixLayer({
      apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
    });

    try {
      const sandboxes = await client.sandbox.sandboxes.list({
        limit: options.limit,
        offset: options.offset,
      });

      if (options.json) {
        console.log(JSON.stringify(sandboxes, null, 2));
      } else {
        console.log(`Found ${sandboxes.total} sandbox(es):`);
        console.log();

        for (const sandbox of sandboxes.sandboxes) {
          console.log(`ID: ${sandbox.sandbox_id}`);
          console.log(`Status: ${sandbox.status}`);
          console.log(`Template: ${sandbox.template}`);
          console.log(`Started: ${sandbox.started_at}`);
          console.log(`Timeout: ${sandbox.timeout_at}`);
          if (sandbox.metadata && Object.keys(sandbox.metadata).length > 0) {
            console.log(`Metadata: ${JSON.stringify(sandbox.metadata)}`);
          }
          console.log();
        }
      }
    } catch (error) {
      console.error(`ERROR: ${error}`);
      process.exit(1);
    }
  });

// Get sandbox info
sandboxCmd
  .command("get <sandboxId>")
  .description("Get sandbox information")
  .option("--api-key <key>", "API key")
  .option("--json", "Output as JSON")
  .action(async (sandboxId, options) => {
    const client = new GravixLayer({
      apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
    });

    try {
      const sandbox = await client.sandbox.sandboxes.get(sandboxId);

      if (options.json) {
        console.log(JSON.stringify(sandbox, null, 2));
      } else {
        console.log(`Sandbox: ${sandbox.sandbox_id}`);
        console.log(`Status: ${sandbox.status}`);
        console.log(`Template: ${sandbox.template}`);
        console.log(`Started: ${sandbox.started_at}`);
        console.log(`Timeout: ${sandbox.timeout_at}`);
        if (sandbox.cpu_count) console.log(`CPU: ${sandbox.cpu_count} vCPU`);
        if (sandbox.memory_mb) console.log(`Memory: ${sandbox.memory_mb}MB`);
        if (sandbox.metadata && Object.keys(sandbox.metadata).length > 0) {
          console.log(`Metadata: ${JSON.stringify(sandbox.metadata)}`);
        }
      }
    } catch (error) {
      console.error(`ERROR: ${error}`);
      process.exit(1);
    }
  });

// Kill sandbox
sandboxCmd
  .command("kill <sandboxId>")
  .description("Terminate a sandbox")
  .option("--api-key <key>", "API key")
  .action(async (sandboxId, options) => {
    const client = new GravixLayer({
      apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
    });

    try {
      const result = await client.sandbox.sandboxes.kill(sandboxId);
      console.log(`${result.message}`);
    } catch (error) {
      console.error(`ERROR: ${error}`);
      process.exit(1);
    }
  });

// Run command
sandboxCmd
  .command("run <sandboxId> <command>")
  .description("Execute a command in sandbox")
  .option("--api-key <key>", "API key")
  .option("--args <args...>", "Command arguments")
  .option("--working-dir <workingDir>", "Working directory")
  .option("--timeout <timeout>", "Timeout in milliseconds", parseInt)
  .action(async (sandboxId, command, options) => {
    const client = new GravixLayer({
      apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
    });

    try {
      const result = await client.sandbox.sandboxes.runCommand(
        sandboxId,
        command,
        {
          args: options.args || [],
          working_dir: options.workingDir,
          timeout: options.timeout,
        },
      );

      console.log(`Command executed (exit code: ${result.exit_code})`);
      console.log(`Duration: ${result.duration_ms}ms`);
      console.log(`Success: ${result.success}`);

      if (result.stdout) {
        console.log("\nSTDOUT:");
        console.log(result.stdout);
      }

      if (result.stderr) {
        console.log("\nSTDERR:");
        console.log(result.stderr);
      }

      if (result.error) {
        console.log(`\nERROR: ${result.error}`);
      }
    } catch (error) {
      console.error(`ERROR: ${error}`);
      process.exit(1);
    }
  });

// Run code
sandboxCmd
  .command("code <sandboxId> <code>")
  .description("Execute code in sandbox")
  .option("--api-key <key>", "API key")
  .option("--language <language>", "Programming language", "python")
  .option("--context-id <contextId>", "Code execution context ID")
  .action(async (sandboxId, code, options) => {
    const client = new GravixLayer({
      apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
    });

    try {
      const result = await client.sandbox.sandboxes.runCode(sandboxId, code, {
        language: options.language,
        context_id: options.contextId,
      });

      if (result.logs?.stdout && result.logs.stdout.length > 0) {
        console.log("\nOUTPUT:");
        for (const line of result.logs.stdout) {
          console.log(line);
        }
      }

      if (result.logs?.stderr && result.logs.stderr.length > 0) {
        console.log("\nSTDERR:");
        for (const line of result.logs.stderr) {
          console.log(line);
        }
      }

      if (result.error) {
        console.log(`\nERROR: ${JSON.stringify(result.error)}`);
      }
    } catch (error) {
      console.error(`ERROR: ${error}`);
      process.exit(1);
    }
  });

// File operations
const sandboxFileCmd = sandboxCmd
  .command("file")
  .description("File operations");

// Read file
sandboxFileCmd
  .command("read <sandboxId> <path>")
  .description("Read file from sandbox")
  .option("--api-key <key>", "API key")
  .action(async (sandboxId, path, options) => {
    const client = new GravixLayer({
      apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
    });

    try {
      const result = await client.sandbox.sandboxes.readFile(sandboxId, path);
      const filePath = result.path || path;
      const fileSize =
        result.size || (result.content ? result.content.length : 0);
      console.log(`File: ${filePath} (${fileSize} bytes)`);
      console.log("=".repeat(50));
      console.log(result.content);
    } catch (error) {
      console.error(`ERROR: ${error}`);
      process.exit(1);
    }
  });

// Write file
sandboxFileCmd
  .command("write <sandboxId> <path> <content>")
  .description("Write file to sandbox")
  .option("--api-key <key>", "API key")
  .action(async (sandboxId, path, content, options) => {
    const client = new GravixLayer({
      apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
    });

    try {
      const result = await client.sandbox.sandboxes.writeFile(
        sandboxId,
        path,
        content,
      );
      console.log(`${result.message}`);
      const filePath = result.path || path;
      const bytesWritten = result.bytes_written || content.length;
      console.log(`Path: ${filePath}`);
      console.log(`Bytes written: ${bytesWritten}`);
    } catch (error) {
      console.error(`ERROR: ${error}`);
      process.exit(1);
    }
  });

// List files
sandboxFileCmd
  .command("list <sandboxId> <path>")
  .description("List files in sandbox")
  .option("--api-key <key>", "API key")
  .action(async (sandboxId, path, options) => {
    const client = new GravixLayer({
      apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
    });

    try {
      const result = await client.sandbox.sandboxes.listFiles(sandboxId, path);
      console.log(`Files in ${path}:`);
      console.log();

      for (const fileInfo of result.files) {
        if (fileInfo.is_dir) {
          console.log(`DIR  ${fileInfo.name}/`);
        } else {
          console.log(`FILE ${fileInfo.name} (${fileInfo.size} bytes)`);
        }
        console.log(`     Modified: ${fileInfo.modified_at}`);
        console.log();
      }
    } catch (error) {
      console.error(`ERROR: ${error}`);
      process.exit(1);
    }
  });

// Delete file
sandboxFileCmd
  .command("delete <sandboxId> <path>")
  .description("Delete file from sandbox")
  .option("--api-key <key>", "API key")
  .action(async (sandboxId, path, options) => {
    const client = new GravixLayer({
      apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
    });

    try {
      const result = await client.sandbox.sandboxes.deleteFile(sandboxId, path);
      console.log(`${result.message}`);
      const filePath = result.path || path;
      console.log(`Path: ${filePath}`);
    } catch (error) {
      console.error(`ERROR: ${error}`);
      process.exit(1);
    }
  });

// Make directory
sandboxFileCmd
  .command("mkdir <sandboxId> <path>")
  .description("Create directory in sandbox")
  .option("--api-key <key>", "API key")
  .action(async (sandboxId, path, options) => {
    const client = new GravixLayer({
      apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
    });

    try {
      const result = await client.sandbox.sandboxes.makeDirectory(
        sandboxId,
        path,
      );
      console.log(`${result.message}`);
      const dirPath = result.path || path;
      console.log(`Path: ${dirPath}`);
    } catch (error) {
      console.error(`ERROR: ${error}`);
      process.exit(1);
    }
  });

// Template commands
const sandboxTemplateCmd = sandboxCmd
  .command("template")
  .description("Template management");

// List templates
sandboxTemplateCmd
  .command("list")
  .description("List available sandbox templates")
  .option("--api-key <key>", "API key")
  .option("--limit <limit>", "Maximum number of results", parseInt, 100)
  .option("--offset <offset>", "Number of results to skip", parseInt, 0)
  .option("--json", "Output as JSON")
  .action(async (options) => {
    const client = new GravixLayer({
      apiKey: options.apiKey || process.env.GRAVIXLAYER_API_KEY,
    });

    try {
      const templates = await client.sandbox.templates.list({
        limit: options.limit,
        offset: options.offset,
      });

      if (options.json) {
        console.log(JSON.stringify(templates, null, 2));
      } else {
        console.log(`Available templates:`);
        console.log();

        for (const template of templates.templates) {
          console.log(`Name: ${template.name}`);
          console.log(`Description: ${template.description}`);
          console.log(
            `Resources: ${template.vcpu_count} vCPU, ${template.memory_mb}MB RAM, ${template.disk_size_mb}MB disk`,
          );
          console.log(`Created: ${template.created_at}`);
          console.log();
        }
      }
    } catch (error) {
      console.error(`ERROR: ${error}`);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();
