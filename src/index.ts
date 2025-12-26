import { GravixLayer } from "./client";

// Main entry point for the SDK
export { GravixLayer, type GravixLayerOptions } from "./client";
// Memory resources
export { Memory } from "./resources/memory/memory";
export { SyncMemory } from "./resources/memory/sync-memory";
export { AsyncGravixLayer, type AsyncGravixLayerOptions } from "./async-client";

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
} from "./types/chat";

// Embeddings types
export type {
  EmbeddingResponse,
  EmbeddingObject,
  EmbeddingUsage,
  EmbeddingCreateParams,
} from "./types/embeddings";

// Completions types
export type {
  Completion,
  CompletionChoice,
  CompletionUsage,
  CompletionCreateParams,
} from "./types/completions";

// Deployments types
export type {
  Deployment,
  DeploymentCreate,
  DeploymentResponse,
} from "./types/deployments";

// Accelerators types
export type { Accelerator } from "./types/accelerators";

// Files types
export type { FileObject, FileCreateParams, FilePurpose } from "./types/files";

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
} from "./types/vectors";

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
} from "./types/memory";

// Sandbox types
export type {
  Sandbox as SandboxType,
  SandboxCreate,
  SandboxList,
  SandboxMetrics,
  SandboxTimeoutResponse,
  SandboxHostURL,
  FileReadResponse,
  FileWriteResponse,
  FileInfo,
  FileListResponse,
  FileDeleteResponse,
  DirectoryCreateResponse,
  FileUploadResponse,
  CommandRunResponse,
  CodeRunResponse,
  CodeContext,
  CodeContextDeleteResponse,
  Template,
  TemplateList,
  SandboxKillResponse,
  Execution,
} from "./types/sandbox";

// Sandbox classes
export { Sandbox, SandboxResource } from "./resources/sandbox";

// Exception types
export {
  GravixLayerError,
  GravixLayerAuthenticationError,
  GravixLayerRateLimitError,
  GravixLayerServerError,
  GravixLayerBadRequestError,
  GravixLayerConnectionError,
} from "./types/exceptions";

// Default export for convenience
export default GravixLayer;
