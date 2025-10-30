/**
 * Type definitions for Sandbox API
 */

export interface SandboxCreate {
  provider: string;
  region: string;
  template?: string;
  timeout?: number;
  env_vars?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface Sandbox {
  sandbox_id: string;
  status: string;
  template?: string;
  template_id?: string;
  started_at?: string;
  timeout_at?: string;
  cpu_count?: number;
  memory_mb?: number;
  metadata?: Record<string, any>;
  ended_at?: string;
}

export interface SandboxList {
  sandboxes: Sandbox[];
  total: number;
}

export interface SandboxMetrics {
  timestamp: string;
  cpu_usage: number;
  memory_usage: number;
  memory_total: number;
  disk_read: number;
  disk_write: number;
  network_rx: number;
  network_tx: number;
}

export interface SandboxTimeoutResponse {
  message: string;
  timeout?: number;
  timeout_at?: string;
}

export interface SandboxHostURL {
  url: string;
}

export interface FileReadResponse {
  content: string;
  path?: string;
  size?: number;
}

export interface FileWriteResponse {
  message: string;
  path?: string;
  bytes_written?: number;
}

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  is_dir: boolean;
  modified_at: string;
  mode?: string;
}

export interface FileListResponse {
  files: FileInfo[];
}

export interface FileDeleteResponse {
  message: string;
  path?: string;
}

export interface DirectoryCreateResponse {
  message: string;
  path?: string;
}

export interface FileUploadResponse {
  message: string;
  path?: string;
  size?: number;
}

export interface CommandRunResponse {
  stdout: string;
  stderr: string;
  exit_code: number;
  duration_ms: number;
  success: boolean;
  error?: string;
}

export interface CodeRunResponse {
  execution_id?: string;
  results?: Record<string, any>;
  error?: Record<string, any>;
  logs?: Record<string, string[]>;
}

export interface CodeContext {
  context_id: string;
  language: string;
  cwd: string;
  created_at: string;
  expires_at: string;
  status?: string;
  last_used?: string;
}

export interface CodeContextDeleteResponse {
  message: string;
  context_id?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  vcpu_count: number;
  memory_mb: number;
  disk_size_mb: number;
  visibility: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateList {
  templates: Template[];
  limit: number;
  offset: number;
}

export interface SandboxKillResponse {
  message: string;
  sandbox_id?: string;
}

/**
 * Execution result wrapper for code and command execution
 */
export class Execution {
  private _response: CodeRunResponse | CommandRunResponse;

  constructor(response: CodeRunResponse | CommandRunResponse) {
    this._response = response;
  }

  get logs(): Record<string, string[]> {
    if ('logs' in this._response && this._response.logs) {
      return this._response.logs;
    }

    // Fallback for command responses
    const logs: Record<string, string[]> = { stdout: [], stderr: [] };
    if ('stdout' in this._response && this._response.stdout) {
      logs.stdout = this._response.stdout.split('\n');
    }
    if ('stderr' in this._response && this._response.stderr) {
      logs.stderr = this._response.stderr.split('\n');
    }
    return logs;
  }

  get stdout(): string {
    if ('stdout' in this._response) {
      return this._response.stdout || '';
    }
    if ('logs' in this._response && this._response.logs) {
      return this._response.logs.stdout?.join('\n') || '';
    }
    return '';
  }

  get stderr(): string {
    if ('stderr' in this._response) {
      return this._response.stderr || '';
    }
    if ('logs' in this._response && this._response.logs) {
      return this._response.logs.stderr?.join('\n') || '';
    }
    return '';
  }

  get exit_code(): number {
    return 'exit_code' in this._response ? this._response.exit_code : 0;
  }

  get success(): boolean {
    return 'success' in this._response ? this._response.success : this.exit_code === 0;
  }

  get error(): any {
    return 'error' in this._response ? this._response.error : null;
  }
}
