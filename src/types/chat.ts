export interface FunctionCall {
  name: string;
  arguments: string;
}

export interface ToolCall {
  id: string;
  type: string;
  function: FunctionCall;
}

export interface ChatCompletionMessage {
  role: string;
  content?: string | null;
  name?: string;
  function_call?: Record<string, any>;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ChatCompletionDelta {
  role?: string | null;
  content?: string | null;
  function_call?: Record<string, any>;
  tool_calls?: ToolCall[];
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatCompletionMessage;
  finish_reason?: string | null;
  delta?: ChatCompletionDelta;
}

export interface ChatCompletionUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatCompletion {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage?: ChatCompletionUsage;
}

export interface ChatCompletionCreateParams {
  model: string;
  messages: ChatCompletionMessage[];
  temperature?: number | null;
  max_tokens?: number | null;
  top_p?: number | null;
  frequency_penalty?: number | null;
  presence_penalty?: number | null;
  stop?: string | string[] | null;
  stream?: boolean;
  tools?: Record<string, any>[] | null;
  tool_choice?: string | Record<string, any> | null;
}
