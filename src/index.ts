
import { GravixLayer } from './client';

export { GravixLayer, type GravixLayerOptions } from './client';
export { Memory } from './resources/memory/memory';
export { AsyncGravixLayer, type AsyncGravixLayerOptions } from './async-client';

// Chat types
export type {
  ChatCompletion,
  ChatCompletionMessage,
  ChatCompletionChoice,
  ChatCompletionUsage,
  ChatCompletionDelta,
  ChatCompletionCreateParams,
  FunctionCall,
  ToolCall,
} from './types/chat';

// Embeddings types
export type {
  EmbeddingResponse,
  EmbeddingObject,
  EmbeddingUsage,
  EmbeddingCreateParams,
} from './types/embeddings';

// Completions types
export type {
  Completion,
  CompletionChoice,
  CompletionUsage,
  CompletionCreateParams,
} from './types/completions';

// Deployments types
export type {
  Deployment,
  DeploymentCreate,
  DeploymentResponse,
} from './types/deployments';

// Accelerators types
export type {
  Accelerator,
} from './types/accelerators';

// Files types
export type {
  FileObject,
  FileUploadResponse,
  FileListResponse,
  FileDeleteResponse,
  FileCreateParams,
  FilePurpose,
} from './types/files';

// Vector types
export type {
  VectorIndex,
  VectorIndexList,
  Vector,
  TextVector,
  VectorSearchHit,
  VectorSearchResponse,
  TextSearchResponse,
  BatchUpsertResponse,
  VectorListResponse,
  VectorDictResponse,
  CreateIndexRequest,
  UpdateIndexRequest,
  UpsertVectorRequest,
  UpsertTextVectorRequest,
  BatchUpsertRequest,
  BatchUpsertTextRequest,
  VectorSearchRequest,
  TextSearchRequest,
  UpdateVectorRequest,
  SupportedMetric,
  SupportedVectorType,
  SupportedIndexType,
} from './types/vectors';

// Memory types
export type {
  MemoryType,
  MemoryEntry,
  MemorySearchResult,
  MemoryStats,
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
} from './types/memory';

// Exception types
export {
  GravixLayerError,
  GravixLayerAuthenticationError,
  GravixLayerRateLimitError,
  GravixLayerServerError,
  GravixLayerBadRequestError,
  GravixLayerConnectionError,
} from './types/exceptions';

// Default export for convenience
export default GravixLayer;