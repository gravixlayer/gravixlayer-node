/**
 * Memory types and interfaces for GravixLayer SDK
 * Provides intelligent memory management API types
 */

export enum MemoryType {
  FACTUAL = "factual", // Long-term structured knowledge (preferences, attributes)
  EPISODIC = "episodic", // Specific past conversations or events
  WORKING = "working", // Short-term context for current session
  SEMANTIC = "semantic", // Generalized knowledge from patterns
}

export interface MemoryEntry {
  id: string;
  content: string;
  memory_type: MemoryType;
  user_id: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  importance_score?: number;
  access_count?: number;
}

export interface MemorySearchResult {
  memory: MemoryEntry;
  relevance_score: number;
}

export interface MemoryStats {
  total_memories: number;
  factual_count: number;
  episodic_count: number;
  working_count: number;
  semantic_count: number;
  last_updated: string;
}

export interface MemoryAddParams {
  messages: string | Array<{ role: string; content: string }>;
  user_id: string;
  metadata?: Record<string, any>;
  infer?: boolean;
}

export interface MemorySearchParams {
  query: string;
  user_id: string;
  limit?: number;
  threshold?: number;
}

export interface MemoryGetParams {
  memory_id: string;
  user_id: string;
  indexName?: string;
}

export interface MemoryGetAllParams {
  user_id: string;
  limit?: number;
  indexName?: string;
}

export interface MemoryUpdateParams {
  memory_id: string;
  user_id: string;
  data: string;
  indexName?: string;
}

export interface MemoryDeleteParams {
  memory_id: string;
  user_id: string;
  indexName?: string;
}

export interface MemoryDeleteAllParams {
  user_id: string;
}

export interface MemoryResponse {
  results: Array<{
    id: string;
    memory: string;
    event: string;
  }>;
}

export interface MemorySearchResponse {
  results: MemorySearchResult[];
}

export interface MemoryGetAllResponse {
  results: MemoryEntry[];
}

export interface MemoryOperationResponse {
  message: string;
}
