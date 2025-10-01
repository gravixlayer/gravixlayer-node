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
  UpdateVectorRequest
} from '../../types/vectors';
import { GravixLayerBadRequestError } from '../../types/exceptions';

export class Vectors {
  constructor(private client: any, private indexId: string) {}

  /**
   * Upsert a vector with embedding
   */
  async upsert(params: UpsertVectorRequest): Promise<Vector> {
    const {
      embedding,
      id,
      metadata,
      delete_protection = false
    } = params;

    if (!Array.isArray(embedding) || embedding.length === 0) {
      throw new GravixLayerBadRequestError('Embedding must be a non-empty array of numbers');
    }

    if (!embedding.every(val => typeof val === 'number')) {
      throw new GravixLayerBadRequestError('All embedding values must be numbers');
    }

    const requestData = {
      embedding,
      id,
      metadata,
      delete_protection
    };

    const vectorBaseURL = this.client.baseURL.replace('/v1/inference', '/v1/vector-db');
    
    const response = await this.client._makeRequest(
      'POST',
      `${vectorBaseURL}/indexes/${this.indexId}/vectors`,
      requestData
    );

    const result = await response.json();
    return result as Vector;
  }

  /**
   * Upsert a vector from text (automatic embedding)
   */
  async upsertText(params: UpsertTextVectorRequest): Promise<TextVector> {
    const {
      text,
      model,
      id,
      metadata,
      delete_protection = false
    } = params;

    if (!text || typeof text !== 'string') {
      throw new GravixLayerBadRequestError('Text must be a non-empty string');
    }

    if (!model || typeof model !== 'string') {
      throw new GravixLayerBadRequestError('Model must be specified');
    }

    const requestData = {
      text,
      model,
      id,
      metadata,
      delete_protection
    };

    const vectorBaseURL = this.client.baseURL.replace('/v1/inference', '/v1/vector-db');
    
    const response = await this.client._makeRequest(
      'POST',
      `${vectorBaseURL}/indexes/${this.indexId}/vectors/text`,
      requestData
    );

    const result = await response.json();
    return result as TextVector;
  }

  /**
   * Batch upsert vectors
   */
  async batchUpsert(params: BatchUpsertRequest): Promise<BatchUpsertResponse> {
    const { vectors } = params;

    if (!Array.isArray(vectors) || vectors.length === 0) {
      throw new GravixLayerBadRequestError('Vectors array must be non-empty');
    }

    // Validate each vector
    for (const vector of vectors) {
      if (!Array.isArray(vector.embedding) || vector.embedding.length === 0) {
        throw new GravixLayerBadRequestError('Each vector must have a non-empty embedding array');
      }
    }

    const vectorBaseURL = this.client.baseURL.replace('/v1/inference', '/v1/vector-db');
    
    const response = await this.client._makeRequest(
      'POST',
      `${vectorBaseURL}/indexes/${this.indexId}/vectors/batch`,
      params
    );

    const result = await response.json();
    return result as BatchUpsertResponse;
  }

  /**
   * Batch upsert text vectors
   */
  async batchUpsertText(params: BatchUpsertTextRequest): Promise<BatchUpsertResponse> {
    const { vectors } = params;

    if (!Array.isArray(vectors) || vectors.length === 0) {
      throw new GravixLayerBadRequestError('Vectors array must be non-empty');
    }

    // Validate each text vector
    for (const vector of vectors) {
      if (!vector.text || typeof vector.text !== 'string') {
        throw new GravixLayerBadRequestError('Each vector must have non-empty text');
      }
      if (!vector.model || typeof vector.model !== 'string') {
        throw new GravixLayerBadRequestError('Each vector must specify a model');
      }
    }

    const vectorBaseURL = this.client.baseURL.replace('/v1/inference', '/v1/vector-db');
    
    const response = await this.client._makeRequest(
      'POST',
      `${vectorBaseURL}/indexes/${this.indexId}/vectors/batch-text`,
      params
    );

    const result = await response.json();
    return result as BatchUpsertResponse;
  }

