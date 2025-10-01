/**
 * Vector indexes resource for GravixLayer SDK
 */
import {
  VectorIndex,
  VectorIndexList,
  CreateIndexRequest,
  UpdateIndexRequest,
  SUPPORTED_METRICS,
  SUPPORTED_VECTOR_TYPES
} from '../../types/vectors';
import { GravixLayerBadRequestError } from '../../types/exceptions';

export class VectorIndexes {
  constructor(private client: any) {}

  /**
   * Create a new vector index
   */
  async create(params: CreateIndexRequest): Promise<VectorIndex> {
    const {
      name,
      dimension,
      metric,
      vector_type = 'dense',
      metadata,
      delete_protection = false
    } = params;

    // Validate parameters
    if (!name || typeof name !== 'string') {
      throw new GravixLayerBadRequestError('Index name is required and must be a string');
    }

    if (!Number.isInteger(dimension) || dimension <= 0) {
      throw new GravixLayerBadRequestError('Dimension must be a positive integer');
    }

    if (!SUPPORTED_METRICS.includes(metric as any)) {
      throw new GravixLayerBadRequestError(
        `Unsupported metric. Supported: ${SUPPORTED_METRICS.join(', ')}`
      );
    }

    if (!SUPPORTED_VECTOR_TYPES.includes(vector_type as any)) {
      throw new GravixLayerBadRequestError(
        `Unsupported vector type. Supported: ${SUPPORTED_VECTOR_TYPES.join(', ')}`
      );
    }

    const requestData = {
      name,
      dimension,
      metric,
      vector_type,
      metadata,
      delete_protection
    };

    // Use vector database API endpoint
    const vectorBaseURL = this.client.baseURL.replace('/v1/inference', '/v1/vector-db');
    
    const response = await this.client._makeRequest(
      'POST',
      `${vectorBaseURL}/indexes`,
      requestData
    );

    const result = await response.json();
    return result as VectorIndex;
  }

  /**
   * List all vector indexes
   */
  async list(): Promise<VectorIndexList> {
    const vectorBaseURL = this.client.baseURL.replace('/v1/inference', '/v1/vector-db');
    
    const response = await this.client._makeRequest(
      'GET',
      `${vectorBaseURL}/indexes`
    );

    const result = await response.json();
    return result as VectorIndexList;
  }

  /**
   * Get a specific vector index by ID
   */
  async get(indexId: string): Promise<VectorIndex> {
    if (!indexId) {
      throw new GravixLayerBadRequestError('Index ID is required');
    }

    const vectorBaseURL = this.client.baseURL.replace('/v1/inference', '/v1/vector-db');
    
    const response = await this.client._makeRequest(
      'GET',
      `${vectorBaseURL}/indexes/${indexId}`
    );

    const result = await response.json();
    return result as VectorIndex;
  }

  /**
   * Update a vector index
   */
  async update(indexId: string, params: UpdateIndexRequest): Promise<VectorIndex> {
    if (!indexId) {
      throw new GravixLayerBadRequestError('Index ID is required');
    }

    const vectorBaseURL = this.client.baseURL.replace('/v1/inference', '/v1/vector-db');
    
    const response = await this.client._makeRequest(
      'PATCH',
      `${vectorBaseURL}/indexes/${indexId}`,
      params
    );

    const result = await response.json();
    return result as VectorIndex;
  }

  /**
   * Delete a vector index
   */
  async delete(indexId: string): Promise<{ message: string }> {
    if (!indexId) {
      throw new GravixLayerBadRequestError('Index ID is required');
    }

    const vectorBaseURL = this.client.baseURL.replace('/v1/inference', '/v1/vector-db');
    
    const response = await this.client._makeRequest(
      'DELETE',
      `${vectorBaseURL}/indexes/${indexId}`
    );

    const result = await response.json();
    return result;
  }
}