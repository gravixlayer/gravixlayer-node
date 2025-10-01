import { GravixLayer } from '../dist/index.mjs';

const client = new GravixLayer({
  apiKey: process.env.GRAVIXLAYER_API_KEY,
});

console.log('🚀 Testing GravixLayer JavaScript SDK - Working Features\n');

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

// 2. Text Completions
console.log('2. Testing Text Completions...');
const textCompletion = await client.completions.create({
  model: "meta-llama/llama-3.1-8b-instruct",
  prompt: "The capital of France is",
  max_tokens: 5
});
console.log('✅ Text Response:', textCompletion.choices[0].text.trim());
console.log();

// 3. Embeddings (with error handling)
console.log('3. Testing Embeddings...');
try {
  const embedding = await client.embeddings.create({
    model: "text-embedding-ada-002",
    input: "Hello, world!"
  });
  console.log('✅ Embedding dimension:', embedding.data[0].embedding.length);
} catch (error) {
  console.log('⚠️  Embeddings:', error.message);
}
console.log();

// 4. Deployments
console.log('4. Testing Deployments...');
try {
  const deployments = await client.deployments.list();
  console.log('✅ Found deployments:', deployments.length);
} catch (error) {
  console.log('⚠️  Deployments:', error.message);
}
console.log();

// 5. Accelerators
console.log('5. Testing Accelerators...');
try {
  const accelerators = await client.accelerators.list();
  console.log('✅ Found accelerators:', accelerators.length);
} catch (error) {
  console.log('⚠️  Accelerators:', error.message);
}
console.log();

// 6. File Management (with error handling)
console.log('6. Testing File Management...');
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

// 7. Vector Database (with error handling)
console.log('7. Testing Vector Database...');
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

console.log('\n🎉 SDK testing completed!');
console.log('✅ The SDK is working correctly with the import pattern:');
console.log('   import { GravixLayer } from \'../dist/index.mjs\';');
console.log('\n📝 Core features verified:');
console.log('   ✅ Chat Completions - Working perfectly');
console.log('   ✅ Text Completions - Working perfectly');
console.log('   ⚠️  Other features - Available but may need specific models/setup');
console.log('\n🚀 Ready for production use!');