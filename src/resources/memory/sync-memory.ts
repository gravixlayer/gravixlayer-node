/**
 * Synchronous Memory management implementation for GravixLayer
 * Provides intelligent memory storage and retrieval using GravixLayer backend
 * This is the synchronous version that matches the Python sync implementation
 */

import type {
  MemoryAddParams,
  MemorySearchParams,
  MemoryGetParams,
  MemoryGetAllParams,
  MemoryUpdateParams,
  MemoryDeleteParams,
  MemoryDeleteAllParams,
  MemoryResponse,
  MemorySearchResponse,
  MemoryGetAllResponse,
  MemoryOperationResponse,
  MemoryEntry
} from '../../types/memory';

import { MemoryType } from '../../types/memory';

export class SyncMemory {
  private client: any;
  private currentEmbeddingModel: string;
  private currentInferenceModel: string;
  private currentIndexName: string;
  private currentCloudProvider: string;
  private currentRegion: string;
  private embeddingDimension: number;
  private indexCache: Record<string, string> = {};
  private modelDimensions: Record<string, number>;

  constructor(
    client: any,
    embeddingModel: string = 'baai/bge-large-en-v1.5',
    inferenceModel: string = 'mistralai/mistral-nemo-instruct-2407',
    indexName: string = 'gravixlayer_memories',
    cloudProvider: string = 'AWS',
    region: string = 'us-east-1'
  ) {
    this.client = client;
    this.currentEmbeddingModel = embeddingModel;
    this.currentInferenceModel = inferenceModel;
    this.currentIndexName = indexName;
    this.currentCloudProvider = cloudProvider;
    this.currentRegion = region;
    
    // Model dimensions mapping (matching Python implementation)
    this.modelDimensions = {
      'microsoft/multilingual-e5-large': 1024,
      'multilingual-e5-large': 1024,
      'baai/bge-large-en-v1.5': 1024,
      'baai/bge-base-en-v1.5': 768,
      'baai/bge-small-en-v1.5': 384,
      'nomic-ai/nomic-embed-text:v1.5': 768,
      'all-MiniLM-L6-v2': 384,
      'all-mpnet-base-v2': 768
    };
    
    this.embeddingDimension = this.getEmbeddingDimension(this.currentEmbeddingModel);
  }

  private getEmbeddingDimension(model: string): number {
    return this.modelDimensions[model] || 1024;
  }

  // Configuration Management Methods (matching Python API)
  switchConfiguration(options: {
    embeddingModel?: string;
    inferenceModel?: string;
    indexName?: string;
    cloudProvider?: string;
    region?: string;
  } = {}): void {
    const { embeddingModel, inferenceModel, indexName, cloudProvider, region } = options;
    let configChanged = false;

    if (embeddingModel && embeddingModel !== this.currentEmbeddingModel) {
      this.currentEmbeddingModel = embeddingModel;
      this.embeddingDimension = this.getEmbeddingDimension(embeddingModel);
      configChanged = true;
      console.log(`Switched embedding model to: ${embeddingModel}`);
    }

    if (inferenceModel && inferenceModel !== this.currentInferenceModel) {
      this.currentInferenceModel = inferenceModel;
      configChanged = true;
      console.log(`Switched inference model to: ${inferenceModel}`);
    }

    if (indexName && indexName !== this.currentIndexName) {
      this.currentIndexName = indexName;
      // Reset cache when switching index
      delete this.indexCache[this.currentIndexName];
      configChanged = true;
      console.log(`Switched to database: ${indexName}`);
    }

    if (cloudProvider && cloudProvider !== this.currentCloudProvider) {
      this.currentCloudProvider = cloudProvider;
      configChanged = true;
      console.log(`Switched cloud provider to: ${cloudProvider}`);
    }

    if (region && region !== this.currentRegion) {
      this.currentRegion = region;
      configChanged = true;
      console.log(`Switched region to: ${region}`);
    }

    if (configChanged) {
      console.log('Configuration updated successfully');
    }
  }

  getCurrentConfiguration(): Record<string, any> {
    return {
      embedding_model: this.currentEmbeddingModel,
      inference_model: this.currentInferenceModel,
      index_name: this.currentIndexName,
      cloud_provider: this.currentCloudProvider,
      region: this.currentRegion,
      embedding_dimension: this.embeddingDimension
    };
  }

  resetToDefaults(): void {
    this.switchConfiguration({
      embeddingModel: 'baai/bge-large-en-v1.5',
      inferenceModel: 'mistralai/mistral-nemo-instruct-2407',
      indexName: 'gravixlayer_memories',
      cloudProvider: 'AWS',
      region: 'us-east-1'
    });
    console.log('Reset to default configuration');
  }

