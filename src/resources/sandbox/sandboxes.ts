/**
 * Sandboxes resource for synchronous client
 */
import FormData from "form-data";
import { GravixLayer } from "../../client";
import {
  Sandbox,
  SandboxList,
  SandboxMetrics,
  SandboxTimeoutResponse,
  SandboxHostURL,
  FileReadResponse,
  FileWriteResponse,
  FileListResponse,
  FileDeleteResponse,
  DirectoryCreateResponse,
  FileUploadResponse,
  CommandRunResponse,
  CodeRunResponse,
  CodeContext,
  CodeContextDeleteResponse,
  SandboxKillResponse,
  FileInfo,
} from "../../types/sandbox";

export class Sandboxes {
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

  // Sandbox Lifecycle Methods

  async create(options: {
    provider: string;
    region: string;
    template?: string;
    timeout?: number;
    env_vars?: Record<string, string>;
    metadata?: Record<string, any>;
  }): Promise<Sandbox> {
    const data = {
      provider: options.provider,
      region: options.region,
      template: options.template || "python-base-v1",
      timeout: options.timeout || 300,
      ...(options.env_vars && { env_vars: options.env_vars }),
      ...(options.metadata && { metadata: options.metadata }),
    };

    const result = await this.makeAgentsRequest("POST", "sandboxes", data);

    // Ensure all fields have defaults if missing
    const defaults = {
      metadata: {},
      template: options.template || "python-base-v1",
      template_id: null,
      started_at: null,
      timeout_at: null,
      cpu_count: null,
      memory_mb: null,
      ended_at: null,
    };

    for (const [key, defaultValue] of Object.entries(defaults)) {
      if (!(key in result) || result[key] === null) {
        result[key] = defaultValue;
      }
    }

    return result as Sandbox;
  }

  async list(options?: {
    limit?: number;
    offset?: number;
  }): Promise<SandboxList> {
    const params = new URLSearchParams();
    if (options?.limit !== undefined)
      params.append("limit", options.limit.toString());
    if (options?.offset !== undefined)
      params.append("offset", options.offset.toString());

    const endpoint = params.toString()
      ? `sandboxes?${params.toString()}`
      : "sandboxes";
    const result = await this.makeAgentsRequest("GET", endpoint);

    // Fix missing fields for each sandbox
    const defaults = {
      metadata: {},
      template: null,
      template_id: null,
      started_at: null,
      timeout_at: null,
      cpu_count: null,
      memory_mb: null,
      ended_at: null,
    };

    const sandboxes = result.sandboxes.map((sandboxData: any) => {
      for (const [key, defaultValue] of Object.entries(defaults)) {
        if (!(key in sandboxData) || sandboxData[key] === null) {
          sandboxData[key] = defaultValue;
        }
      }
      return sandboxData as Sandbox;
    });

    return {
      sandboxes,
      total: result.total,
    };
  }

  async get(sandboxId: string): Promise<Sandbox> {
    const result = await this.makeAgentsRequest(
      "GET",
      `sandboxes/${sandboxId}`,
    );

    // Ensure all fields have defaults if missing
    const defaults = {
      metadata: {},
      template: null,
      template_id: null,
      started_at: null,
      timeout_at: null,
      cpu_count: null,
      memory_mb: null,
      ended_at: null,
    };

    for (const [key, defaultValue] of Object.entries(defaults)) {
      if (!(key in result) || result[key] === null) {
        result[key] = defaultValue;
      }
    }

    return result as Sandbox;
  }

  async kill(sandboxId: string): Promise<SandboxKillResponse> {
    const result = await this.makeAgentsRequest(
      "DELETE",
      `sandboxes/${sandboxId}`,
    );
    return result as SandboxKillResponse;
  }

  // Sandbox Configuration Methods

  async setTimeout(
    sandboxId: string,
    timeout: number,
  ): Promise<SandboxTimeoutResponse> {
    const data = { timeout };
    const result = await this.makeAgentsRequest(
      "POST",
      `sandboxes/${sandboxId}/timeout`,
      data,
    );
    return result as SandboxTimeoutResponse;
  }

  async getMetrics(sandboxId: string): Promise<SandboxMetrics> {
    const result = await this.makeAgentsRequest(
      "GET",
      `sandboxes/${sandboxId}/metrics`,
    );
    return result as SandboxMetrics;
  }

  async getHostUrl(sandboxId: string, port: number): Promise<SandboxHostURL> {
    const result = await this.makeAgentsRequest(
      "GET",
      `sandboxes/${sandboxId}/host/${port}`,
    );
    return result as SandboxHostURL;
  }

  // File Operations Methods

  async readFile(sandboxId: string, path: string): Promise<FileReadResponse> {
    const data = { path };
    const result = await this.makeAgentsRequest(
      "POST",
      `sandboxes/${sandboxId}/files/read`,
      data,
    );
    return result as FileReadResponse;
  }

  async writeFile(
    sandboxId: string,
    path: string,
    content: string,
  ): Promise<FileWriteResponse> {
    const data = { path, content };
    const result = await this.makeAgentsRequest(
      "POST",
      `sandboxes/${sandboxId}/files/write`,
      data,
    );
    return result as FileWriteResponse;
  }

  async listFiles(sandboxId: string, path: string): Promise<FileListResponse> {
    const data = { path };
    const result = await this.makeAgentsRequest(
      "POST",
      `sandboxes/${sandboxId}/files/list`,
      data,
    );

    // Filter and map file info fields
    const files: FileInfo[] = result.files.map((fileInfo: any) => ({
      name: fileInfo.name || "",
      path: fileInfo.path || "",
      size: fileInfo.size || 0,
      is_dir: fileInfo.is_dir || false,
      modified_at: fileInfo.modified_at || fileInfo.mod_time || "",
      mode: fileInfo.mode,
    }));

    return { files };
  }

