# GravixLayer Node.js SDK Reference

## Client Initialization

```typescript
import { GravixLayer } from 'gravixlayer';

const client = new GravixLayer({
  apiKey: process.env.GRAVIXLAYER_API_KEY, // Optional if env var is set
  // baseURL: "https://api.gravixlayer.com/v1/inference", // Optional custom URL
  // timeout: 60000, // Optional timeout in ms
  // maxRetries: 3 // Optional max retries
});
```

## Chat Completions

### Create (Non-streaming)

```typescript
const response = await client.chat.completions.create({
  model: "qwen/qwen-2.5-vl-7b-instruct",
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Hello!" }
  ],
  temperature: 0.7,
  max_tokens: 100,
  stream: false
});

console.log(response.choices[0].message.content);
```

### Create (Streaming)

```typescript
const stream = await client.chat.completions.create({
  model: "qwen/qwen-2.5-vl-7b-instruct",
  messages: [{ role: "user", content: "Tell me a story." }],
  stream: true
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || "");
}
```

## Completions (Legacy)

### Create (Non-streaming)

```typescript
const response = await client.completions.create({
  model: "qwen/qwen-2.5-vl-7b-instruct",
  prompt: "Once upon a time",
  max_tokens: 50,
  temperature: 0.7,
  stream: false
});

console.log(response.choices[0].text);
```

### Create (Streaming)

```typescript
const stream = await client.completions.create({
  model: "qwen/qwen-2.5-vl-7b-instruct",
  prompt: "Once upon a time",
  max_tokens: 50,
  stream: true
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.text || "");
}
```

## Embeddings

### Create

```typescript
const response = await client.embeddings.create({
  model: "microsoft/multilingual-e5-large",
  input: "The quick brown fox jumps over the lazy dog",
  encoding_format: "float"
});

console.log(response.data[0].embedding);
```

## Files

### Create (Upload)

```typescript
import fs from 'fs';

const file = await client.files.create({
  file: fs.createReadStream('data.jsonl'),
  purpose: 'fine-tune',
  filename: 'my-data.jsonl' // Optional
});
console.log(`Uploaded file ID: ${file.id}`);
```

### List

```typescript
const files = await client.files.list();
files.data.forEach(f => console.log(`${f.id}: ${f.filename}`));
```

### Content (Download)

```typescript
const contentBuffer = await client.files.content("file-123");
console.log(contentBuffer.toString());
```

### Delete

```typescript
const result = await client.files.delete("file-123");
console.log(result.message);
```

## Deployments

### Create

```typescript
const deployment = await client.deployments.create({
  deployment_name: "my-custom-model",
  model_name: "qwen/qwen-2.5-vl-7b-instruct",
  gpu_model: "NVIDIA_T4_16GB",
  gpu_count: 1,
  min_replicas: 1,
  max_replicas: 1,
  auto_retry: true // Automatically handle name conflicts
});
console.log(`Deployment created: ${deployment.deployment_id}`);
```

### List

```typescript
const deployments = await client.deployments.list();
deployments.forEach(d => console.log(`${d.deployment_id}: ${d.status}`));
```

### Get

```typescript
const deployment = await client.deployments.get("my-custom-model");
console.log(deployment);
```

### Delete

```typescript
await client.deployments.delete("deployment-id-or-name");
```

### List Hardware

```typescript
const hardware = await client.deployments.listHardware();
hardware.forEach(h => console.log(`${h.hw_model}: ${h.pricing}`));
```

## Accelerators

### List

```typescript
const accelerators = await client.accelerators.list();
accelerators.forEach(acc => console.log(acc.name));
```

## Memory

### Initialize

```typescript
const memory = client.memory(
  "microsoft/multilingual-e5-large", // Embedding model
  "qwen/qwen-2.5-vl-7b-instruct", // Inference model
  "user-memories", // Index name
  "aws", // Cloud provider
  "us-east-1", // Region
  false // Delete protection
);
```

### Add

```typescript
// Add direct content
await memory.add("I prefer coding in TypeScript", "user-123");

// Add conversation history
await memory.add([
    { role: "user", content: "I like Python" },
    { role: "assistant", content: "Noted." }
], "user-123");
```

### Search

```typescript
const results = await memory.search(
    "What is my preferred language?", 
    "user-123", 
    10, // Limit
    0.5 // Threshold
);
console.log(results.results[0].memory);
```

### Get

```typescript
const item = await memory.get("memory-id", "user-123");
```

### Get All (History)

```typescript
const history = await memory.getAll("user-123", 100);
```

