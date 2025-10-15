#!/usr/bin/env node

/**
 * Create GitHub release for v0.0.4 that was just published to NPM
 */

const { execSync } = require('child_process');

function runCommand(command, description, ignoreError = false) {
  console.log(`\n🔄 ${description}...`);
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${description} - SUCCESS`);
    return output.trim();
  } catch (error) {
    if (ignoreError) {
      console.log(`⚠️  ${description} - WARNING: ${error.message}`);
      return null;
    } else {
      console.log(`❌ ${description} - FAILED`);
      console.log(`Error: ${error.message}`);
      throw error;
    }
  }
}

async function main() {
  console.log('🏷️  Creating GitHub Release for v0.0.4');
  console.log('=======================================\n');

  // Check if GitHub CLI is available
  const ghCheck = runCommand('gh --version', 'Checking GitHub CLI', true);
  if (!ghCheck) {
    console.log('\n❌ GitHub CLI not found!');
    console.log('Please install GitHub CLI:');
    console.log('- Windows: winget install GitHub.cli');
    console.log('- macOS: brew install gh');
    console.log('- Linux: https://github.com/cli/cli/blob/trunk/docs/install_linux.md');
    console.log('\nThen run: gh auth login');
    process.exit(1);
  }

  // Check if authenticated
  const authCheck = runCommand('gh auth status', 'Checking GitHub authentication', true);
  if (!authCheck) {
    console.log('\n❌ Not authenticated with GitHub!');
    console.log('Please run: gh auth login');
    process.exit(1);
  }

  // Create git tag if it doesn't exist
  const tagExists = runCommand('git tag -l v0.0.4', 'Checking if tag exists', true);
  if (!tagExists) {
    runCommand('git tag v0.0.4', 'Creating git tag v0.0.4');
    runCommand('git push origin v0.0.4', 'Pushing tag to GitHub');
  }

  // Create the release
  const releaseNotes = `Release v0.0.4 - Complete Memory System Implementation

## 🎉 What's New

### ✅ Full Memory System Support
- **Add Memory**: Simple text and conversation with AI inference
- **Search Memory**: Semantic search with relevance scores  
- **Update Memory**: Content updates with re-embedding
- **Delete Memory**: Individual and batch delete operations
- **List Memory**: Get all memories for a user
- **Memory Statistics**: Analytics and insights
- **Advanced Methods**: Memory type filtering, cleanup, sorting

### 🔧 Technical Improvements
- Fixed all memory operations to work with GravixLayer vector database
- Enhanced error handling and performance
- Complete Mem0 API compatibility
- Updated TypeScript definitions
- Comprehensive test coverage

### 🧠 Memory Features
\`\`\`javascript
import { GravixLayer } from 'gravixlayer';

const client = new GravixLayer({apiKey: 'your-api-key'});
const memory = client.memory;

// Add simple memory
const result = await memory.add({
    messages: "I love Italian food",
    user_id: "alice"
});

// Add conversation with AI inference
const conversation = [
    {role: "user", content: "I'm looking for a restaurant"},
    {role: "assistant", content: "What type of cuisine?"},
    {role: "user", content: "Italian food"}
];

const result2 = await memory.add({
    messages: conversation,
    user_id: "alice",
    metadata: {category: "preferences"},
    infer: true
});

// Search memories
const searchResults = await memory.search({
    query: "food preferences",
    user_id: "alice"
});

// Get all memories
const allMemories = await memory.getAll({user_id: "alice"});

// Update memory
await memory.update({
    memory_id: "mem_123",
    user_id: "alice", 
    data: "Updated content"
});

// Delete memory
await memory.delete({
    memory_id: "mem_123",
    user_id: "alice"
});
\`\`\`

## 📦 Installation

\`\`\`bash
npm install gravixlayer@0.0.4
\`\`\`

## 🔗 Links
- [NPM Package](https://www.npmjs.com/package/gravixlayer)
- [Documentation](https://docs.gravixlayer.com)
- [Memory System Guide](https://docs.gravixlayer.com/memory)

## 🧪 Testing
All memory operations have been thoroughly tested and are working correctly with the GravixLayer backend.`;

  try {
    const releaseCommand = `gh release create v0.0.4 --title "Release v0.0.4 - Complete Memory System" --notes "${releaseNotes.replace(/"/g, '\\"')}" --latest`;
    runCommand(releaseCommand, 'Creating GitHub release v0.0.4');
    
    console.log('\n🎉 GitHub release v0.0.4 created successfully!');
    console.log('🔗 Release URL: https://github.com/gravixlayer/gravixlayer-node/releases/tag/v0.0.4');
    console.log('📋 All Releases: https://github.com/gravixlayer/gravixlayer-node/releases');
    
  } catch (error) {
    console.log(`❌ Failed to create GitHub release: ${error.message}`);
    console.log('\n📝 Manual Release Instructions:');
    console.log('1. Go to: https://github.com/gravixlayer/gravixlayer-node/releases/new');
    console.log('2. Tag: v0.0.4');
    console.log('3. Title: Release v0.0.4 - Complete Memory System');
    console.log('4. Copy the release notes from above');
    console.log('5. Click "Publish release"');
  }
}

if (require.main === module) {
  main().catch(console.error);
}