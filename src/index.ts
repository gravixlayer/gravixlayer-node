/**
 * GravixLayer JavaScript SDK - Industry Standard Compatible
 */

import { GravixLayer } from './client';

export { GravixLayer, type GravixLayerOptions } from './client';
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