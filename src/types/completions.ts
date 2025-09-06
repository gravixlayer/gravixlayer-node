export interface CompletionChoice {
  text: string;
  index: number;
  logprobs?: Record<string, any> | null;
  finish_reason?: string | null;
}

export interface CompletionUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface Completion {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: CompletionChoice[];
  usage?: CompletionUsage;
}

export interface CompletionCreateParams {
  model: string;
  prompt: string | string[];
  max_tokens?: number | null;
  temperature?: number | null;
  top_p?: number | null;
  n?: number | null;
  stream?: boolean;
  logprobs?: number | null;
  echo?: boolean;
  stop?: string | string[] | null;
  presence_penalty?: number | null;
  frequency_penalty?: number | null;
  best_of?: number | null;
  logit_bias?: Record<string, number> | null;
  user?: string | null;
}