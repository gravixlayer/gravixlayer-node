# Changelog

All notable changes to the GravixLayer JavaScript SDK will be documented in this file.

## [0.1.1] - 2024-12-19

### Added
- **Memory Management**: Complete Mem0-compatible memory system
  - Add, search, get, update, and delete memories for users
  - AI-powered memory inference and processing
  - User-specific memory isolation using vector indexes
  - Support for different memory types (factual, episodic, working, semantic)
  - CLI commands for memory operations (`gravixlayer memory`)
  - Full TypeScript type definitions for memory functionality

### Enhanced
- **Client**: Updated main client to include memory resource
- **CLI**: Added comprehensive memory management commands
- **Documentation**: Updated README with memory API examples and CLI usage

## [0.1.0] - 2024-12-19

### Added
- **File Management**: Complete file management API with upload, list, retrieve, delete, and content operations
  - Support for multiple file formats (PDF, TXT, DOCX, MD, PNG, JPG, JSON, CSV, etc.)
  - File purposes: assistants, batch, batch_output, fine-tune, vision, user_data, evals
  - File expiration support
  - CLI commands for file operations
- **Vector Database**: Full vector database implementation
  - Vector index management (create, list, get, update, delete)
  - Vector operations (upsert, batch upsert, search, list, get, update, delete)
  - Text-to-vector conversion with automatic embedding
  - Support for cosine, euclidean, and dot_product metrics
  - Metadata filtering and search
  - CLI commands for vector operations
- **Enhanced Text Completions**: Improved text completions with streaming support
- **Enhanced CLI**: Comprehensive command-line interface
  - File management commands (`gravixlayer files`)
  - Vector database commands (`gravixlayer vectors`)
  - Improved deployment management
  - Better error handling and user feedback
- **TypeScript Types**: Complete type definitions for all new features
- **Examples**: Added comprehensive example showcasing all features

### Enhanced
- **Client**: Updated main client to include files and vectors resources
- **Async Support**: All new features support async/await patterns
- **Error Handling**: Improved error handling across all resources
- **Documentation**: Updated README with comprehensive API examples

### Technical
- Added FormData support for file uploads
- Enhanced streaming support for completions
- Improved URL handling for different API endpoints
- Better compatibility with OpenAI SDK patterns

## [0.0.4] - Previous Release
- Basic chat completions, embeddings, deployments, and accelerators support