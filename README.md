# GravixLayer JavaScript SDK

Industry standard compatible JavaScript/TypeScript SDK for GravixLayer API.

## Installation

```bash
npm install gravixlayer
```

## Quick Start

```javascript
import { GravixLayer } from 'gravixlayer';

const client = new GravixLayer({
  apiKey: process.env.GRAVIXLAYER_API_KEY, // This is the default and can be omitted
  baseURL: "https://api.gravixlayer.com/v1/inference", // This is the default and can be omitted
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

## Features

- **Industry Standard Compatible**: Drop-in replacement for OpenAI SDK
- **Chat Completions**: Full support for chat-based interactions
- **Embeddings**: Generate embeddings for text
- **Streaming**: Real-time streaming responses
- **TypeScript**: Full TypeScript support with type definitions

## API Reference

### Chat Completions

```javascript
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

### Embeddings

```javascript
const embedding = await client.embeddings.create({
  model: "text-embedding-ada-002",
  input: "Hello, world!"
});
```
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
gravixlayer deployments create --deployment-name "my-deployment" --model-name "meta-llama/llama-3.1-8b-instruct" --hardware "nvidia-t4-16gb-pcie_1"

# List available hardware
gravixlayer deployments hardware --list
```

## Environment Variables

- `GRAVIXLAYER_API_KEY`: Your API key
- `GRAVIXLAYER_BASE_URL`: Base URL for the API (optional)

## Error Handling

```javascript
import { GravixLayerError, GravixLayerAuthenticationError } from 'gravixlayer';

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

const client = new GravixLayer();

const params: ChatCompletionCreateParams = {
  model: "meta-llama/llama-3.1-8b-instruct",
  messages: [{ role: "user", content: "Hello!" }]
};

const completion: ChatCompletion = await client.chat.completions.create(params);
```

## License

MIT

## Support

For issues and questions, please visit our [GitHub repository](https://github.com/gravixlayer/gravixlayer-node).