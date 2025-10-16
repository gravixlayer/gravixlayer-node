# GravixLayer JavaScript SDK

Industry standard compatible JavaScript/TypeScript SDK for GravixLayer API.

## Installation

```bash
npm install gravixlayer
```

## Quick Start

### ES Modules (Recommended)

```javascript
import { GravixLayer } from 'gravixlayer';

const client = new GravixLayer({
  apiKey: process.env.GRAVIXLAYER_API_KEY,
});

const completion = await client.chat.completions.create({
  model: "meta-llama/llama-3.1-8b-instruct",
  messages: [
    {"role": "system", "content": "You are a helpful and friendly assistant."},
    {"role": "user", "content": "What are the three most popular programming languages?"}
  ]
});

console.log(completion.choices[0].message.content);
```

### CommonJS

```javascript
const { GravixLayer } = require('gravixlayer');

async function main() {
  const client = new GravixLayer({
    apiKey: process.env.GRAVIXLAYER_API_KEY,
  });

  const completion = await client.chat.completions.create({
    model: "meta-llama/llama-3.1-8b-instruct",
    messages: [
      {"role": "system", "content": "You are a helpful and friendly assistant."},
      {"role": "user", "content": "What are the three most popular programming languages?"}
    ]
  });

  console.log(completion.choices[0].message.content);
}

main().catch(console.error);
```

## Features

- **Industry Standard Compatible**: Drop-in replacement for OpenAI SDK
- **Chat Completions**: Full support for chat-based interactions
- **Text Completions**: Generate text completions
- **Embeddings**: Generate embeddings for text
- **File Management**: Upload, list, retrieve, delete, and access file content
- **Vector Database**: Complete vector database with indexes and vector operations
- **Deployments**: Create and manage model deployments
- **Streaming**: Real-time streaming responses for chat and completions
- **Async Support**: Full async/await support
- **CLI Tool**: Comprehensive command-line interface

## API Reference

### Chat Completions

```javascript
import { GravixLayer } from 'gravixlayer';

const client = new GravixLayer({
  apiKey: process.env.GRAVIXLAYER_API_KEY,
});

const completion = await client.chat.completions.create({
  model: "meta-llama/llama-3.1-8b-instruct",
  messages: [
    { role: "user", content: "Hello!" }
  ],
  temperature: 0.7,
  max_tokens: 100
});
```

### Streaming Chat Completions

```javascript
import { GravixLayer } from 'gravixlayer';

const client = new GravixLayer({
  apiKey: process.env.GRAVIXLAYER_API_KEY,
});

const stream = await client.chat.completions.create({
  model: "meta-llama/llama-3.1-8b-instruct",
  messages: [
    { role: "user", content: "Hello!" }
  ],
  stream: true
});

for await (const chunk of stream) {
  if (chunk.choices[0]?.delta?.content) {
    process.stdout.write(chunk.choices[0].delta.content);
  }
}
```

### Text Completions

```javascript
import { GravixLayer } from 'gravixlayer';

const client = new GravixLayer({
  apiKey: process.env.GRAVIXLAYER_API_KEY,
});

const completion = await client.completions.create({
  model: "meta-llama/llama-3.1-8b-instruct",
  prompt: "The future of AI is",
  max_tokens: 100,
  temperature: 0.7
});

console.log(completion.choices[0].text);
```

### Streaming Text Completions

```javascript
const stream = await client.completions.create({
  model: "meta-llama/llama-3.1-8b-instruct",
  prompt: "Write a short story about",
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

```javascript
import { GravixLayer } from 'gravixlayer';

const client = new GravixLayer({
  apiKey: process.env.GRAVIXLAYER_API_KEY,
});

const embedding = await client.embeddings.create({
  model: "text-embedding-ada-002",
  input: "Hello, world!"
});
```

### File Management

```javascript
import { GravixLayer } from 'gravixlayer';

const client = new GravixLayer({
  apiKey: process.env.GRAVIXLAYER_API_KEY,
});

// Upload a file
const uploadResponse = await client.files.create({
  file: "document.pdf", // or Buffer, or ReadableStream
  purpose: "assistants"
});

// List files
const files = await client.files.list();

// Get file info
const fileInfo = await client.files.retrieve("file-abc123");

// Download file content
const content = await client.files.content("file-abc123");

// Delete file
const deleteResponse = await client.files.delete("file-abc123");
```

### Vector Database

```javascript
import { GravixLayer } from 'gravixlayer';

const client = new GravixLayer({
  apiKey: process.env.GRAVIXLAYER_API_KEY,
});

// Create a vector index
const index = await client.vectors.indexes.create({
  name: "product-embeddings",
  dimension: 1536,
  metric: "cosine",
  metadata: {
    description: "Product description embeddings"
  }
});

// Get vector operations for an index
const vectors = client.vectors.index(index.id);

// Upsert vectors from text (automatic embedding)
const textVector = await vectors.upsertText({
  text: "Premium wireless bluetooth headphones with noise cancellation",
  model: "text-embedding-ada-002",
  id: "product-1",
  metadata: {
    title: "Premium Headphones",
    category: "electronics"
  }
});

// Search vectors using text
const searchResults = await vectors.searchText({
  query: "bluetooth headphones",
  model: "text-embedding-ada-002",
  top_k: 5,
  filter: { category: "electronics" }
});