  /**
   * Search vectors by similarity
   */
  async search(params: VectorSearchRequest): Promise<VectorSearchResponse> {
    const {
      vector,
      top_k,
      filter,
      include_metadata = true,
      include_values = true
    } = params;

    if (!Array.isArray(vector) || vector.length === 0) {
      throw new GravixLayerBadRequestError('Query vector must be a non-empty array of numbers');
    }

    if (!Number.isInteger(top_k) || top_k <= 0) {
      throw new GravixLayerBadRequestError('top_k must be a positive integer');
    }

    const requestData = {
      vector,
      top_k,
      filter,
      include_metadata,
      include_values
    };

    const vectorBaseURL = this.client.baseURL.replace('/v1/inference', '/v1/vector-db');
    
    const response = await this.client._makeRequest(
      'POST',
      `${vectorBaseURL}/indexes/${this.indexId}/search`,
      requestData
    );

    const result = await response.json();
    return result as VectorSearchResponse;
  }

  /**
   * Search vectors using text query
   */
  async searchText(params: TextSearchRequest): Promise<TextSearchResponse> {
    const {
      query,
      model,
      top_k,
      filter,
      include_metadata = true,
      include_values = true
    } = params;

    if (!query || typeof query !== 'string') {
      throw new GravixLayerBadRequestError('Query must be a non-empty string');
    }

    if (!model || typeof model !== 'string') {
      throw new GravixLayerBadRequestError('Model must be specified');
    }

    if (!Number.isInteger(top_k) || top_k <= 0) {
      throw new GravixLayerBadRequestError('top_k must be a positive integer');
    }

    const requestData = {
      query,
      model,
      top_k,
      filter,
      include_metadata,
      include_values
    };

    const vectorBaseURL = this.client.baseURL.replace('/v1/inference', '/v1/vector-db');
    
    const response = await this.client._makeRequest(
      'POST',
      `${vectorBaseURL}/indexes/${this.indexId}/search/text`,
      requestData
    );

    const result = await response.json();
    return result as TextSearchResponse;
  }

  /**
   * List vectors in the index
   */
  async list(): Promise<VectorListResponse> {
    const vectorBaseURL = this.client.baseURL.replace('/v1/inference', '/v1/vector-db');
    
    const response = await this.client._makeRequest(
      'GET',
      `${vectorBaseURL}/indexes/${this.indexId}/vectors`
    );

    const result = await response.json();
    return result as VectorListResponse;
  }

  /**
   * Get vectors with full data
   */
  async getVectors(vectorIds: string[]): Promise<VectorDictResponse> {
    if (!Array.isArray(vectorIds) || vectorIds.length === 0) {
      throw new GravixLayerBadRequestError('Vector IDs array must be non-empty');
    }

    const vectorBaseURL = this.client.baseURL.replace('/v1/inference', '/v1/vector-db');
    
    const response = await this.client._makeRequest(
      'POST',
      `${vectorBaseURL}/indexes/${this.indexId}/vectors/get`,
      { ids: vectorIds }
    );

    const result = await response.json();
    return result as VectorDictResponse;
  }

  /**
   * Get a specific vector by ID
   */
  async get(vectorId: string): Promise<Vector> {
    if (!vectorId) {
      throw new GravixLayerBadRequestError('Vector ID is required');
    }

    const vectorBaseURL = this.client.baseURL.replace('/v1/inference', '/v1/vector-db');
    
    const response = await this.client._makeRequest(
      'GET',
      `${vectorBaseURL}/indexes/${this.indexId}/vectors/${vectorId}`
    );

    const result = await response.json();
    return result as Vector;
  }

  /**
   * Update a vector
   */
  async update(vectorId: string, params: UpdateVectorRequest): Promise<Vector> {
    if (!vectorId) {
      throw new GravixLayerBadRequestError('Vector ID is required');
    }

    const vectorBaseURL = this.client.baseURL.replace('/v1/inference', '/v1/vector-db');
    
    const response = await this.client._makeRequest(
      'PATCH',
      `${vectorBaseURL}/indexes/${this.indexId}/vectors/${vectorId}`,
      params
    );

    const result = await response.json();
    return result as Vector;
  }

  /**
   * Delete a vector
   */
  async delete(vectorId: string): Promise<{ message: string }> {
    if (!vectorId) {
      throw new GravixLayerBadRequestError('Vector ID is required');
    }

    const vectorBaseURL = this.client.baseURL.replace('/v1/inference', '/v1/vector-db');
    
    const response = await this.client._makeRequest(
      'DELETE',
      `${vectorBaseURL}/indexes/${this.indexId}/vectors/${vectorId}`
    );

    const result = await response.json();
    return result;
  }
}