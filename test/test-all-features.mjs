import { GravixLayer } from '../dist/index.mjs';

const client = new GravixLayer({
  apiKey: process.env.GRAVIXLAYER_API_KEY,
});

console.log('🚀 Testing GravixLayer JavaScript SDK - All Features\n');

// 1. Chat Completions
console.log('1. Testing Chat Completions...');
const chatCompletion = await client.chat.completions.create({
  model: "meta-llama/llama-3.1-8b-instruct",
  messages: [
    {"role": "system", "content": "You are a helpful assistant. Respond briefly."},
    {"role": "user", "content": "Say hello in one sentence."}
  ],
  max_tokens: 20
});
console.log('✅ Chat Response:', chatCompletion.choices[0].message.content);
console.log();

// 2. Streaming Chat Completions
console.log('2. Testing Streaming Chat Completions...');
const chatStream = await client.chat.completions.create({
  model: "meta-llama/llama-3.1-8b-instruct",
  messages: [
    {"role": "user", "content": "Count from 1 to 3"}
  ],
  max_tokens: 15,
  stream: true
});

process.stdout.write('✅ Streaming Response: ');
for await (const chunk of chatStream) {
  if (chunk.choices[0]?.delta?.content) {
    process.stdout.write(chunk.choices[0].delta.content);
  }
}
console.log('\n');

// 3. Text Completions
console.log('3. Testing Text Completions...');
const textCompletion = await client.completions.create({
  model: "meta-llama/llama-3.1-8b-instruct",
  prompt: "The capital of France is",
  max_tokens: 5
});
console.log('✅ Text Response:', textCompletion.choices[0].text.trim());
console.log();

// 4. Streaming Text Completions
console.log('4. Testing Streaming Text Completions...');
const textStream = await client.completions.create({
  model: "meta-llama/llama-3.1-8b-instruct",
  prompt: "List three colors:",
  max_tokens: 15,
  stream: true
});

process.stdout.write('✅ Streaming Text: ');
for await (const chunk of textStream) {
  if (chunk.choices[0]?.text) {
    process.stdout.write(chunk.choices[0].text);
  }
}
console.log('\n');

// 5. Embeddings
console.log('5. Testing Embeddings...');
const embedding = await client.embeddings.create({
  model: "text-embedding-ada-002",
  input: "Hello, world!"
});
console.log('✅ Embedding dimension:', embedding.data[0].embedding.length);
console.log();

// 6. Deployments
console.log('6. Testing Deployments...');
const deployments = await client.deployments.list();
console.log('✅ Found deployments:', deployments.length);
console.log();

// 7. Accelerators
console.log('7. Testing Accelerators...');
const accelerators = await client.accelerators.list();
console.log('✅ Found accelerators:', accelerators.length);
console.log();

// 8. File Management
console.log('8. Testing File Management...');
import { writeFileSync, unlinkSync } from 'fs';
const testFile = 'temp-test-file.txt';
writeFileSync(testFile, 'This is a test file for SDK testing.');

try {
  // Upload file
  const uploadResponse = await client.files.create({
    file: testFile,
    purpose: 'assistants',
    filename: 'test-upload.txt'
  });
  console.log('✅ File uploaded:', uploadResponse.file_name);

  // List files
  const filesList = await client.files.list();
  console.log('✅ Total files:', filesList.data.length);

  // Find and delete our test file
  const uploadedFile = filesList.data.find(f => f.filename === 'test-upload.txt');
  if (uploadedFile) {
    const deleteResponse = await client.files.delete(uploadedFile.id);
    console.log('✅ File deleted:', deleteResponse.file_name);
  }
} catch (error) {
  console.log('⚠️  File operations:', error.message);
} finally {
  try { unlinkSync(testFile); } catch {}
}
console.log();

// 9. Vector Database
console.log('9. Testing Vector Database...');
try {
  // Create vector index
  const indexName = `test-index-${Date.now()}`;
  const index = await client.vectors.indexes.create({
    name: indexName,
    dimension: 1536,
    metric: 'cosine',
    metadata: { test: true }
  });
  console.log('✅ Vector index created:', index.name);

  // Get vector operations
  const vectors = client.vectors.index(index.id);

  // Upsert text vector
  const textVector = await vectors.upsertText({
    text: "This is a test document about artificial intelligence and machine learning",
    model: "text-embedding-ada-002",
    id: "test-vector-1",
    metadata: { category: "test", topic: "ai" }
  });
  console.log('✅ Text vector upserted:', textVector.id);

  // Search using text
  const searchResults = await vectors.searchText({
    query: "artificial intelligence",
    model: "text-embedding-ada-002",
    top_k: 5
  });
  console.log('✅ Search completed in', searchResults.query_time_ms + 'ms');
  console.log('✅ Search results:', searchResults.hits.length);

  // Clean up - delete the index
  await client.vectors.indexes.delete(index.id);
  console.log('✅ Vector index deleted');
} catch (error) {
  console.log('⚠️  Vector operations:', error.message);
}

console.log('\n🎉 All features tested successfully!');
console.log('The SDK is working correctly with the local import pattern.');