import { GravixLayer } from '../client';
import { Completion, CompletionCreateParams, CompletionChoice, CompletionUsage } from '../types/completions';

export class Completions {
  constructor(private client: GravixLayer) {}

  async create(params: CompletionCreateParams): Promise<Completion>;
  async create(params: CompletionCreateParams & { stream: true }): Promise<AsyncIterable<Completion>>;
  async create(params: CompletionCreateParams): Promise<Completion | AsyncIterable<Completion>> {
    const data: any = {
      model: params.model,
      prompt: params.prompt,
      stream: params.stream || false
    };

    if (params.max_tokens !== undefined) data.max_tokens = params.max_tokens;
    if (params.temperature !== undefined) data.temperature = params.temperature;
    if (params.top_p !== undefined) data.top_p = params.top_p;
    if (params.n !== undefined) data.n = params.n;
    if (params.logprobs !== undefined) data.logprobs = params.logprobs;
    if (params.echo !== undefined) data.echo = params.echo;
    if (params.stop !== undefined) data.stop = params.stop;
    if (params.presence_penalty !== undefined) data.presence_penalty = params.presence_penalty;
    if (params.frequency_penalty !== undefined) data.frequency_penalty = params.frequency_penalty;
    if (params.best_of !== undefined) data.best_of = params.best_of;
    if (params.logit_bias !== undefined) data.logit_bias = params.logit_bias;
    if (params.user !== undefined) data.user = params.user;

    return params.stream ? this._createStream(data) : this._createNonStream(data);
  }

  private async _createNonStream(data: any): Promise<Completion> {
    const response = await this.client._makeRequest('POST', 'completions', data);
    const responseData = await response.json();
    return this._parseResponse(responseData);
  }

  private async *_createStream(data: any): AsyncIterable<Completion> {
    const response = await this.client._makeRequest('POST', 'completions', data, true);
    
    if (!response.body) {
      throw new Error('No response body for streaming');
    }

    // node-fetch v3 returns a ReadableStream, but we need to handle it differently
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      // For node-fetch, response.body is a ReadableStream
      const reader = response.body as any;
      
      // Use async iteration if available
      if (reader[Symbol.asyncIterator]) {
        for await (const chunk of reader) {
          buffer += decoder.decode(chunk, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (let line of lines) {
            line = line.trim();
            
            // Handle SSE format
            if (line.startsWith('data: ')) {
              line = line.slice(6);
            }
            
            // Skip empty lines and [DONE] marker
            if (!line || line === '[DONE]') {
              continue;
            }
            
            try {
              const chunkData = JSON.parse(line);
              const parsedChunk = this._parseResponse(chunkData, true);
              
              if (parsedChunk.choices && parsedChunk.choices.length > 0) {
                yield parsedChunk;
              }
            } catch (error) {
              // Skip malformed JSON
              continue;
            }
          }
        }
      } else {
        // Fallback to getReader() method
        const streamReader = reader.getReader();
        try {
          while (true) {
            const { done, value } = await streamReader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (let line of lines) {
              line = line.trim();
              
              // Handle SSE format
              if (line.startsWith('data: ')) {
                line = line.slice(6);
              }
              
              // Skip empty lines and [DONE] marker
              if (!line || line === '[DONE]') {
                continue;
              }
              
              try {
                const chunkData = JSON.parse(line);
                const parsedChunk = this._parseResponse(chunkData, true);
                
                if (parsedChunk.choices && parsedChunk.choices.length > 0) {
                  yield parsedChunk;
                }
              } catch (error) {
                // Skip malformed JSON
                continue;
              }
            }
          }
        } finally {
          streamReader.releaseLock();
        }
      }
    } catch (error) {
      throw new Error(`Streaming error: ${error}`);
    }
  }

  private _parseResponse(respData: any, isStream: boolean = false): Completion {
    const choices: CompletionChoice[] = [];

    if (respData.choices && Array.isArray(respData.choices)) {
      for (const choiceData of respData.choices) {
        let text = '';

        if (isStream) {
          // For streaming, get text from delta or text field
          if (choiceData.delta) {
            text = choiceData.delta.content || choiceData.delta.text || '';
          } else if (choiceData.text !== undefined) {
            text = choiceData.text;
          }
        } else {
          // For non-streaming, get text directly
          text = choiceData.text || '';
        }

        const choice: CompletionChoice = {
          text,
          index: choiceData.index || 0,
          logprobs: choiceData.logprobs || null,
          finish_reason: choiceData.finish_reason || null
        };
        choices.push(choice);
      }
    }

    // Fallback: create a single choice if no choices found
    if (choices.length === 0) {
      let text = '';
      if (typeof respData === 'string') {
        text = respData;
      } else if (respData.text) {
        text = respData.text;
      } else if (respData.content) {
        text = respData.content;
      }

      choices.push({
        text,
        index: 0,
        finish_reason: isStream ? null : 'stop'
      });
    }

    // Parse usage if available
    let usage: CompletionUsage | undefined;
    if (respData.usage && typeof respData.usage === 'object') {
      usage = {
        prompt_tokens: respData.usage.prompt_tokens || 0,
        completion_tokens: respData.usage.completion_tokens || 0,
        total_tokens: respData.usage.total_tokens || 0
      };
    }

    return {
      id: respData.id || `cmpl-${Date.now()}`,
      object: isStream ? 'text_completion.chunk' : 'text_completion',
      created: respData.created || Math.floor(Date.now() / 1000),
      model: respData.model || 'unknown',
      choices,
      usage
    };
  }
}