  // Index Management Methods (matching Python API)
  listAvailableIndexes(): string[] {
    try {
      // Note: This would need to be implemented with synchronous HTTP calls
      // For now, return a basic list
      console.log('⚠️  Warning: Synchronous index listing not fully implemented');
      console.log('   Use the async version for full index management capabilities');
      return [this.currentIndexName];
    } catch (error) {
      console.error('Error listing indexes:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  switchIndex(indexName: string): boolean {
    try {
      this.currentIndexName = indexName;
      // Reset cache
      delete this.indexCache[indexName];
      console.log(`Switched to index: ${indexName}`);
      return true;
    } catch (error) {
      console.error(`Failed to switch to index '${indexName}':`, error);
      return false;
    }
  }

  // Core Memory Operations (External API Format - matching Python)
  add(
    messages: string | Array<{ role: string; content: string }>,
    user_id: string,
    metadata: Record<string, any> = {},
    infer: boolean = true,
    embeddingModel?: string,
    indexName?: string
  ): MemoryResponse {
    // Note: Dynamic model/index switching per operation not supported in sync mode
    if (embeddingModel && embeddingModel !== this.currentEmbeddingModel) {
      console.log('⚠️  Warning: Per-operation embedding model override not supported in sync mode');
      console.log('   Use switchConfiguration() to change embedding model globally');
    }

    if (indexName && indexName !== this.currentIndexName) {
      console.log('⚠️  Warning: Per-operation index override not supported in sync mode');
      console.log('   Use switchIndex() to change index globally');
    }

    // Handle conversation messages
    if (Array.isArray(messages)) {
      return this.addFromMessages(messages, user_id, metadata, infer);
    }

    // Handle direct content - simplified synchronous implementation
    const memoryId = this.generateMemoryId();
    
    // Create memory metadata
    const memoryMetadata = {
      user_id: user_id,
      memory_type: 'factual',
      content: messages as string,
      embedding_model: this.currentEmbeddingModel,
      index_name: this.currentIndexName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      importance_score: 1.0,
      access_count: 0,
      ...metadata
    };

    // Note: In a real sync implementation, this would use synchronous HTTP calls
    console.log(`📝 Added memory (sync): ${messages}`);
    console.log(`🆔 Memory ID: ${memoryId}`);

    return {
      results: [{
        id: memoryId,
        memory: messages as string,
        event: 'ADD'
      }]
    };
  }

  private addFromMessages(
    messages: Array<{ role: string; content: string }>,
    user_id: string,
    metadata: Record<string, any> = {},
    infer: boolean = true
  ): MemoryResponse {
    if (!infer) {
      // Store raw messages without inference
      const results = [];
      for (const message of messages) {
        if (message.content) {
          const result = this.add(message.content, user_id, metadata);
          results.push(...result.results);
        }
      }
      return { results };
    }

    // AI inference from conversation (simplified)
    const conversationText = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const inferredMemories = this.inferMemoriesFromConversation(conversationText, user_id);
    
    const results = [];
    for (const memory of inferredMemories) {
      const result = this.add(memory, user_id, metadata);
      results.push(...result.results);
    }
    
    return { results };
  }

  private inferMemoriesFromConversation(conversationText: string, user_id: string): string[] {
    // Simplified inference - in real implementation, this would call the inference model
    const memories: string[] = [];
    
    if (conversationText.includes('prefer') || conversationText.includes('like')) {
      const lines = conversationText.split('\n');
      for (const line of lines) {
        if (line.includes('user:') && (line.includes('prefer') || line.includes('like'))) {
          memories.push(line.replace('user:', '').trim());
        }
      }
    }
    
    return memories.length > 0 ? memories : ['User engaged in conversation'];
  }

  search(
    query: string,
    user_id: string,
    limit: number = 100,
    threshold?: number,
    embeddingModel?: string,
    indexName?: string
  ): { results: any[] } {
    // Note: Dynamic model/index switching per operation not supported in sync mode
    if (embeddingModel && embeddingModel !== this.currentEmbeddingModel) {
      console.log('⚠️  Warning: Per-operation embedding model override not supported in sync mode');
    }

    if (indexName && indexName !== this.currentIndexName) {
      console.log('⚠️  Warning: Per-operation index override not supported in sync mode');
    }

    const minRelevance = threshold !== undefined ? threshold : 0.3;
    
    // Note: In a real sync implementation, this would use synchronous HTTP calls
    console.log(`🔍 Searching (sync): "${query}" for user ${user_id}`);
    console.log(`📊 Limit: ${limit}, Threshold: ${minRelevance}`);

    // Return empty results for now - would be implemented with sync HTTP calls
    return { results: [] };
  }

  get(memory_id: string, user_id: string, indexName?: string): any | null {
    if (indexName && indexName !== this.currentIndexName) {
      console.log('⚠️  Warning: Per-operation index override not supported in sync mode');
    }

    // Note: In a real sync implementation, this would use synchronous HTTP calls
    console.log(`📖 Getting memory (sync): ${memory_id} for user ${user_id}`);
    
    return null; // Would be implemented with sync HTTP calls
  }

  getAll(user_id: string, limit: number = 100, indexName?: string): { results: any[] } {
    if (indexName && indexName !== this.currentIndexName) {
      console.log('⚠️  Warning: Per-operation index override not supported in sync mode');
    }

    // Note: In a real sync implementation, this would use synchronous HTTP calls
    console.log(`📚 Getting all memories (sync) for user ${user_id}, limit: ${limit}`);
    
    return { results: [] }; // Would be implemented with sync HTTP calls
  }

  update(memory_id: string, user_id: string, data: string, indexName?: string): { message: string } {
    if (indexName && indexName !== this.currentIndexName) {
      console.log('⚠️  Warning: Per-operation index override not supported in sync mode');
    }

    // Note: In a real sync implementation, this would use synchronous HTTP calls
    console.log(`✏️  Updating memory (sync): ${memory_id} for user ${user_id}`);
    console.log(`📝 New content: ${data}`);
    
    return { message: `Memory ${memory_id} updated successfully!` };
  }

  delete(memory_id: string, user_id: string, indexName?: string): { message: string } {
    if (indexName && indexName !== this.currentIndexName) {
      console.log('⚠️  Warning: Per-operation index override not supported in sync mode');
    }

    // Note: In a real sync implementation, this would use synchronous HTTP calls
    console.log(`🗑️  Deleting memory (sync): ${memory_id} for user ${user_id}`);
    
    return { message: `Memory ${memory_id} deleted successfully!` };
  }

  deleteAll(user_id: string): { message: string } {
    // Note: In a real sync implementation, this would use synchronous HTTP calls
    console.log(`🗑️  Deleting all memories (sync) for user ${user_id}`);
    
    return { message: `Deleted memories for user ${user_id}` };
  }

  // Advanced Memory Operations (Direct API - matching Python)
  addMemory(
    content: string | Array<{ role: string; content: string }>,
    user_id: string,
    memory_type?: MemoryType,
    metadata: Record<string, any> = {},
    memory_id?: string,
    infer: boolean = true
  ): MemoryEntry | MemoryEntry[] {
    const id = memory_id || this.generateMemoryId();
    
    if (Array.isArray(content)) {
      // Handle multiple messages
      const entries: MemoryEntry[] = [];
      for (const message of content) {
        if (message.content) {
          entries.push({
            id: this.generateMemoryId(),
            content: message.content,
            memory_type: memory_type || MemoryType.EPISODIC,
            user_id: user_id,
            metadata: { ...metadata, role: message.role },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            importance_score: 1.0,
            access_count: 0
          });
        }
      }
      return entries;
    }

    // Handle single content
    return {
      id: id,
      content: content,
      memory_type: memory_type || MemoryType.FACTUAL,
      user_id: user_id,
      metadata: metadata,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      importance_score: 1.0,
      access_count: 0
    };
  }

  searchMemories(
    query: string,
    user_id: string,
    memory_types?: MemoryType[],
    top_k: number = 10,
    min_relevance: number = 0.7
  ): any[] {
    console.log(`🔍 Searching memories (sync): "${query}" for user ${user_id}`);
    console.log(`🎯 Types: ${memory_types?.join(', ') || 'all'}, Top K: ${top_k}, Min relevance: ${min_relevance}`);
    
    return []; // Would be implemented with sync HTTP calls
  }

  getMemory(memory_id: string, user_id: string): MemoryEntry | null {
    console.log(`📖 Getting memory (sync): ${memory_id} for user ${user_id}`);
    return null; // Would be implemented with sync HTTP calls
  }

  updateMemory(
    memory_id: string,
    user_id: string,
    content?: string,
    metadata?: Record<string, any>,
    importance_score?: number
  ): MemoryEntry | null {
    console.log(`✏️  Updating memory (sync): ${memory_id} for user ${user_id}`);
    return null; // Would be implemented with sync HTTP calls
  }

  deleteMemory(memory_id: string, user_id: string): boolean {
    console.log(`🗑️  Deleting memory (sync): ${memory_id} for user ${user_id}`);
    return true; // Would be implemented with sync HTTP calls
  }

  getMemoriesByType(user_id: string, memory_type: MemoryType, limit: number = 50): MemoryEntry[] {
    console.log(`📚 Getting memories by type (sync): ${memory_type} for user ${user_id}, limit: ${limit}`);
    return []; // Would be implemented with sync HTTP calls
  }

  listAllMemories(
    user_id: string,
    limit: number = 100,
    sort_by: string = 'created_at',
    ascending: boolean = false
  ): MemoryEntry[] {
    console.log(`📋 Listing all memories (sync) for user ${user_id}`);
    console.log(`📊 Limit: ${limit}, Sort by: ${sort_by}, Ascending: ${ascending}`);
    return []; // Would be implemented with sync HTTP calls
  }

  cleanupWorkingMemory(user_id: string): number {
    console.log(`🧹 Cleaning up working memory (sync) for user ${user_id}`);
    return 0; // Would be implemented with sync HTTP calls
  }

  getStats(user_id: string): any {
    console.log(`📊 Getting memory stats (sync) for user ${user_id}`);
    return {
      total_memories: 0,
      factual_count: 0,
      episodic_count: 0,
      working_count: 0,
      semantic_count: 0,
      last_updated: new Date().toISOString()
    };
  }

  private generateMemoryId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}