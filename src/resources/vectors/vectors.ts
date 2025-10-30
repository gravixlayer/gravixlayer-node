/**
 * Vectors resource for GravixLayer SDK
 */
import {
  Vector,
  TextVector,
  VectorSearchResponse,
  TextSearchResponse,
  BatchUpsertResponse,
  VectorListResponse,
  VectorDictResponse,
  UpsertVectorRequest,
  UpsertTextVectorRequest,
  BatchUpsertRequest,
  BatchUpsertTextRequest,
  VectorSearchRequest,
  TextSearchRequest,
  UpdateVectorRequest,
} from '../../types/vectors';
import { GravixLayerBadRequestError } from '../../types/exceptions';

export class Vectors {
  private baseUrl: string;

  constructor(
    private client: any,
    private indexId: string
  ) {
    this.baseUrl = `https://api.gravixlayer.com/v1/vectors/${indexId}`;
  }

  /**
   * Insert or update a vector
   */
  async upsert(
    embedding: number[],
    id?: string,
    metadata?: Record<string, any>,
    delete_protection: boolean = false
  ): Promise<Vector> {
    const vectorData: any = {
      embedding,
      metadata: metadata || {},
      delete_protection,
    };

    if (id !== undefined) {
      vectorData.id = id;
    }

    // API expects batch format even for single operations
    const data = {
      vectors: [vectorData],
    };

    const response = await this.client._makeRequest('POST', `${this.baseUrl}/upsert`, data);

    const result = await response.json();

    // Handle the actual API response format
    if (result.ids && result.ids.length > 0 && result.count > 0) {
      // The API returns ids and count, not upserted_count
      const vectorId = result.ids[0];

      // Wait a moment for the vector to be indexed
      await new Promise((resolve) => setTimeout(resolve, 100));

      try {
        return await this.get(vectorId);
      } catch (error) {
        // If we can't retrieve the vector immediately, return a minimal Vector
        return {
          id: vectorId,
          embedding,
          metadata: metadata || {},
          delete_protection,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Vector;
      }
    } else if (result.error) {
      throw new Error(`Vector upsert failed: ${result.error}`);
    } else {
      throw new Error('Unexpected response format from upsert API');
    }
  }

  /**
   * Convert text to vector and store it
   */
  async upsertText(
    text: string,
    model: string,
    id?: string,
    metadata?: Record<string, any>,
    delete_protection: boolean = false
  ): Promise<TextVector> {
    const vectorData: any = {
      text,
      model,
      metadata: metadata || {},
      delete_protection,
    };

    if (id !== undefined) {
      vectorData.id = id;
    }

    // API expects batch format even for single operations
    const data = {
      vectors: [vectorData],
    };

    const response = await this.client._makeRequest('POST', `${this.baseUrl}/text/upsert`, data);

    const result = await response.json();

    // Handle the actual API response format
    if (result.ids && result.ids.length > 0 && result.count > 0) {
      // The API returns ids and count, not upserted_count
      const vectorId = result.ids[0];

      // Wait a moment for the vector to be indexed
      await new Promise((resolve) => setTimeout(resolve, 100));

      try {
        const vector = await this.get(vectorId);
        return {
          id: vector.id,
          text,
          model,
          embedding: vector.embedding,
          metadata: vector.metadata,
          delete_protection: vector.delete_protection,
          created_at: vector.created_at,
          updated_at: vector.updated_at,
          usage: result.usage || { prompt_tokens: 0, total_tokens: 0 },
        } as TextVector;
      } catch (error) {
        // If we can't retrieve the vector immediately, return a minimal TextVector
        return {
          id: vectorId,
          text,
          model,
          embedding: [], // Will be filled when vector is retrieved later
          metadata: metadata || {},
          delete_protection,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          usage: result.usage || { prompt_tokens: 0, total_tokens: 0 },
        } as TextVector;
      }
    } else if (result.error) {
      throw new Error(`Text vector upsert failed: ${result.error}`);
    } else {
      throw new Error('Unexpected response format from upsert API');
    }
  }

  /**
   * Insert or update multiple vectors in a single operation
   */
  async batchUpsert(vectors: Record<string, any>[]): Promise<BatchUpsertResponse> {
    const data = { vectors };

    const response = await this.client._makeRequest('POST', `${this.baseUrl}/batch`, data);

    const result = await response.json();
    return result as BatchUpsertResponse;
  }

  /**
   * Convert multiple texts to vectors and store them
   */
  async batchUpsertText(vectors: Record<string, any>[]): Promise<BatchUpsertResponse> {
    const data = { vectors };

    const response = await this.client._makeRequest('POST', `${this.baseUrl}/text/batch`, data);

    const result = await response.json();
    return result as BatchUpsertResponse;
  }

  /**
   * Retrieve a specific vector by ID
   */
  async get(vectorId: string): Promise<Vector> {
    const response = await this.client._makeRequest('GET', `${this.baseUrl}/${vectorId}`);

    const result = await response.json();
    return result as Vector;
  }

  /**
   * Update vector metadata and delete protection settings
   */
  async update(vectorId: string, metadata?: Record<string, any>, delete_protection?: boolean): Promise<Vector> {
    const data: any = {};
    if (metadata !== undefined) {
      data.metadata = metadata;
    }
    if (delete_protection !== undefined) {
      data.delete_protection = delete_protection;
    }

    if (Object.keys(data).length === 0) {
      throw new Error('At least one field must be provided for update');
    }

    const response = await this.client._makeRequest('PUT', `${this.baseUrl}/${vectorId}`, data);

    const result = await response.json();

    // If the update response doesn't include all fields, fetch the complete vector
    if (!result.embedding) {
      return this.get(vectorId);
    }

    return result as Vector;
  }

  /**
   * Delete a specific vector using batch delete endpoint
   */
  async delete(vectorId: string): Promise<void> {
    await this.client._makeRequest('POST', `${this.baseUrl}/delete`, { vector_ids: [vectorId] });
  }

  /**
   * Delete multiple vectors in a single operation
   */
  async batchDelete(vectorIds: string[]): Promise<Record<string, any>> {
    if (!vectorIds || vectorIds.length === 0) {
      throw new Error('At least one vector ID must be provided');
    }

    const data = { vector_ids: vectorIds };

    const response = await this.client._makeRequest('POST', `${this.baseUrl}/delete`, data);

    return response.json();
  }

  /**
   * Retrieve a list of vector IDs in the index
   */
  async listIds(): Promise<VectorListResponse> {
    const response = await this.client._makeRequest('GET', `${this.baseUrl}/list`);

    const result = await response.json();
    return result as VectorListResponse;
  }

  /**
   * Retrieve vectors in the index with optional filtering
   */
  async list(vectorIds?: string[]): Promise<VectorDictResponse> {
    const params: any = {};
    if (vectorIds) {
      params.vector_ids = vectorIds.join(',');
    }

    const response = await this.client._makeRequest(
      'GET',
      `${this.baseUrl}/fetch`,
      Object.keys(params).length > 0 ? params : undefined
    );

    const result = await response.json();

    // Convert vector data to Vector objects
    // API now returns vectors as an array, not a dictionary
    const vectors: Record<string, Vector> = {};
    if (Array.isArray(result.vectors)) {
      // New API format: array of vectors
      for (const vectorData of result.vectors) {
        // Ensure all required fields are present with defaults
        vectorData.delete_protection = vectorData.delete_protection || false;
        vectorData.created_at = vectorData.created_at || '';
        vectorData.updated_at = vectorData.updated_at || '';
        vectors[vectorData.id] = vectorData as Vector;
      }
    } else {
      // Old API format: dictionary of vectors (fallback)
      for (const [vectorId, vectorData] of Object.entries(result.vectors)) {
        // Ensure all required fields are present with defaults
        (vectorData as any).delete_protection = (vectorData as any).delete_protection || false;
        (vectorData as any).created_at = (vectorData as any).created_at || '';
        (vectorData as any).updated_at = (vectorData as any).updated_at || '';
        vectors[vectorId] = vectorData as Vector;
      }
    }

    return { vectors } as VectorDictResponse;
  }

  /**
   * Perform similarity search using a vector query
   */
  async search(
    vector: number[],
    top_k: number,
    filter?: Record<string, any>,
    include_metadata: boolean = true,
    include_values: boolean = true
  ): Promise<VectorSearchResponse> {
    if (!(top_k >= 1 && top_k <= 1000)) {
      throw new Error('top_k must be between 1 and 1000');
    }

    const data: any = {
      vector,
      top_k,
      include_metadata,
      include_values,
    };

    if (filter !== undefined) {
      data.filter = filter;
    }

    const response = await this.client._makeRequest('POST', `${this.baseUrl}/search`, data);

    const result = await response.json();
    return {
      hits: result.hits,
      query_time_ms: result.query_time_ms,
    } as VectorSearchResponse;
  }

  /**
   * Perform similarity search using text that gets converted to a vector
   */
  async searchText(
    query: string,
    model: string,
    top_k: number,
    filter?: Record<string, any>,
    include_metadata: boolean = true,
    include_values: boolean = true
  ): Promise<TextSearchResponse> {
    if (!(top_k >= 1 && top_k <= 1000)) {
      throw new Error('top_k must be between 1 and 1000');
    }

    const data: any = {
      query,
      model,
      top_k,
      include_metadata,
      include_values,
    };

    if (filter !== undefined) {
      data.filter = filter;
    }

    const response = await this.client._makeRequest('POST', `${this.baseUrl}/search/text`, data);

    const result = await response.json();
    return {
      hits: result.hits,
      query_time_ms: result.query_time_ms,
      usage: result.usage,
    } as TextSearchResponse;
  }
}
