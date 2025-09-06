export interface EmbeddingObject {
  object: string;
  embedding: number[];
  index: number;
}

export interface EmbeddingUsage {
  prompt_tokens: number;
  total_tokens: number;
}

export interface EmbeddingResponse {
  object: string;
  data: EmbeddingObject[];
  model: string;
  usage?: EmbeddingUsage;
}

export interface EmbeddingCreateParams {
  model: string;
  input: string | string[];
  encoding_format?: string;
  dimensions?: number | null;
  user?: string | null;
}