for (const hit of searchResults.hits) {
  console.log(`Match: ${hit.metadata?.title} (Score: ${hit.score.toFixed(4)})`);
}
```

### Memory Management

```javascript
import { GravixLayer } from 'gravixlayer';

const client = new GravixLayer({
  apiKey: process.env.GRAVIXLAYER_API_KEY,
});

// Add memories for a user
const addResult = await client.memory.add({
  messages: "I prefer dark mode and use TypeScript for all my projects",
  user_id: "user-123",
  metadata: { category: "preferences" },
  infer: true // Use AI to process and extract key information
});

// Search memories
const searchResult = await client.memory.search({
  query: "programming preferences",
  user_id: "user-123",
  limit: 10
});

// Get all memories for a user
const allMemories = await client.memory.getAll({
  user_id: "user-123",
  limit: 100
});

// Get specific memory
const memory = await client.memory.get({
  memory_id: "memory-abc123",
  user_id: "user-123"
});

// Update memory
await client.memory.update({
  memory_id: "memory-abc123",
  user_id: "user-123",
  data: "Updated preference: I prefer dark mode and use TypeScript and React"
});

// Delete memory
await client.memory.delete({
  memory_id: "memory-abc123",
  user_id: "user-123"
});

// Delete all memories for a user
await client.memory.deleteAll({
  user_id: "user-123"
});
```

### Deployments

```javascript
import { GravixLayer } from 'gravixlayer';

const client = new GravixLayer({
  apiKey: process.env.GRAVIXLAYER_API_KEY,
});

// Create deployment
const deployment = await client.deployments.create({
  deployment_name: "my-deployment",
  model_name: "meta-llama/llama-3.1-8b-instruct",
  hardware: "nvidia-t4-16gb-pcie_1",
  min_replicas: 1
});

// List deployments
const deployments = await client.deployments.list();

// Delete deployment
await client.deployments.delete("deployment-id");
```

### Accelerators

```javascript
import { GravixLayer } from 'gravixlayer';

const client = new GravixLayer({
  apiKey: process.env.GRAVIXLAYER_API_KEY,
});

const accelerators = await client.accelerators.list();
console.log(accelerators);
```

## CLI Usage

The package includes a CLI tool:

```bash
# Install globally
npm install -g gravixlayer

# Chat completion
gravixlayer chat --model "meta-llama/llama-3.1-8b-instruct" --user "Hello!"

# Text completion
gravixlayer chat --model "meta-llama/llama-3.1-8b-instruct" --prompt "The future of AI is" --mode completions

# Streaming
gravixlayer chat --model "meta-llama/llama-3.1-8b-instruct" --user "Hello!" --stream

# List deployments
gravixlayer deployments list

# Create deployment
gravixlayer deployments create --deployment-name "my-deployment" --model-name "meta-llama/llama-3.1-8b-instruct" --gpu-model "NVIDIA_T4_16GB"

# List available hardware
gravixlayer deployments hardware --list

# File management
gravixlayer files upload document.pdf --purpose assistants
gravixlayer files list
gravixlayer files info file-abc123
gravixlayer files download file-abc123 --output downloaded.pdf
gravixlayer files delete file-abc123

# Memory management
gravixlayer memory add user-123 --message "I prefer dark mode and TypeScript"
gravixlayer memory search user-123 --query "programming preferences" --limit 5
gravixlayer memory list user-123 --limit 10
gravixlayer memory get user-123 memory-abc123
gravixlayer memory update user-123 memory-abc123 --data "Updated preference"
gravixlayer memory delete user-123 memory-abc123
gravixlayer memory delete-all user-123 --confirm

# Vector database
gravixlayer vectors index create --name "embeddings" --dimension 1536 --metric cosine
gravixlayer vectors index list
gravixlayer vectors vector upsert-text <index-id> --text "Hello world" --model "text-embedding-ada-002"
gravixlayer vectors vector search-text <index-id> --query "greeting" --model "text-embedding-ada-002" --top-k 5
```

## Environment Variables

- `GRAVIXLAYER_API_KEY`: Your API key
- `GRAVIXLAYER_BASE_URL`: Base URL for the API (optional)

## Error Handling

```javascript
import { GravixLayer, GravixLayerError, GravixLayerAuthenticationError } from 'gravixlayer';

const client = new GravixLayer({
  apiKey: process.env.GRAVIXLAYER_API_KEY,
});

try {
  const completion = await client.chat.completions.create({
    model: "meta-llama/llama-3.1-8b-instruct",
    messages: [{ role: "user", content: "Hello!" }]
  });
} catch (error) {
  if (error instanceof GravixLayerAuthenticationError) {
    console.error('Authentication failed');
  } else if (error instanceof GravixLayerError) {
    console.error('API error:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## TypeScript Support

The SDK is written in TypeScript and includes full type definitions:

```typescript
import { GravixLayer, ChatCompletion, ChatCompletionCreateParams } from 'gravixlayer';

const client = new GravixLayer({
  apiKey: process.env.GRAVIXLAYER_API_KEY,
});

const params: ChatCompletionCreateParams = {
  model: "meta-llama/llama-3.1-8b-instruct",
  messages: [{ role: "user", content: "Hello!" }]
};

const completion: ChatCompletion = await client.chat.completions.create(params);
```

## License

Apache 2.0

## Support

For issues and questions, please visit our [GitHub repository](https://github.com/gravixlayer/gravixlayer-node).