### Update

```typescript
await memory.update("memory-id", "user-123", "Updated content");
```

### Delete

```typescript
await memory.delete("memory-id", "user-123");
```

### Delete All

```typescript
await memory.deleteAll("user-123");
```

## Vector Database

### Indexes

#### Create

```typescript
const index = await client.vectors.indexes.create({
  name: "my-index",
  dimension: 1024,
  metric: "cosine",
  cloud_provider: "aws",
  region: "us-east-1",
  vector_type: "dense"
});
```

#### List

```typescript
const indexes = await client.vectors.indexes.list();
```

#### Get

```typescript
const indexInfo = await client.vectors.indexes.get("index-id");
```

#### Delete

```typescript
await client.vectors.indexes.delete("index-id");
```

### Vectors

#### Initialize

```typescript
const vectors = client.vectors.index("index-id");
```

#### Upsert (Raw Embedding)

```typescript
await vectors.upsert(
    [0.1, 0.2, 0.3], // Embedding vector
    "vec-1", // ID
    { category: "test" } // Metadata
);
```

#### Upsert Text

```typescript
await vectors.upsertText(
    "Hello world",
    "microsoft/multilingual-e5-large",
    "doc-1",
    { category: "greeting" }
);
```

#### Search (Raw Embedding)

```typescript
const results = await vectors.search(
    [0.1, 0.2, 0.3],
    10 // Limit
);
```

#### Search Text

```typescript
const results = await vectors.searchText(
    "Hello",
    "microsoft/multilingual-e5-large",
    10
);
```

#### Get

```typescript
const vector = await vectors.get("vec-1");
```

#### List

```typescript
const allVectors = await vectors.list();
```

#### Delete

```typescript
await vectors.delete("vec-1");
```

#### Delete All

```typescript
await vectors.deleteAll();
```

## Sandbox

### Templates

#### List

```typescript
const templates = await client.sandbox.templates.list();
```

### Sandboxes

#### Create

```typescript
const sandbox = await client.sandbox.sandboxes.create({
  provider: "aws",
  region: "us-east-1",
  template: "python-base-v1",
  name: "my-sandbox",
  timeout: 300
});
```

#### List

```typescript
const sandboxes = await client.sandbox.sandboxes.list();
```

#### Get

```typescript
const sb = await client.sandbox.sandboxes.get("sandbox-id");
```

#### Kill

```typescript
await client.sandbox.sandboxes.kill("sandbox-id");
```

### Sandbox Instance Operations

```typescript
// Run Code
const codeResult = await sandbox.runCode("print('Hello World')");
console.log(codeResult.stdout);

// Run Command
const cmdResult = await sandbox.runCommand("ls -la");
console.log(cmdResult.stdout);

// Filesystem: Write
await sandbox.filesystem.write("test.txt", "Hello content");

// Filesystem: Read
const content = await sandbox.filesystem.read("test.txt");

// Filesystem: List
const files = await sandbox.filesystem.list("/");

// Filesystem: Create Directory
await sandbox.filesystem.createDirectory("new-dir");

// Filesystem: Delete
await sandbox.filesystem.delete("test.txt");

// Kill Instance
await sandbox.kill();
```

## SDK Development Guide

### Setup

1.  **Prerequisites**: Ensure you have Node.js (v16+) and npm/yarn/pnpm installed.
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Build**:
    The SDK uses `tsup` for bundling.
    ```bash
    npm run build
    ```
    To watch for changes:
    ```bash
    npm run dev
    ```

### Testing

The project uses custom test scripts located in the `test/` directory.

*   **Run All Tests**:
    ```bash
    npm run test:all
    ```
*   **Run Unit Tests**:
    ```bash
    npm run test:unit
    ```
*   **Run Integration Tests**:
    ```bash
    npm run test:integration
    ```

### Code Quality

*   **Linting**:
    ```bash
    npm run lint
    ```
*   **Formatting**:
    ```bash
    npm run format
    ```
*   **Type Checking**:
    ```bash
    npm run type-check
    ```

### Making Changes

1.  **Structure**: Source code is in `src/`. Resources are organized in `src/resources/`.
2.  **Adding a Resource**:
    *   Create a new file in `src/resources/`.
    *   Define the class and methods.
    *   Export it in `src/index.ts`.
    *   Instantiate it in `src/client.ts`.
3.  **Updating Types**: Add or update interfaces in `src/types/`.

### Before Submitting

1.  Ensure all tests pass: `npm run test:all`
2.  Run full analysis: `npm run analyze`
3.  Update documentation if API changes.
