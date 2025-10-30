/**
 * Vector database types for GravixLayer SDK
 */

export interface VectorIndex {
  id: string;
  name: string;
  vector_type: string;
  delete_protection: boolean;
  dimension: number;
  metric: string;
  cloud_provider?: string;
  region?: string;
  index_type?: string;
  created_at: string;
  metadata?: Record<string, any>;
  updated_at?: string;
  status?: string;
}

export interface VectorIndexList {
  indexes: VectorIndex[];
  pagination: Record<string, any>;
}

export interface Vector {
  id: string;
  embedding: number[];
  metadata?: Record<string, any>;
  delete_protection?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TextVector {
  id: string;
  text: string;
  model: string;
  embedding: number[];
  metadata: Record<string, any>;
  delete_protection: boolean;
  created_at: string;
  updated_at: string;
  usage: Record<string, number>;
}

export interface VectorSearchHit {
  id: string;
  score: number;
  values?: number[];
  metadata?: Record<string, any>;
}

export interface VectorSearchResponse {
  hits: VectorSearchHit[];
  query_time_ms: number;
}

export interface TextSearchResponse {
  hits: VectorSearchHit[];
  query_time_ms: number;
  usage: Record<string, number>;
}

export interface BatchUpsertResponse {
  upserted_count: number;
  failed_count: number;
  errors: string[];
  usage?: Record<string, number>;
}

export interface VectorListResponse {
  vectors: Record<string, string>[];
}

export interface VectorDictResponse {
  vectors: Record<string, Vector>;
}

// Request types
export interface CreateIndexRequest {
  name: string;
  dimension: number;
  metric: string;
  vector_type?: string;
  cloud_provider?: string;
  region?: string;
  index_type?: string;
  metadata?: Record<string, any>;
  delete_protection?: boolean;
}

export interface UpdateIndexRequest {
  metadata?: Record<string, any>;
  delete_protection?: boolean;
}

export interface UpsertVectorRequest {
  embedding: number[];
  id?: string;
  metadata?: Record<string, any>;
  delete_protection?: boolean;
}

export interface UpsertTextVectorRequest {
  text: string;
  model: string;
  id?: string;
  metadata?: Record<string, any>;
  delete_protection?: boolean;
}

export interface BatchUpsertRequest {
  vectors: UpsertVectorRequest[];
}

export interface BatchUpsertTextRequest {
  vectors: UpsertTextVectorRequest[];
}

export interface VectorSearchRequest {
  vector: number[];
  top_k: number;
  filter?: Record<string, any>;
  include_metadata?: boolean;
  include_values?: boolean;
}

export interface TextSearchRequest {
  query: string;
  model: string;
  top_k: number;
  filter?: Record<string, any>;
  include_metadata?: boolean;
  include_values?: boolean;
}

export interface UpdateVectorRequest {
  metadata?: Record<string, any>;
  delete_protection?: boolean;
}

// Supported metrics and vector types
export const SUPPORTED_METRICS = ['cosine', 'euclidean', 'dot_product'] as const;
export const SUPPORTED_VECTOR_TYPES = ['dense'] as const;
export const SUPPORTED_INDEX_TYPES = ['serverless', 'dedicated'] as const;
export const SUPPORTED_CLOUD_PROVIDERS = ['AWS', 'GCP', 'Azure', 'Gravix'] as const;
export const SUPPORTED_REGIONS = [
  'us-east-1',
  'us-west-2',
  'eu-west-1',
  'us-central1',
  'eastus',
  'gl-eu-west1',
] as const;

export type SupportedMetric = (typeof SUPPORTED_METRICS)[number];
export type SupportedVectorType = (typeof SUPPORTED_VECTOR_TYPES)[number];
export type SupportedIndexType = (typeof SUPPORTED_INDEX_TYPES)[number];
export type SupportedCloudProvider = (typeof SUPPORTED_CLOUD_PROVIDERS)[number];
export type SupportedRegion = (typeof SUPPORTED_REGIONS)[number];
