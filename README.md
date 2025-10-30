# GravixLayer JavaScript SDK

[![npm version](https://badge.fury.io/js/gravixlayer.svg)](https://www.npmjs.com/package/gravixlayer)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

Official JavaScript/TypeScript SDK for [GravixLayer API](https://gravixlayer.com). Simple and powerful.

📚 **[Full Documentation](https://docs.gravixlayer.com/sdk/introduction/introduction)**

## Installation

```bash
npm install gravixlayer
```

## Quick Start

```javascript
import { GravixLayer } from 'gravixlayer';

const client = new GravixLayer({
  apiKey: process.env.GRAVIXLAYER_API_KEY
});

const response = await client.chat.completions.create({
  model: "mistralai/mistral-nemo-instruct-2407",
  messages: [{ role: "user", content: "Hello!" }]
});

console.log(response.choices[0].message.content);
```

---

## Chat Completions

Talk to AI models.

```javascript
import { GravixLayer } from 'gravixlayer';

const client = new GravixLayer({
  apiKey: process.env.GRAVIXLAYER_API_KEY
});

// Simple chat
const response = await client.chat.completions.create({
  model: "mistralai/mistral-nemo-instruct-2407",
  messages: [
    { role: "system", content: "You are helpful." },
    { role: "user", content: "What is JavaScript?" }
  ]
});
console.log(response.choices[0].message.content);
```

**What it does:** Sends your message to AI and gets a response.

### Streaming

Get responses in real-time.

```javascript
import { GravixLayer } from 'gravixlayer';

const client = new GravixLayer({
  apiKey: process.env.GRAVIXLAYER_API_KEY
});

const stream = await client.chat.completions.create({
  model: "mistralai/mistral-nemo-instruct-2407",
  messages: [{ role: "user", content: "Tell a story" }],
  stream: true
});

for await (const chunk of stream) {
  if (chunk.choices[0]?.delta?.content) {
    process.stdout.write(chunk.choices[0].delta.content);
  }
}
```

**What it does:** Shows AI response word-by-word as it's generated.

---

## Text Completions

Continue text from a prompt.

```javascript
import { GravixLayer } from 'gravixlayer';

const client = new GravixLayer({
  apiKey: process.env.GRAVIXLAYER_API_KEY
});

const response = await client.completions.create({
  model: "mistralai/mistral-nemo-instruct-2407",
  prompt: "The future of AI is",
  max_tokens: 50
});
console.log(response.choices[0].text);
```

**What it does:** AI continues writing from your starting text.

### Streaming Completions

```javascript
import { GravixLayer } from 'gravixlayer';

const client = new GravixLayer({
  apiKey: process.env.GRAVIXLAYER_API_KEY
});

const stream = await client.completions.create({
  model: "mistralai/mistral-nemo-instruct-2407",
  prompt: "Once upon a time",
  max_tokens: 100,
  stream: true
});

for await (const chunk of stream) {
  if (chunk.choices[0]?.text) {
    process.stdout.write(chunk.choices[0].text);
  }
}
```

**What it does:** Get text completions in real-time.

---

## Embeddings

Convert text to numbers for comparison.

```javascript
import { GravixLayer } from 'gravixlayer';

const client = new GravixLayer({
  apiKey: process.env.GRAVIXLAYER_API_KEY
});

// Single text
const response = await client.embeddings.create({
  model: "microsoft/multilingual-e5-large",
  input: "Hello world"
});
console.log(`Vector size: ${response.data[0].embedding.length}`);

// Multiple texts
const batchResponse = await client.embeddings.create({
  model: "microsoft/multilingual-e5-large",
  input: ["Text 1", "Text 2", "Text 3"]
});
batchResponse.data.forEach((item, i) => {
  console.log(`Text ${i+1}: ${item.embedding.length} dimensions`);
});
```

**What it does:** Turns text into a list of numbers. Similar texts have similar numbers.

---

## Files

Upload and manage files.

```javascript
import { GravixLayer } from 'gravixlayer';
import fs from 'fs';

const client = new GravixLayer({
  apiKey: process.env.GRAVIXLAYER_API_KEY
});

// Upload
const fileStream = fs.createReadStream('document.pdf');
const file = await client.files.upload({
  file: fileStream,
  purpose: 'assistants'
});
console.log(`Uploaded: ${file.id}`);

// List all files
const files = await client.files.list();
files.data.forEach(f => {
  console.log(`${f.filename} - ${f.bytes} bytes`);
});

// Get file info
const fileInfo = await client.files.retrieve('file-id');
console.log(`File: ${fileInfo.filename}`);

// Download file content
const content = await client.files.content('file-id');
fs.writeFileSync('downloaded.pdf', content);

// Delete file
const deleteResponse = await client.files.delete('file-id');
console.log(deleteResponse.message);
```

**What it does:** Store files on the server to use with AI.

---

## Vector Database

Search text by meaning, not just keywords.

```javascript
import { GravixLayer } from 'gravixlayer';

const client = new GravixLayer({
  apiKey: process.env.GRAVIXLAYER_API_KEY
});

// Create index
const index = await client.vectors.indexes.create({
  name: 'my-docs',
  dimension: 1536,
  metric: 'cosine'
});
console.log(`Created index: ${index.id}`);

// Add single text
const vectors = client.vectors.index(index.id);
await vectors.upsertText({
  text: 'JavaScript is a programming language',
  model: 'microsoft/multilingual-e5-large',
  id: 'doc1',
  metadata: { category: 'programming' }
});

// Add multiple texts
await vectors.batchUpsertText([
  {
    text: 'Python is for data science',
    model: 'microsoft/multilingual-e5-large',
    id: 'doc2',
    metadata: { category: 'programming' }
  },
  {
    text: 'React is a JavaScript library',
    model: 'microsoft/multilingual-e5-large',
    id: 'doc3',
    metadata: { category: 'web' }
  }
]);

// Search by text
const results = await vectors.searchText({
  query: 'coding languages',
  model: 'microsoft/multilingual-e5-large',
  top_k: 5
});
results.hits.forEach(hit => {
  console.log(`${hit.text} (score: ${hit.score.toFixed(3)})`);
});

// Search with filter
const filteredResults = await vectors.searchText({
  query: 'programming',
  model: 'microsoft/multilingual-e5-large',
  top_k: 3,
  filter: { category: 'programming' }
});

// List all indexes
const indexes = await client.vectors.indexes.list();
indexes.indexes.forEach(idx => {
  console.log(`${idx.name}: ${idx.dimension} dimensions`);
});

// Delete index
await client.vectors.indexes.delete(index.id);
```

**What it does:** Finds similar text based on meaning, not exact words.

---

## Memory

Remember user information across conversations.

```javascript
import { GravixLayer, Memory } from 'gravixlayer';

const client = new GravixLayer({
  apiKey: process.env.GRAVIXLAYER_API_KEY
});

// Setup memory
const memory = new Memory(
  client,
  'microsoft/multilingual-e5-large',
  'mistralai/mistral-nemo-instruct-2407',
  'user-memories',
  'AWS',
  'us-east-1'
);

// Add memory
const result = await memory.add({
  messages: 'User loves pizza and Italian food',
  user_id: 'user123'
});
console.log(`Added ${result.results.length} memories`);

// Add with AI inference
const inferResult = await memory.add({
  messages: "I'm a software engineer who loves JavaScript",
  user_id: 'user123',
  infer: true
});
inferResult.results.forEach(mem => {
  console.log(`Extracted: ${mem.memory}`);
});

// Search memories
const searchResults = await memory.search({
  query: 'What food does user like?',
  user_id: 'user123',
  limit: 5
});
searchResults.results.forEach(item => {
  console.log(`${item.memory} (score: ${item.score.toFixed(3)})`);
});

// Get all memories
const allMemories = await memory.getAll({
  user_id: 'user123',
  limit: 50
});
console.log(`Total memories: ${allMemories.results.length}`);

// Update memory
await memory.update({
  memory_id: 'memory-id',
  user_id: 'user123',
  data: 'Updated: User prefers vegetarian food'
});

// Delete specific memory
await memory.delete({
  memory_id: 'memory-id',
  user_id: 'user123'
});

// Delete all memories for user
await memory.deleteAll({ user_id: 'user123' });
```

**What it does:** Stores facts about users so AI can remember them later.

---

## Sandbox

Run code safely in isolated environments.

```javascript
import { GravixLayer, Sandbox } from 'gravixlayer';
import fs from 'fs';

const client = new GravixLayer({
  apiKey: process.env.GRAVIXLAYER_API_KEY
});

// Create sandbox
const sandbox = await Sandbox.create({
  template: 'node-base-v1',
  timeout: 600,
  metadata: { project: 'my-app' }
});
console.log(`Sandbox ID: ${sandbox.id}`);

// Run code
const result = await sandbox.runCode("console.log('Hello from sandbox!');\nconsole.log(2 + 2);");
console.log('Output:', result.logs.stdout);
console.log('Errors:', result.logs.stderr);
console.log('Exit code:', result.exitCode);

// Run shell command
const cmdResult = await sandbox.runCommand('ls -la');
console.log(cmdResult.logs.stdout);

// Write file
await sandbox.files.write({
  path: '/home/user/script.js',
  content: "console.log('Hello World');"
});

// Read file
const content = await sandbox.files.read({
  path: '/home/user/script.js'
});
console.log('File content:', content);

// List files
const files = await sandbox.files.list({
  path: '/home/user'
});
files.forEach(file => {
  console.log(`${file.name} - ${file.size} bytes`);
});

// Upload file to sandbox
const fileStream = fs.createReadStream('local_file.js');
await sandbox.files.upload({
  path: '/home/user/uploaded.js',
  file: fileStream
});

// Create directory
await sandbox.files.mkdir({
  path: '/home/user/myproject'
});

// Delete file
await sandbox.files.delete({
  path: '/home/user/script.js'
});

// Get sandbox info
const info = await sandbox.getInfo();
console.log(`Status: ${info.status}`);

// List all sandboxes
const sandboxes = await client.sandbox.list();
sandboxes.forEach(sb => {
  console.log(`${sb.id}: ${sb.status}`);
});

// Extend timeout
await sandbox.setTimeout({ timeout: 1200 });

// List available templates
const templates = await Sandbox.templates.list();
templates.forEach(template => {
  console.log(`${template.name}: ${template.description}`);
});

// Kill sandbox
await sandbox.kill();
```

**What it does:** Runs code in a safe, isolated environment that can't harm your system.

---

## Deployments

Deploy your own model instances.

```javascript
import { GravixLayer } from 'gravixlayer';

const client = new GravixLayer({
  apiKey: process.env.GRAVIXLAYER_API_KEY
});

// Create deployment
const deployment = await client.deployments.create({
  deployment_name: 'my-chatbot',
  model_name: 'mistralai/mistral-nemo-instruct-2407',
  hardware: 'nvidia-t4-16gb-pcie_1',
  min_replicas: 1,
  max_replicas: 3
});
console.log(`Deployment ID: ${deployment.id}`);

// List all deployments
const deployments = await client.deployments.list();
deployments.forEach(dep => {
  console.log(`${dep.name}: ${dep.status}`);
});

// Get deployment info
const depInfo = await client.deployments.get('deployment-id');
console.log(`Status: ${depInfo.status}`);
console.log(`Endpoint: ${depInfo.endpoint}`);

// Update deployment
await client.deployments.update('deployment-id', {
  min_replicas: 2,
  max_replicas: 5
});

// Delete deployment
await client.deployments.delete('deployment-id');

// List available hardware
const accelerators = await client.accelerators.list();
accelerators.forEach(acc => {
  console.log(`${acc.name}: ${acc.memory}GB`);
});
```

**What it does:** Runs a dedicated model instance just for you.

---

## TypeScript Support

Full type definitions included.

```typescript
import { 
  GravixLayer, 
  ChatCompletion, 
  ChatCompletionCreateParams,
  EmbeddingResponse,
  FileObject
} from 'gravixlayer';

const client = new GravixLayer({
  apiKey: process.env.GRAVIXLAYER_API_KEY
});

const params: ChatCompletionCreateParams = {
  model: "mistralai/mistral-nemo-instruct-2407",
  messages: [{ role: "user", content: "Hello" }],
  temperature: 0.7
};

const response: ChatCompletion = await client.chat.completions.create(params);
console.log(response.choices[0].message.content);

// Embeddings with types
const embeddingResponse: EmbeddingResponse = await client.embeddings.create({
  model: "microsoft/multilingual-e5-large",
  input: "Hello"
});

// Files with types
const file: FileObject = await client.files.retrieve('file-id');
```

**What it does:** Provides autocomplete and type checking in your editor.

---

## CLI Usage

Use from command line.

```bash
# Set API key
export GRAVIXLAYER_API_KEY="your-api-key"

# Chat
gravixlayer chat --model "mistralai/mistral-nemo-instruct-2407" --user "Hello!"
gravixlayer chat --model "mistralai/mistral-nemo-instruct-2407" --user "Tell a story" --stream

# Files
gravixlayer files upload document.pdf --purpose assistants
gravixlayer files list
gravixlayer files info file-abc123
gravixlayer files download file-abc123 --output downloaded.pdf
gravixlayer files delete file-abc123

# Deployments
gravixlayer deployments create --deployment-name "my-bot" --model-name "mistralai/mistral-nemo-instruct-2407" --gpu-model "NVIDIA_T4_16GB"
gravixlayer deployments list
gravixlayer deployments delete <deployment-id>

# Vector database
gravixlayer vectors index create --name "my-index" --dimension 1536 --metric cosine
gravixlayer vectors index list
```

---

## Configuration

```javascript
import { GravixLayer } from 'gravixlayer';

// Basic configuration
const client = new GravixLayer({
  apiKey: process.env.GRAVIXLAYER_API_KEY
});

// Advanced configuration
const advancedClient = new GravixLayer({
  apiKey: 'your-api-key',
  baseURL: 'https://api.gravixlayer.com/v1/inference',
  timeout: 60000,
  maxRetries: 3,
  headers: { 'Custom-Header': 'value' }
});
```

Set API key in environment:
```bash
export GRAVIXLAYER_API_KEY="your-api-key"
```

---

## Error Handling

```javascript
import { 
  GravixLayer,
  GravixLayerError,
  GravixLayerAuthenticationError,
  GravixLayerRateLimitError,
  GravixLayerServerError,
  GravixLayerBadRequestError
} from 'gravixlayer';

const client = new GravixLayer({
  apiKey: process.env.GRAVIXLAYER_API_KEY
});

try {
  const response = await client.chat.completions.create({
    model: "mistralai/mistral-nemo-instruct-2407",
    messages: [{ role: "user", content: "Hello" }]
  });
} catch (error) {
  if (error instanceof GravixLayerAuthenticationError) {
    console.error('Invalid API key');
  } else if (error instanceof GravixLayerRateLimitError) {
    console.error('Too many requests - please wait');
  } else if (error instanceof GravixLayerBadRequestError) {
    console.error(`Bad request: ${error.message}`);
  } else if (error instanceof GravixLayerServerError) {
    console.error(`Server error: ${error.message}`);
  } else if (error instanceof GravixLayerError) {
    console.error(`SDK error: ${error.message}`);
  }
}
```

---

## Learn More

📚 **[Full Documentation](https://docs.gravixlayer.com/sdk/introduction/introduction)**

- Detailed guides and tutorials
- API reference
- Advanced examples
- Best practices

## Support

- **Issues**: [GitHub Issues](https://github.com/gravixlayer/gravixlayer-node/issues)
- **Email**: info@gravixlayer.com

## License

Apache License 2.0
