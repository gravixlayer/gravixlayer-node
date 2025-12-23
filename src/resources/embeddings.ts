import { GravixLayer } from "../client";
import {
  EmbeddingResponse,
  EmbeddingCreateParams,
  EmbeddingObject,
  EmbeddingUsage,
} from "../types/embeddings";

/**
 * Embeddings resource for creating text embeddings.
 *
 * Converts text into high-dimensional vectors for semantic search
 * and similarity comparisons.
 */
export class Embeddings {
  constructor(private client: GravixLayer) {}

  async create(params: EmbeddingCreateParams): Promise<EmbeddingResponse> {
    const data: any = {
      ...params,
      model: params.model,
      input: params.input,
    };

    if (!data.encoding_format) {
      data.encoding_format = "float";
    }

    const response = await this.client._makeRequest("POST", "embeddings", data);
    const responseData = await response.json();

    return this._parseResponse(responseData);
  }

  private _parseResponse(respData: any): EmbeddingResponse {
    const embeddings: EmbeddingObject[] = [];

    if (respData.data && Array.isArray(respData.data)) {
      for (let i = 0; i < respData.data.length; i++) {
        const item = respData.data[i];
        const embedding: EmbeddingObject = {
          object: item.object || "embedding",
          embedding: item.embedding || [],
          index: item.index !== undefined ? item.index : i,
        };
        embeddings.push(embedding);
      }
    }

    let usage: EmbeddingUsage | undefined;
    if (respData.usage && typeof respData.usage === "object") {
      usage = {
        prompt_tokens: respData.usage.prompt_tokens || 0,
        total_tokens: respData.usage.total_tokens || 0,
      };
    }

    return {
      object: respData.object || "list",
      data: embeddings,
      model: respData.model || "",
      usage,
    };
  }
}
