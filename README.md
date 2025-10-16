# GravixLayer JavaScript SDK

[![npm version](https://badge.fury.io/js/gravixlayer.svg)](https://www.npmjs.com/package/gravixlayer)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

A comprehensive, industry-standard compatible JavaScript/TypeScript SDK for the GravixLayer API. Drop-in replacement for OpenAI SDK with enhanced features including file management, vector databases, memory systems, and more.

## Features

- **OpenAI Compatible**: Drop-in replacement for OpenAI SDK
- **Chat & Text Completions**: Full support with streaming
- **Memory Management**: Intelligent user memory system with AI inference
- **File Management**: Upload, manage, and process various file formats
- **Vector Database**: Complete vector operations with semantic search
- **Deployments**: Model deployment and management
- **Streaming**: Real-time response streaming
- **TypeScript**: Full type definitions included
- **CLI Tool**: Comprehensive command-line interface

## Installation

```bash
npm install gravixlayer
```

## Quick Start

```javascript
import { GravixLayer } from 'gravixlayer';

const client = new GravixLayer({
  apiKey: process.env.GRAVIXLAYER_API_KEY,
});

const response = await client.chat.completions.create({
  model: "meta-llama/llama-3.1-8b-instruct",
  messages: [{ role: "user", content: "Hello!" }]
});

console.log(response.choices[0].message.content);
```

## API Reference

### Chat Completions

Create conversational AI interactions with support for system prompts, multi-turn conversations, and streaming responses.

```javascript
const client = new GravixLayer({ apiKey: process.env.GRAVIXLAYER_API_KEY });

const response = await client.chat.completions.create({
  model: "meta-llama/llama-3.1-8b-instruct",
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Explain quantum computing in simple terms." }
  ],
  temperature: 0.7,
  max_tokens: 150
});

console.log(response.choices[0].message.content);
```

#### Streaming Chat

```javascript
const stream = await client.chat.completions.create({
  model: "meta-llama/llama-3.1-8b-instruct",
  messages: [{ role: "user", content: "Write a poem about coding" }],
  stream: true
});

for await (const chunk of stream) {
  if (chunk.choices[0]?.delta?.content) {
    process.stdout.write(chunk.choices[0].delta.content);
  }
}
```

### Text Completions

Generate text continuations from prompts with fine-grained control over output.

```javascript
const completion = await client.completions.create({
  model: "meta-llama/llama-3.1-8b-instruct",
  prompt: "The benefits of renewable energy include",
  max_tokens: 100,
  temperature: 0.8
});

console.log(completion.choices[0].text);

const stream = await client.completions.create({
  model: "meta-llama/llama-3.1-8b-instruct",
  prompt: "Once upon a time in a digital world",
  max_tokens: 200,
  stream: true
});

for await (const chunk of stream) {
  if (chunk.choices[0]?.text) {
    process.stdout.write(chunk.choices[0].text);
  }
}
```

### Embeddings

Convert text into high-dimensional vectors for semantic search and similarity comparisons.

```javascript
const embedding = await client.embeddings.create({
  model: "text-embedding-ada-002",
  input: "Machine learning is transforming industries"
});

console.log(`Embedding dimension: ${embedding.data[0].embedding.length}`);

const batchEmbeddings = await client.embeddings.create({
  model: "text-embedding-ada-002",
  input: [
    "Artificial intelligence",
    "Machine learning",
    "Deep learning",
    "Neural networks"
  ]
});
```

### File Management

Upload, manage, and process various file formats including PDFs, documents, images, and data files.

```javascript
const uploadResponse = await client.files.create({
  file: "research-paper.pdf",
  purpose: "assistants",
  expires_after: 86400
});

console.log(`Uploaded: ${uploadResponse.file_name}`);

const files = await client.files.list();
files.data.forEach(file => {
  console.log(`${file.filename} (${file.bytes} bytes) - ${file.purpose}`);
});

const fileInfo = await client.files.retrieve("file-abc123");
console.log(`File: ${fileInfo.filename}, Size: ${fileInfo.bytes} bytes`);

const content = await client.files.content("file-abc123");
console.log(`Downloaded ${content.length} bytes`);

await client.files.delete("file-abc123");
```

**Supported file formats**: PDF, TXT, DOCX, MD, PNG, JPG, JSON, CSV, and more  
**Purposes**: `assistants`, `batch`, `fine-tune`, `vision`, `user_data`, `evals`

### Vector Database

Build semantic search applications with vector indexes and similarity search capabilities.

```javascript
const index = await client.vectors.indexes.create({
  name: "knowledge-base",
  dimension: 1536,
  metric: "cosine",
  metadata: { description: "Company knowledge base" }
});

console.log(`Created index: ${index.name} with ${index.dimension} dimensions`);

const vectors = client.vectors.index(index.id);

await vectors.upsertText({
  text: "Our company offers 24/7 customer support with live chat",
  model: "text-embedding-ada-002",
  id: "support-info-1",
  metadata: { 
    category: "support",
    department: "customer-service"
  }
});

await vectors.batchUpsertText([
  {
    text: "We provide free shipping on orders over $50",
    model: "text-embedding-ada-002",
    id: "shipping-1",
    metadata: { category: "shipping" }
  },
  {
    text: "Returns are accepted within 30 days of purchase",
    model: "text-embedding-ada-002", 
    id: "returns-1",
    metadata: { category: "returns" }
  }
]);

const results = await vectors.searchText({
  query: "How can I get help with my order?",
  model: "text-embedding-ada-002",
  top_k: 3,
  filter: { category: "support" }
});

results.hits.forEach(hit => {
  console.log(`${hit.text} (Score: ${hit.score.toFixed(3)})`);
});
```

**Supported metrics**: `cosine`, `euclidean`, `dot_product`

### Memory Management

Build intelligent applications that remember user preferences and context across conversations.

```javascript
const addResult = await client.memory.add({
  messages: "I'm a React developer who prefers TypeScript and dark themes",
  user_id: "user-123",
  metadata: { category: "preferences", source: "onboarding" },
  infer: true
});

console.log(`Added ${addResult.results.length} memories`);

const searchResult = await client.memory.search({
  query: "What does the user prefer for development?",
  user_id: "user-123",
  limit: 5
});

searchResult.results.forEach(memory => {
  console.log(`Memory: ${memory.memory} (Relevance: ${memory.score.toFixed(3)})`);
});

// Get all memories for analytics
const allMemories = await client.memory.getAll({
  user_id: "user-123",
  limit: 50
});

console.log(`User has ${allMemories.results.length} total memories`);

// Update specific memory
await client.memory.update({
  memory_id: "memory-abc123",
  user_id: "user-123", 
  data: "Updated: Prefers React with TypeScript and Next.js framework"
});

// Clean up old memories
await client.memory.delete({
  memory_id: "memory-abc123",
  user_id: "user-123"
});
```

**Memory types**: Factual, episodic, working, semantic  
**Features**: AI inference, semantic search, user isolation

###  Deployments

Deploy and manage custom model instances with auto-scaling capabilities.

```javascript
// Create a new deployment
const deployment = await client.deployments.create({
  deployment_name: "production-chat-bot",
  model_name: "meta-llama/llama-3.1-8b-instruct",
  hardware: "nvidia-t4-16gb-pcie_1",
  min_replicas: 1,
  max_replicas: 5
});

console.log(`Deployment created: ${deployment.deployment_name}`);

// List all deployments
const deployments = await client.deployments.list();
deployments.forEach(dep => {
  console.log(`${dep.name}: ${dep.status} (${dep.replicas} replicas)`);
});

// Monitor deployment status
const status = await client.deployments.get("deployment-id");
console.log(`Status: ${status.status}, Endpoint: ${status.endpoint}`);

// Scale deployment
await client.deployments.update("deployment-id", {
  min_replicas: 2,
  max_replicas: 10
});

// Clean up
await client.deployments.delete("deployment-id");
```

### Accelerators

Access available GPU hardware and compute resources.

```javascript
// List available accelerators
const accelerators = await client.accelerators.list();
accelerators.forEach(acc => {
  console.log(`${acc.name}: ${acc.memory}GB, $${acc.price_per_hour}/hour`);
});

// Get specific accelerator details
const accelerator = await client.accelerators.get("nvidia-a100-80gb");
console.log(`${accelerator.name}: ${accelerator.compute_capability}`);
```

##  CLI Usage

Comprehensive command-line interface for all GravixLayer operations.

### Installation
```bash
npm install -g gravixlayer
```

### Chat & Completions
```bash
# Interactive chat
gravixlayer chat --model "meta-llama/llama-3.1-8b-instruct" --user "Explain quantum computing"

# Text completion
gravixlayer chat --model "meta-llama/llama-3.1-8b-instruct" --prompt "The future of AI is" --mode completions

# Streaming responses
gravixlayer chat --model "meta-llama/llama-3.1-8b-instruct" --user "Write a poem" --stream
```

### File Operations
```bash
# Upload files
gravixlayer files upload research.pdf --purpose assistants
gravixlayer files upload dataset.csv --purpose fine-tune --expires-after 86400

# Manage files
gravixlayer files list
gravixlayer files info file-abc123
gravixlayer files download file-abc123 --output downloaded.pdf
gravixlayer files delete file-abc123
```

### Memory Management
```bash
gravixlayer memory add user-123 --message "I'm a React developer who loves TypeScript"

gravixlayer memory search user-123 --query "development preferences" --limit 5

gravixlayer memory list user-123 --limit 10
gravixlayer memory update user-123 memory-abc123 --data "Updated preference"
gravixlayer memory delete user-123 memory-abc123
```

### Vector Database
```bash
gravixlayer vectors index create --name "knowledge-base" --dimension 1536 --metric cosine
gravixlayer vectors index list

gravixlayer vectors vector upsert-text <index-id> --text "Customer support info" --model "text-embedding-ada-002"
gravixlayer vectors vector search-text <index-id> --query "help with orders" --model "text-embedding-ada-002" --top-k 5
```

### Deployments
```bash
gravixlayer deployments list
gravixlayer deployments create --deployment-name "prod-bot" --model-name "meta-llama/llama-3.1-8b-instruct" --gpu-model "NVIDIA_T4_16GB"
gravixlayer deployments hardware --list
```

## Configuration

### Environment Variables
```bash
export GRAVIXLAYER_API_KEY="your-api-key-here"
```

### Client Options
```javascript
const client = new GravixLayer({
  apiKey: process.env.GRAVIXLAYER_API_KEY,
  baseURL: 'https://api.gravixlayer.com',
  timeout: 30000,
  maxRetries: 3,
  organization: 'your-org-id',
  project: 'your-project-id'
});
```

## Error Handling

Robust error handling with specific error types for different scenarios.

```javascript
import { 
  GravixLayer, 
  GravixLayerError, 
  GravixLayerAuthenticationError,
  GravixLayerRateLimitError,
  GravixLayerAPIError
} from 'gravixlayer';

try {
  const response = await client.chat.completions.create({
    model: "meta-llama/llama-3.1-8b-instruct",
    messages: [{ role: "user", content: "Hello!" }]
  });
} catch (error) {
  if (error instanceof GravixLayerAuthenticationError) {
    console.error('Authentication failed - check your API key');
  } else if (error instanceof GravixLayerRateLimitError) {
    console.error('Rate limit exceeded - please wait before retrying');
  } else if (error instanceof GravixLayerAPIError) {
    console.error(`API Error: ${error.message} (Status: ${error.status})`);
  } else if (error instanceof GravixLayerError) {
    console.error(`SDK Error: ${error.message}`);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions and IntelliSense.

```typescript
import { 
  GravixLayer, 
  ChatCompletion, 
  ChatCompletionCreateParams,
  FileObject,
  VectorIndex,
  MemorySearchResult
} from 'gravixlayer';

const client = new GravixLayer({
  apiKey: process.env.GRAVIXLAYER_API_KEY,
});

const params: ChatCompletionCreateParams = {
  model: "meta-llama/llama-3.1-8b-instruct",
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Explain TypeScript benefits" }
  ],
  temperature: 0.7,
  max_tokens: 150
};

const completion: ChatCompletion = await client.chat.completions.create(params);
console.log(completion.choices[0].message.content);

const file: FileObject = await client.files.retrieve("file-abc123");
console.log(`File: ${file.filename}, Size: ${file.bytes} bytes`);

const index: VectorIndex = await client.vectors.indexes.create({
  name: "typed-index",
  dimension: 1536,
  metric: "cosine"
});

const memories: MemorySearchResult = await client.memory.search({
  query: "user preferences",
  user_id: "user-123",
  limit: 10
});
```



## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Support & Community

- **Documentation**: [docs.gravixlayer.com](https://docs.gravixlayer.com)
- **Issues**: [GitHub Issues](https://github.com/gravixlayer/gravixlayer-node/issues)

---

