/**
 * Sandbox Templates resource for synchronous client
 */
import { GravixLayer } from "../../client";
import { Template, TemplateList } from "../../types/sandbox";

export class SandboxTemplates {
  private client: GravixLayer;
  private _agentsBaseUrl?: string;

  constructor(client: GravixLayer) {
    this.client = client;
  }

  private getAgentsBaseUrl(): string {
    if (!this._agentsBaseUrl) {
      // Replace /v1/inference with /v1/agents for agent endpoints
      this._agentsBaseUrl = this.client["baseURL"].replace(
        "/v1/inference",
        "/v1/agents",
      );
    }
    return this._agentsBaseUrl;
  }

  private async makeAgentsRequest(
    method: string,
    endpoint: string,
    data?: any,
    options?: any,
  ): Promise<any> {
    const originalBaseUrl = this.client["baseURL"];
    this.client["baseURL"] = this.getAgentsBaseUrl();

    try {
      const response = await this.client["_makeRequest"](
        method,
        endpoint,
        data,
        false,
        options,
      );
      return await response.json();
    } finally {
      this.client["baseURL"] = originalBaseUrl;
    }
  }

  async list(options?: {
    limit?: number;
    offset?: number;
  }): Promise<TemplateList> {
    const params = new URLSearchParams();
    if (options?.limit !== undefined)
      params.append("limit", options.limit.toString());
    if (options?.offset !== undefined)
      params.append("offset", options.offset.toString());

    const endpoint = params.toString()
      ? `templates?${params.toString()}`
      : "templates";
    const result = await this.makeAgentsRequest("GET", endpoint);

    const templates: Template[] = result.templates.map(
      (template: any) => template as Template,
    );

    return {
      templates,
      limit: result.limit,
      offset: result.offset,
    };
  }
}
