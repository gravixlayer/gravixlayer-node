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
  private embeddingModel: string;
  private inferenceModel: string;

  constructor(
    client: any,
    embeddingModel: string = 'baai/bge-large-en-v1.5',
    inferenceModel: string = 'meta-llama/llama-3.1-8b-instruct'
  ) {
    this.client = client;
    this.embeddingModel = embeddingModel;
    this.inferenceModel = inferenceModel;
  }

  /**
   * Add memories with AI-powered processing
   */
  async add(params: MemoryAddParams): Promise<MemoryResponse> {
    const { messages, user_id, metadata, infer = true } = params;
    
    // Handle input types
    let messageList: Array<{ role: string; content: string }>;
    if (typeof messages === 'string') {
      messageList = [{ role: 'user', content: messages }];
    } else if (Array.isArray(messages)) {
      messageList = messages;
    } else {
      throw new Error('Messages must be a string or array of message objects');
    }

    const results = [];
    
    for (const message of messageList) {
      if (!message.content) continue;
      
      let processedContent = message.content;
      
      // If inference is enabled, process the content with AI
      if (infer) {
        try {
          const inferenceResponse = await this.client._makeRequest(
            'POST',
            'chat/completions',
            {
              model: this.inferenceModel,
              messages: [
                {
                  role: 'system',
                  content: 'Extract and summarize the key factual information from the following message that should be remembered. Focus on preferences, facts, and important details. Return only the essential information to remember.'
                },
                {
                  role: 'user',
                  content: message.content
                }
              ],
              max_tokens: 200
            }
          );
          
          const inferenceData = await inferenceResponse.json();
          if (inferenceData.choices?.[0]?.message?.content) {
            processedContent = inferenceData.choices[0].message.content.trim();
          }
        } catch (error) {
          console.warn('Inference failed, using original content:', error);
        }
      }

      // Create memory entry
      const memoryId = await this._createMemory(processedContent, user_id, metadata);
      
      results.push({
        id: memoryId,
        memory: processedContent,
        event: 'ADD'
      });
    }

    return { results };
  }

  /**
   * Search memories using semantic similarity
   */
  async search(params: MemorySearchParams): Promise<MemorySearchResponse> {
    const { query, user_id, limit = 100, threshold } = params;
    
    try {
      const indexId = await this._ensureSharedIndex();
      
      // Use the vectors client to search
      const vectorsClient = this.client.vectors.index(indexId);
      const searchResults = await vectorsClient.searchText(
        query,
        this.embeddingModel,
        limit,
        {
          user_id: user_id
        },
        true, // include_metadata
        false // include_values
      );
      
      const results = searchResults.hits?.map((hit: any) => ({
        memory: {
          id: hit.id,
          content: hit.metadata?.content || '',
          memory_type: hit.metadata?.memory_type || 'factual',
          user_id: user_id,
          metadata: hit.metadata || {},
          created_at: hit.metadata?.created_at || new Date().toISOString(),
          updated_at: hit.metadata?.updated_at || new Date().toISOString(),
          importance_score: hit.metadata?.importance_score || 1.0,
          access_count: hit.metadata?.access_count || 0
        },
        relevance_score: hit.score || 0
      })) || [];

      return { results };
    } catch (error) {
      console.error('Memory search failed:', error);
      return { results: [] };
    }
  }

  /**
   * Get memory by ID
   */
  async get(params: MemoryGetParams): Promise<MemoryEntry | null> {
    const { memory_id, user_id } = params;
    
    try {
      const indexId = await this._ensureSharedIndex();
      
      // Use the vectors client to get the specific vector
      const vectorsClient = this.client.vectors.index(indexId);
      const vector = await vectorsClient.get(memory_id);
      
      // Verify the memory belongs to the user
      if (vector && vector.metadata?.user_id === user_id) {
        return {
          id: vector.id,
          content: vector.metadata?.content || '',
          memory_type: vector.metadata?.memory_type || 'factual',
          user_id: user_id,
          metadata: vector.metadata || {},
          created_at: vector.metadata?.created_at || new Date().toISOString(),
          updated_at: vector.metadata?.updated_at || new Date().toISOString(),
          importance_score: vector.metadata?.importance_score || 1.0,
          access_count: vector.metadata?.access_count || 0
        };
      }
      
      return null;
    } catch (error) {
      console.error('Memory get failed:', error);
      return null;
    }
  }

  /**
   * Get all memories for a user
   */
  async getAll(params: MemoryGetAllParams): Promise<MemoryGetAllResponse> {
    const { user_id, limit = 100 } = params;
    
    try {
      const indexId = await this._ensureSharedIndex();
      
      // Use the vectors client to list all vectors
      const vectorsClient = this.client.vectors.index(indexId);
      const vectorsList = await vectorsClient.list();
      
      // Filter vectors by user_id and limit results
      const userVectors = Object.values(vectorsList.vectors || {})
        .filter((vector: any) => vector.metadata?.user_id === user_id)
        .slice(0, limit);
      
      const results = userVectors.map((vector: any) => ({
        id: vector.id,
        content: vector.metadata?.content || '',
        memory_type: vector.metadata?.memory_type || 'factual',
        user_id: user_id,
        metadata: vector.metadata || {},
        created_at: vector.metadata?.created_at || new Date().toISOString(),
        updated_at: vector.metadata?.updated_at || new Date().toISOString(),
        importance_score: vector.metadata?.importance_score || 1.0,
        access_count: vector.metadata?.access_count || 0
      }));

      return { results };
    } catch (error) {
      console.error('Memory getAll failed:', error);
      return { results: [] };
    }
  }

  /**
   * Update memory content
   */
  async update(params: MemoryUpdateParams): Promise<MemoryOperationResponse> {
    const { memory_id, user_id, data } = params;
    
    try {
      const indexId = await this._ensureSharedIndex();
      
      // Get current memory to verify ownership and get metadata
      const currentMemory = await this.get({ memory_id, user_id });
      if (!currentMemory) {
        throw new Error('Memory not found or access denied');
      }

      // Use the vectors client to update the memory with new content
      const vectorsClient = this.client.vectors.index(indexId);
      await vectorsClient.upsertText(
        data,
        this.embeddingModel,
        memory_id,
        {
          ...currentMemory.metadata,
          content: data,
          updated_at: new Date().toISOString()
        }
      );

      return { message: 'Memory updated successfully!' };
    } catch (error) {
      throw new Error(`Failed to update memory: ${error}`);
    }
  }

  /**
   * Delete memory by ID
   */
  async delete(params: MemoryDeleteParams): Promise<MemoryOperationResponse> {
    const { memory_id, user_id } = params;
    
    try {
      const indexId = await this._ensureSharedIndex();
      
      // Verify memory belongs to user before deleting
      const memory = await this.get({ memory_id, user_id });
      if (!memory) {
        throw new Error('Memory not found or access denied');
      }

      // Use the vectors client to delete the vector
      const vectorsClient = this.client.vectors.index(indexId);
      await vectorsClient.delete(memory_id);

      return { message: 'Memory deleted successfully!' };
    } catch (error) {
      throw new Error(`Failed to delete memory: ${error}`);
    }
  }

  /**
   * Delete all memories for a user
   */
  async deleteAll(params: MemoryDeleteAllParams): Promise<MemoryOperationResponse> {
    const { user_id } = params;
    
    try {
      // Get all memories first
      const allMemories = await this.getAll({ user_id });
      
      // Delete each memory
      for (const memory of allMemories.results) {
        await this.delete({ memory_id: memory.id, user_id });
      }

      return { message: `Deleted ${allMemories.results.length} memories successfully` };
    } catch (error) {
      throw new Error(`Failed to delete all memories: ${error}`);
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
      const allMemories = await this.getAll({ user_id, limit: 1000 });
      
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
            await this.delete({ memory_id: memory.id, user_id });
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
      const allMemories = await this.getAll({ user_id, limit });
      
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
      const allMemories = await this.getAll({ user_id, limit: 1000 });
      
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

  /**
   * Create a memory entry using the unified memory system
   */
  private async _createMemory(
    content: string,
    userId: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    const memoryId = this._generateMemoryId();
    
    // Ensure shared memory index exists
    const indexId = await this._ensureSharedIndex();
    
    const memoryMetadata = {
      user_id: userId,
      memory_type: 'factual',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      importance_score: 1.0,
      access_count: 0,
      content: content,
      ...metadata
    };

    // Use the vectors client to create the memory
    const vectorsClient = this.client.vectors.index(indexId);
    const result = await vectorsClient.upsertText(
      content,
      this.embeddingModel,
      memoryId,
      memoryMetadata
    );

    return result.id || memoryId;
  }

  /**
   * Generate a unique memory ID
   */
  private _generateMemoryId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Ensure shared memory index exists
   */
  private async _ensureSharedIndex(): Promise<string> {
    if (this.sharedIndexId) {
      return this.sharedIndexId;
    }

    const indexName = 'gravixlayer_memories';
    
    try {
      // Try to find existing index
      const listResponse = await this.client._makeRequest(
        'GET',
        'https://api.gravixlayer.com/v1/vectors/indexes'
      );
      
      const indexList = await listResponse.json();
      const existingIndex = indexList.indexes?.find((idx: any) => idx.name === indexName);
      
      if (existingIndex) {
        this.sharedIndexId = existingIndex.id;
        return existingIndex.id;
      }

      // Create new shared index
      console.log('🔍 Creating memory collection \'gravixlayer_memories\'...');
      const createResponse = await this.client._makeRequest(
        'POST',
        'https://api.gravixlayer.com/v1/vectors/indexes',
        {
          name: indexName,
          dimension: 1024, // Dimension for baai/bge-large-en-v1.5
          metric: 'cosine',
          vector_type: 'dense',
          cloud_provider: 'AWS',
          region: 'us-east-1',
          index_type: 'serverless',
          metadata: {
            type: 'shared_memory_store',
            description: 'Shared memory store for all users',
            created_at: new Date().toISOString()
          },
          delete_protection: true
        }
      );

      const result = await createResponse.json();
      this.sharedIndexId = result.id;
      console.log(`✅ Successfully created memory collection: ${result.id}`);
      return result.id;

    } catch (error) {
      throw new Error(`Failed to ensure shared memory index: ${error}`);
    }
  }

  private sharedIndexId?: string;
}