  async deleteFile(
    sandboxId: string,
    path: string,
  ): Promise<FileDeleteResponse> {
    const data = { path };
    const result = await this.makeAgentsRequest(
      "POST",
      `sandboxes/${sandboxId}/files/delete`,
      data,
    );
    return result as FileDeleteResponse;
  }

  async makeDirectory(
    sandboxId: string,
    path: string,
  ): Promise<DirectoryCreateResponse> {
    const data = { path };
    const result = await this.makeAgentsRequest(
      "POST",
      `sandboxes/${sandboxId}/files/mkdir`,
      data,
    );
    return result as DirectoryCreateResponse;
  }

  async uploadFile(
    sandboxId: string,
    file: File | Buffer,
    path?: string,
  ): Promise<FileUploadResponse> {
    const formData = new FormData();

    if (file instanceof Buffer) {
      formData.append("file", file, "uploaded_file");
    } else {
      formData.append("file", file);
    }

    if (path) {
      formData.append("path", path);
    }

    const originalBaseUrl = this.client["baseURL"];
    this.client["baseURL"] = this.getAgentsBaseUrl();

    try {
      const response = await this.client["_makeRequest"](
        "POST",
        `sandboxes/${sandboxId}/upload`,
        formData,
        false,
        {
          headers: formData.getHeaders(),
        },
      );
      return (await response.json()) as FileUploadResponse;
    } finally {
      this.client["baseURL"] = originalBaseUrl;
    }
  }

  async downloadFile(sandboxId: string, path: string): Promise<Buffer> {
    const endpoint = `sandboxes/${sandboxId}/download?path=${encodeURIComponent(path)}`;

    const originalBaseUrl = this.client["baseURL"];
    this.client["baseURL"] = this.getAgentsBaseUrl();

    try {
      const response = await this.client["_makeRequest"]("GET", endpoint);
      return Buffer.from(await response.arrayBuffer());
    } finally {
      this.client["baseURL"] = originalBaseUrl;
    }
  }

  // Command Execution Methods

  async runCommand(
    sandboxId: string,
    command: string,
    options?: {
      args?: string[];
      working_dir?: string;
      environment?: Record<string, string>;
      timeout?: number;
    },
  ): Promise<CommandRunResponse> {
    const data: any = { command };
    if (options?.args) data.args = options.args;
    if (options?.working_dir) data.working_dir = options.working_dir;
    if (options?.environment) data.environment = options.environment;
    if (options?.timeout) data.timeout = options.timeout;

    const result = await this.makeAgentsRequest(
      "POST",
      `sandboxes/${sandboxId}/commands/run`,
      data,
    );
    return result as CommandRunResponse;
  }

  // Code Execution Methods

  async runCode(
    sandboxId: string,
    code: string,
    options?: {
      language?: string;
      context_id?: string;
      environment?: Record<string, string>;
      timeout?: number;
      on_stdout?: boolean;
      on_stderr?: boolean;
      on_result?: boolean;
      on_error?: boolean;
    },
  ): Promise<CodeRunResponse> {
    const data: any = { code };
    if (options?.language) data.language = options.language;
    if (options?.context_id) data.context_id = options.context_id;
    if (options?.environment) data.environment = options.environment;
    if (options?.timeout) data.timeout = options.timeout;
    if (options?.on_stdout) data.on_stdout = options.on_stdout;
    if (options?.on_stderr) data.on_stderr = options.on_stderr;
    if (options?.on_result) data.on_result = options.on_result;
    if (options?.on_error) data.on_error = options.on_error;

    const result = await this.makeAgentsRequest(
      "POST",
      `sandboxes/${sandboxId}/code/run`,
      data,
    );

    // Ensure all required fields have defaults
    if (!result.execution_id) result.execution_id = null;
    if (!result.results) result.results = {};
    if (!result.error) result.error = null;
    if (!result.logs) result.logs = { stdout: [], stderr: [] };

    return result as CodeRunResponse;
  }

  async createCodeContext(
    sandboxId: string,
    options?: {
      language?: string;
      cwd?: string;
    },
  ): Promise<CodeContext> {
    const data: any = {};
    if (options?.language) data.language = options.language;
    if (options?.cwd) data.cwd = options.cwd;

    const result = await this.makeAgentsRequest(
      "POST",
      `sandboxes/${sandboxId}/code/contexts`,
      data,
    );

    // Map API response to our interface
    return {
      context_id: result.id || result.context_id || "",
      language: result.language || options?.language || "python",
      cwd: result.cwd || options?.cwd || "/home/user",
      created_at: result.created_at,
      expires_at: result.expires_at,
      status: result.status,
      last_used: result.last_used,
    };
  }

  async getCodeContext(
    sandboxId: string,
    contextId: string,
  ): Promise<CodeContext> {
    const result = await this.makeAgentsRequest(
      "GET",
      `sandboxes/${sandboxId}/code/contexts/${contextId}`,
    );

    // Map API response to our interface
    return {
      context_id: result.id || result.context_id || "",
      language: result.language || "python",
      cwd: result.cwd || "/home/user",
      created_at: result.created_at,
      expires_at: result.expires_at,
      status: result.status,
      last_used: result.last_used,
    };
  }

  async deleteCodeContext(
    sandboxId: string,
    contextId: string,
  ): Promise<CodeContextDeleteResponse> {
    const result = await this.makeAgentsRequest(
      "DELETE",
      `sandboxes/${sandboxId}/code/contexts/${contextId}`,
    );
    return result as CodeContextDeleteResponse;
  }
}
