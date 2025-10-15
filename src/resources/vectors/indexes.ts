/**
 * Vector indexes resource for GravixLayer SDK
 */
import {
  VectorIndex,
  VectorIndexList,
  CreateIndexRequest,
  UpdateIndexRequest,
  SUPPORTED_METRICS,
  SUPPORTED_VECTOR_TYPES,
  SUPPORTED_INDEX_TYPES,
  SUPPORTED_CLOUD_PROVIDERS,
  SUPPORTED_REGIONS
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
      cloud_provider,
      region,
      index_type,
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

    if (cloud_provider && !SUPPORTED_CLOUD_PROVIDERS.includes(cloud_provider as any)) {
      throw new GravixLayerBadRequestError(
        `Unsupported cloud provider. Supported: ${SUPPORTED_CLOUD_PROVIDERS.join(', ')}`
      );
    }

    if (region && !SUPPORTED_REGIONS.includes(region as any)) {
      throw new GravixLayerBadRequestError(
        `Unsupported region. Supported: ${SUPPORTED_REGIONS.join(', ')}`
      );
    }

    if (index_type && !SUPPORTED_INDEX_TYPES.includes(index_type as any)) {
      throw new GravixLayerBadRequestError(
        `Unsupported index type. Supported: ${SUPPORTED_INDEX_TYPES.join(', ')}`
      );
    }

    const requestData = {
      name,
      dimension,
      metric,
      vector_type,
      cloud_provider,
      region,
      index_type,
      metadata,
      delete_protection
    };

    // Use vector database API endpoint
    const response = await this.client._makeRequest(
      'POST',
      'https://api.gravixlayer.com/v1/vectors/indexes',
      requestData
    );

    const result = await response.json();
    return result as VectorIndex;
  }

  /**
   * List all vector indexes
   */
  async list(): Promise<VectorIndexList> {
    const response = await this.client._makeRequest(
      'GET',
      'https://api.gravixlayer.com/v1/vectors/indexes'
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

    const response = await this.client._makeRequest(
      'GET',
      `https://api.gravixlayer.com/v1/vectors/indexes/${indexId}`
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

    const response = await this.client._makeRequest(
      'PUT',
      `https://api.gravixlayer.com/v1/vectors/indexes/${indexId}`,
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

    const response = await this.client._makeRequest(
      'DELETE',
      `https://api.gravixlayer.com/v1/vectors/indexes/${indexId}`
    );

    const result = await response.json();
    return result;
  }
}