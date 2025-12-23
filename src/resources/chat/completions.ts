import { GravixLayer } from "../../client";
import {
  ChatCompletion,
  ChatCompletionCreateParams,
  ChatCompletionChoice,
  ChatCompletionMessage,
  ChatCompletionUsage,
  ChatCompletionDelta,
  FunctionCall,
  ToolCall,
} from "../../types/chat";

export class ChatCompletions {
  constructor(private client: GravixLayer) {}

  async create(params: ChatCompletionCreateParams): Promise<ChatCompletion>;
  async create(
    params: ChatCompletionCreateParams & { stream: true },
  ): Promise<AsyncIterable<ChatCompletion>>;
  async create(
    params: ChatCompletionCreateParams,
  ): Promise<ChatCompletion | AsyncIterable<ChatCompletion>> {
    // Convert message objects to plain objects if needed
    const serializedMessages = params.messages.map((msg) => {
      if (typeof msg === "object" && msg !== null) {
        const msgDict: any = {
          role: msg.role,
          content: msg.content,
        };

        if (msg.name) msgDict.name = msg.name;
        if (msg.tool_call_id) msgDict.tool_call_id = msg.tool_call_id;
        if (msg.tool_calls) {
          msgDict.tool_calls = msg.tool_calls.map((toolCall) => ({
            id: toolCall.id,
            type: toolCall.type,
            function: {
              name: toolCall.function.name,
              arguments: toolCall.function.arguments,
            },
          }));
        }

        return msgDict;
      }
      return msg;
    });

    const data: any = {
      ...params,
      model: params.model,
      messages: serializedMessages,
      stream: params.stream || false,
    };

    return params.stream
      ? this._createStream(data)
      : this._createNonStream(data);
  }

  private async _createNonStream(data: any): Promise<ChatCompletion> {
    const response = await this.client._makeRequest(
      "POST",
      "chat/completions",
      data,
    );
    const responseData = await response.json();
    return this._parseResponse(responseData);
  }

