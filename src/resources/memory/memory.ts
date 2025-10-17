/**
 * Memory management implementation for GravixLayer
 * Provides intelligent memory storage and retrieval using GravixLayer backend
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

export class Memory {
  private client: any;
  private currentEmbeddingModel: string;
  private currentInferenceModel: string;
  private currentIndexName: string;
  private currentCloudConfig: Record<string, any>;
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
    this.currentCloudConfig = {
      cloud_provider: cloudProvider,
      region: region,
      index_type: 'serverless'
    };
    
    // Model dimensions mapping (matching Python implementation)
    this.modelDimensions = {
      'microsoft/multilingual-e5-large': 1024, // Server maps to baai/bge-large-en-v1.5
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

  /**
   * Add memories with AI-powered processing
   */
  async add(
    messages: string | Array<{ role: string; content: string }>,
    user_id: string,
    options: {
      metadata?: Record<string, any>;
      infer?: boolean;
      embeddingModel?: string;
      databaseName?: string;
    } = {}
  ): Promise<MemoryResponse> {
    const { metadata, infer = true, embeddingModel, databaseName } = options;
    
    // Handle conversation messages
    if (Array.isArray(messages)) {
      return await this.addFromMessages(messages, user_id, metadata, infer, embeddingModel, databaseName);
    }

    // Handle direct content
    const activeEmbeddingModel = embeddingModel || this.currentEmbeddingModel;
    const targetDatabase = databaseName || this.currentIndexName;
    
    const indexId = await this.ensureSharedIndex(targetDatabase);
    const vectorsClient = this.client.vectors.index(indexId);
    
    // Generate memory ID
    const memoryId = this.generateMemoryId();
    
    // Create memory metadata
    const memoryMetadata = {
      user_id: user_id,
      memory_type: 'factual',
      content: messages as string,
      embedding_model: activeEmbeddingModel,
      database_name: targetDatabase,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      importance_score: 1.0,
      access_count: 0,
      ...metadata
    };

    // Store memory as vector
    await vectorsClient.upsertText(
      messages as string,
      activeEmbeddingModel,
      memoryId,
      memoryMetadata
    );

    return {
      results: [{
        id: memoryId,
        memory: messages as string,
        event: 'ADD'
      }]
    };
  }

  private async addFromMessages(
    messages: Array<{ role: string; content: string }>,
    user_id: string,
    metadata: Record<string, any> = {},
    infer: boolean = true,
    embeddingModel?: string,
    databaseName?: string
  ): Promise<MemoryResponse> {
    if (!infer) {
      // Store raw messages without inference
      const results = [];
      for (const message of messages) {
        if (message.content) {
          const result = await this.add(message.content, user_id, { metadata, embeddingModel, databaseName });
          results.push(...result.results);
        }
      }
      return { results };
    }

    // AI inference from conversation
    const conversationText = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const inferredMemories = await this.inferMemoriesFromConversation(conversationText, user_id);
    
    const results = [];
    for (const memory of inferredMemories) {
      const result = await this.add(memory, user_id, { metadata, embeddingModel, databaseName });
      results.push(...result.results);
    }
    
    return { results };
  }

  private async inferMemoriesFromConversation(conversationText: string, user_id: string): Promise<string[]> {
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

  /**
   * Search memories using semantic similarity
   */
  async search(
    query: string,
    user_id: string,
    options: {
      limit?: number;
      threshold?: number;
      embeddingModel?: string;
      databaseName?: string;
    } = {}
  ): Promise<{ results: any[] }> {
    const { limit = 100, threshold = 0.3, embeddingModel, databaseName } = options;
    const activeEmbeddingModel = embeddingModel || this.currentEmbeddingModel;
    const targetDatabase = databaseName || this.currentIndexName;
    
    try {
      const indexId = await this.ensureSharedIndex(targetDatabase);
      const vectorsClient = this.client.vectors.index(indexId);

      const searchResults = await vectorsClient.searchText(
        query,
        activeEmbeddingModel,
        limit,
        { user_id: user_id },
        true, // include_metadata
        false // include_values
      );

      const results = [];
      for (const hit of searchResults.hits || []) {
        if (hit.metadata?.user_id === user_id && hit.score >= threshold) {
          results.push({
            id: hit.id,
            memory: hit.metadata?.content || '',
            hash: hit.metadata?.hash || '',
            metadata: hit.metadata || {},
            score: hit.score,
            created_at: hit.metadata?.created_at || new Date().toISOString(),
            updated_at: hit.metadata?.updated_at || new Date().toISOString()
          });
        }
      }

      return { results };
    } catch (error) {
      console.error('Search error:', error instanceof Error ? error.message : String(error));
      return { results: [] };
    }
  }

  async getAll(user_id: string, limit: number = 100): Promise<{ results: any[] }> {
    return await this.search('memory', user_id, { limit, threshold: 0.0 });
  }

  /**
   * Get memory by ID
   */
  async get(memory_id: string, user_id: string): Promise<any | null> {
    try {
      const indexId = await this.ensureSharedIndex();
      const vectorsClient = this.client.vectors.index(indexId);
      
      const vector = await vectorsClient.get(memory_id);
      
      if (vector?.metadata?.user_id !== user_id) {
        return null;
      }

      return {
        id: vector.id,
        memory: vector.metadata?.content || '',
        hash: vector.metadata?.hash || '',
        metadata: vector.metadata || {},
        created_at: vector.metadata?.created_at || new Date().toISOString(),
        updated_at: vector.metadata?.updated_at || new Date().toISOString()
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Update memory content
   */
  async update(memory_id: string, user_id: string, data: string): Promise<{ message: string }> {
    try {
      const indexId = await this.ensureSharedIndex();
      
      // Get current memory and verify ownership
      const currentMemory = await this.get(memory_id, user_id);
      if (!currentMemory) {
        return { message: `Memory ${memory_id} not found or update failed.` };
      }

      // Update metadata
      const updatedMetadata = {
        ...currentMemory.metadata,
        content: data,
        updated_at: new Date().toISOString()
      };

      // Re-embed with new content
      const vectorsClient = this.client.vectors.index(indexId);
      await vectorsClient.upsertText(
        data,
        this.currentEmbeddingModel,
        memory_id,
        updatedMetadata
      );

      return { message: `Memory ${memory_id} updated successfully!` };
    } catch (error) {
      return { message: `Memory ${memory_id} not found or update failed.` };
    }
  }

  /**
   * Delete memory by ID
   */
  async delete(memory_id: string, user_id: string): Promise<{ message: string }> {
    try {
      const indexId = await this.ensureSharedIndex();
      
      // Verify memory belongs to user
      const memory = await this.get(memory_id, user_id);
      if (!memory) {
        return { message: `Memory ${memory_id} not found or deletion failed.` };
      }

      const vectorsClient = this.client.vectors.index(indexId);
      await vectorsClient.delete(memory_id);
      return { message: `Memory ${memory_id} deleted successfully!` };
    } catch (error) {
      return { message: `Memory ${memory_id} not found or deletion failed.` };
    }
  }

  // Dynamic Configuration Methods
  switchConfiguration(options: {
    embeddingModel?: string;
    inferenceModel?: string;
    indexName?: string;
    cloudProvider?: string;
    region?: string;
  } = {}): void {
    const { embeddingModel, inferenceModel, indexName, cloudProvider, region } = options;

    if (embeddingModel) {
      this.currentEmbeddingModel = embeddingModel;
      this.embeddingDimension = this.getEmbeddingDimension(embeddingModel);
      console.log(`🔄 Switched embedding model to: ${embeddingModel}`);
      console.log(`📏 Updated dimension to: ${this.embeddingDimension}`);
    }

    if (inferenceModel) {
      this.currentInferenceModel = inferenceModel;
      console.log(`🔄 Switched inference model to: ${inferenceModel}`);
    }

    if (indexName) {
      this.currentIndexName = indexName;
      console.log(`🔄 Switched to database: ${indexName}`);
    }

    if (cloudProvider || region) {
      this.currentCloudConfig = {
        cloud_provider: cloudProvider || this.currentCloudConfig.cloud_provider,
        region: region || this.currentCloudConfig.region,
        index_type: 'serverless'
      };
      console.log(`🔄 Switched cloud config:`, this.currentCloudConfig);
    }

    console.log('✅ Configuration updated successfully');
  }

  getCurrentConfiguration(): Record<string, any> {
    return {
      embedding_model: this.currentEmbeddingModel,
      inference_model: this.currentInferenceModel,
      index_name: this.currentIndexName,
      cloud_config: this.currentCloudConfig,
      embedding_dimension: this.embeddingDimension
    };
  }

  resetToDefaults(): void {
    this.currentEmbeddingModel = 'baai/bge-large-en-v1.5';
    this.currentInferenceModel = 'mistralai/mistral-nemo-instruct-2407';
    this.currentIndexName = 'gravixlayer_memories';
    this.currentCloudConfig = {
      cloud_provider: 'AWS',
      region: 'us-east-1',
      index_type: 'serverless'
    };
    this.embeddingDimension = this.getEmbeddingDimension(this.currentEmbeddingModel);
    console.log('🔄 Reset to default configuration');
  }

  async listAvailableDatabases(): Promise<string[]> {
    try {
      const indexList = await this.client._makeRequest('GET', 'https://api.gravixlayer.com/v1/vectors/indexes');
      const indexData = await indexList.json();
      const databaseNames: string[] = [];
      
      for (const idx of indexData.indexes || []) {
        if (idx.metadata && idx.metadata.type === 'unified_memory_store') {
          databaseNames.push(idx.name);
        } else if (['gravixlayer_memories', 'user_preferences', 'conversation_history'].includes(idx.name)) {
          databaseNames.push(idx.name);
        } else if (!databaseNames.includes(idx.name)) {
          databaseNames.push(idx.name);
        }
      }
      
      return databaseNames.sort();
    } catch (error) {
      console.error('Error listing databases:', error instanceof Error ? error.message : String(error));
      return ['gravixlayer_memories'];
    }
  }

  /**
   * Get memories by type - Additional method from Python implementation
   */
  async getMemoriesByType(
    user_id: string,
    memory_type: MemoryType,
    limit: number = 50
  ): Promise<MemoryEntry[]> {
    try {
      const allMemories = await this.getAll(user_id, 1000);
      
      return allMemories.results
        .filter(memory => memory.memory_type === memory_type)
        .slice(0, limit);
    } catch (error) {
      console.error('getMemoriesByType failed:', error);
      return [];
    }
  }

  /**
   * Cleanup working memory - Additional method from Python implementation
   */
  async cleanupWorkingMemory(user_id: string): Promise<number> {
    try {
      const workingMemories = await this.getMemoriesByType(user_id, MemoryType.WORKING);
      
      let cleanedCount = 0;
      const cutoffTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      
      for (const memory of workingMemories) {
        const createdAt = new Date(memory.created_at);
        if (createdAt < cutoffTime) {
          try {
            await this.delete(memory.id, user_id);
            cleanedCount++;
          } catch (error) {
            console.warn(`Failed to delete expired memory ${memory.id}:`, error);
          }
        }
      }
      
      return cleanedCount;
    } catch (error) {
      console.error('cleanupWorkingMemory failed:', error);
      return 0;
    }
  }

  /**
   * List all memories with sorting - Additional method from Python implementation
   */
  async listAllMemories(
    user_id: string,
    limit: number = 100,
    sort_by: string = 'created_at',
    ascending: boolean = false
  ): Promise<MemoryEntry[]> {
    try {
      const allMemories = await this.getAll(user_id, limit);
      
      // Sort memories based on the specified field
      allMemories.results.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sort_by) {
          case 'created_at':
            aValue = new Date(a.created_at);
            bValue = new Date(b.created_at);
            break;
          case 'updated_at':
            aValue = new Date(a.updated_at);
            bValue = new Date(b.updated_at);
            break;
          case 'importance_score':
            aValue = a.importance_score || 0;
            bValue = b.importance_score || 0;
            break;
          case 'access_count':
            aValue = a.access_count || 0;
            bValue = b.access_count || 0;
            break;
          default:
            return 0;
        }
        
        if (ascending) {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
      
      return allMemories.results;
    } catch (error) {
      console.error('listAllMemories failed:', error);
      return [];
    }
  }

  /**
   * Get memory statistics - Additional method from Python implementation
   */
  async getStats(user_id: string): Promise<any> {
    try {
      const allMemories = await this.getAll(user_id, 1000);
      
      const stats = {
        total_memories: allMemories.results.length,
        factual_count: 0,
        episodic_count: 0,
        working_count: 0,
        semantic_count: 0,
        last_updated: new Date(0).toISOString()
      };
      
      for (const memory of allMemories.results) {
        switch (memory.memory_type) {
          case MemoryType.FACTUAL:
            stats.factual_count++;
            break;
          case MemoryType.EPISODIC:
            stats.episodic_count++;
            break;
          case MemoryType.WORKING:
            stats.working_count++;
            break;
          case MemoryType.SEMANTIC:
            stats.semantic_count++;
            break;
        }
        
        if (memory.updated_at > stats.last_updated) {
          stats.last_updated = memory.updated_at;
        }
      }
      
      return stats;
    } catch (error) {
      console.error('getStats failed:', error);
      return {
        total_memories: 0,
        factual_count: 0,
        episodic_count: 0,
        working_count: 0,
        semantic_count: 0,
        last_updated: new Date().toISOString()
      };
    }
  }

  private generateMemoryId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private async ensureSharedIndex(targetDatabase?: string): Promise<string> {
    const targetIndexName = targetDatabase || this.currentIndexName;
    
    // Check cache first
    if (this.indexCache[targetIndexName]) {
      return this.indexCache[targetIndexName];
    }

    try {
      // Try to find existing index
      const listResponse = await this.client._makeRequest('GET', 'https://api.gravixlayer.com/v1/vectors/indexes');
      const indexList = await listResponse.json();
      
      for (const idx of indexList.indexes || []) {
        if (idx.name === targetIndexName) {
          this.indexCache[targetIndexName] = idx.id;
          return idx.id;
        }
      }

      // Index not found, create it
      console.log(`\n🔍 Memory index '${targetIndexName}' not found`);
      console.log(`🎯 Embedding model: ${this.currentEmbeddingModel}`);
      console.log(`📏 Dimension: ${this.embeddingDimension}`);
      console.log(`☁️  Cloud config:`, this.currentCloudConfig);
      console.log(`🚀 Creating memory index...`);

      const createData = {
        name: targetIndexName,
        dimension: this.embeddingDimension,
        metric: 'cosine',
        vector_type: 'dense',
        ...this.currentCloudConfig,
        metadata: {
          type: 'unified_memory_store',
          embedding_model: this.currentEmbeddingModel,
          dimension: this.embeddingDimension,
          created_at: new Date().toISOString(),
          description: `Unified memory store: ${targetIndexName}`,
          cloud_config: this.currentCloudConfig
        },
        delete_protection: false
      };

      const createResponse = await this.client._makeRequest('POST', 'https://api.gravixlayer.com/v1/vectors/indexes', createData);
      const result = await createResponse.json();
      
      this.indexCache[targetIndexName] = result.id;
      console.log(`✅ Successfully created memory index: ${result.id}`);
      return result.id;

    } catch (error) {
      throw new Error(`Failed to create memory index '${targetIndexName}': ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}