  private async *_createStream(data: any): AsyncIterable<ChatCompletion> {
    const response = await this.client._makeRequest(
      "POST",
      "chat/completions",
      data,
      true,
    );

    if (!response.body) {
      throw new Error("No response body for streaming");
    }

    // node-fetch v3 returns a ReadableStream, but we need to handle it differently
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      // For node-fetch, response.body is a ReadableStream
      const reader = response.body as any;

      // Use async iteration if available
      if (reader[Symbol.asyncIterator]) {
        for await (const chunk of reader) {
          buffer += decoder.decode(chunk, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (let line of lines) {
            line = line.trim();

            // Handle SSE format
            if (line.startsWith("data: ")) {
              line = line.slice(6);
            }

            // Skip empty lines and [DONE] marker
            if (!line || line === "[DONE]") {
              continue;
            }

            try {
              const chunkData = JSON.parse(line);

              if (chunkData && typeof chunkData === "object") {
                const parsedChunk = this._parseResponse(chunkData, true);

                if (parsedChunk.choices && parsedChunk.choices.length > 0) {
                  yield parsedChunk;
                }
              }
            } catch (error) {
              // Skip malformed JSON
              continue;
            }
          }
        }
      } else {
        // Fallback: try to get reader
        const streamReader = reader.getReader ? reader.getReader() : null;
        if (streamReader) {
          while (true) {
            const { done, value } = await streamReader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (let line of lines) {
              line = line.trim();

              // Handle SSE format
              if (line.startsWith("data: ")) {
                line = line.slice(6);
              }

              // Skip empty lines and [DONE] marker
              if (!line || line === "[DONE]") {
                continue;
              }

              try {
                const chunkData = JSON.parse(line);

                if (chunkData && typeof chunkData === "object") {
                  const parsedChunk = this._parseResponse(chunkData, true);

                  if (parsedChunk.choices && parsedChunk.choices.length > 0) {
                    yield parsedChunk;
                  }
                }
              } catch (error) {
                // Skip malformed JSON
                continue;
              }
            }
          }
          streamReader.releaseLock();
        } else {
          throw new Error(
            "Streaming not supported with this fetch implementation",
          );
        }
      }
    } catch (error) {
      throw new Error(
        `Streaming error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private _parseResponse(
    respData: any,
    isStream: boolean = false,
  ): ChatCompletion {
    if (!respData || typeof respData !== "object") {
      throw new Error("Invalid response data");
    }

    const choices: ChatCompletionChoice[] = [];

    if (respData.choices && Array.isArray(respData.choices)) {
      for (const choiceData of respData.choices) {
        if (!choiceData || typeof choiceData !== "object") {
          continue;
        }

        if (isStream) {
          // For streaming, create delta object
          let deltaContent: string | null = null;
          let deltaRole: string | null = null;
          let deltaToolCalls: ToolCall[] | null = null;

          if (choiceData.delta && typeof choiceData.delta === "object") {
            const delta = choiceData.delta;
            deltaContent = delta.content || null;
            deltaRole = delta.role || null;

            // Parse tool calls in delta
            if (delta.tool_calls && Array.isArray(delta.tool_calls)) {
              deltaToolCalls = [];
              for (const toolCallData of delta.tool_calls) {
                if (toolCallData && typeof toolCallData === "object") {
                  const functionData = toolCallData.function || {};
                  const functionCall: FunctionCall = {
                    name: functionData.name || "",
                    arguments: functionData.arguments || "{}",
                  };
                  const toolCall: ToolCall = {
                    id: toolCallData.id || "",
                    type: toolCallData.type || "function",
                    function: functionCall,
                  };
                  deltaToolCalls.push(toolCall);
                }
              }
            }
          } else if (
            choiceData.message &&
            typeof choiceData.message === "object"
          ) {
            // Fallback: treat message as delta
            const message = choiceData.message;
            deltaContent = message.content || null;
            deltaRole = message.role || null;
          }

          // Create delta object
          const deltaObj: ChatCompletionDelta = {
            role: deltaRole,
            content: deltaContent,
            tool_calls: deltaToolCalls || undefined,
          };

          const msg: ChatCompletionMessage = {
            role: deltaRole || "assistant",
            content: deltaContent || "",
            tool_calls: deltaToolCalls || undefined,
          };

          choices.push({
            index: choiceData.index || 0,
            message: msg,
            delta: deltaObj,
            finish_reason: choiceData.finish_reason || null,
          });
        } else {
          // For non-streaming, use message object
          const messageData = choiceData.message || {};

          // Parse tool calls if present
          let toolCalls: ToolCall[] | undefined;
          if (messageData.tool_calls && Array.isArray(messageData.tool_calls)) {
            toolCalls = [];
            for (const toolCallData of messageData.tool_calls) {
              if (toolCallData && typeof toolCallData === "object") {
                const functionData = toolCallData.function || {};
                const functionCall: FunctionCall = {
                  name: functionData.name || "",
                  arguments: functionData.arguments || "{}",
                };
                const toolCall: ToolCall = {
                  id: toolCallData.id || "",
                  type: toolCallData.type || "function",
                  function: functionCall,
                };
                toolCalls.push(toolCall);
              }
            }
          }

          const msg: ChatCompletionMessage = {
            role: messageData.role || "assistant",
            content: messageData.content || null,
            tool_calls: toolCalls,
            tool_call_id: messageData.tool_call_id,
          };

          choices.push({
            index: choiceData.index || 0,
            message: msg,
            finish_reason: choiceData.finish_reason || null,
          });
        }
      }
    }

    // Fallback: create a single choice if no choices found
    if (choices.length === 0) {
      let content = "";
      if (typeof respData === "string") {
        content = respData;
      } else if (respData.content) {
        content = respData.content;
      }

      if (isStream) {
        const deltaObj: ChatCompletionDelta = { content };
        const msg: ChatCompletionMessage = { role: "assistant", content };
        choices.push({
          index: 0,
          message: msg,
          delta: deltaObj,
          finish_reason: null,
        });
      } else {
        const msg: ChatCompletionMessage = { role: "assistant", content };
        choices.push({
          index: 0,
          message: msg,
          finish_reason: "stop",
        });
      }
    }

    // Parse usage if available
    let usage: ChatCompletionUsage | undefined;
    if (respData.usage && typeof respData.usage === "object") {
      usage = {
        prompt_tokens: respData.usage.prompt_tokens || 0,
        completion_tokens: respData.usage.completion_tokens || 0,
        total_tokens: respData.usage.total_tokens || 0,
      };
    }

    return {
      id: respData.id || `chatcmpl-${Date.now()}`,
      object: isStream ? "chat.completion.chunk" : "chat.completion",
      created: respData.created || Math.floor(Date.now() / 1000),
      model: respData.model || "unknown",
      choices,
      usage,
    };
  }
}

export class ChatResource {
  public completions: ChatCompletions;

  constructor(client: GravixLayer) {
    this.completions = new ChatCompletions(client);
  }
}
