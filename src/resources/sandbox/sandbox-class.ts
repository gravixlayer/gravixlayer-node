/**
 * Sandbox class with simplified interface for easy usage
 */
import { GravixLayer } from '../../client';
import { Execution } from '../../types/sandbox';
import type { 
  Sandbox as SandboxType, 
  CodeRunResponse, 
  CommandRunResponse 
} from '../../types/sandbox';

export class Sandbox implements SandboxType {
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

  private _client?: GravixLayer;
  private _alive: boolean = true;
  private _timeoutSeconds?: number;

  constructor(data: SandboxType) {
    this.sandbox_id = data.sandbox_id;
    this.status = data.status;
    this.template = data.template;
    this.template_id = data.template_id;
    this.started_at = data.started_at;
    this.timeout_at = data.timeout_at;
    this.cpu_count = data.cpu_count;
    this.memory_mb = data.memory_mb;
    this.metadata = data.metadata;
    this.ended_at = data.ended_at;
  }

  /**
   * Get the timeout value in seconds
   */
  get timeout(): number | undefined {
    return this._timeoutSeconds;
  }

  /**
   * Create a new sandbox instance with simplified interface
   */
  static async create(options?: {
    template?: string;
    provider?: string;
    region?: string;
    timeout?: number;
    metadata?: Record<string, any>;
    apiKey?: string;
    baseURL?: string;
  }): Promise<Sandbox> {
    const client = new GravixLayer({
      apiKey: options?.apiKey,
      baseURL: options?.baseURL
    });

    const sandboxResponse = await client.sandbox.sandboxes.create({
      provider: options?.provider || 'gravix',
      region: options?.region || 'eu-west-1',
      template: options?.template || 'python-base-v1',
      timeout: options?.timeout || 300,
      metadata: options?.metadata || {}
    });

    const instance = new Sandbox(sandboxResponse);
    instance._client = client;
    instance._timeoutSeconds = options?.timeout || 300;  // Store the original timeout value
    return instance;
  }

  /**
   * Execute code in the sandbox
   */
  async runCode(code: string, language: string = 'python'): Promise<Execution> {
    if (!this._alive) {
      throw new Error('Sandbox has been terminated');
    }

    if (!this._client) {
      throw new Error('Client not initialized. Use Sandbox.create() to create a new instance.');
    }

    const response = await this._client.sandbox.sandboxes.runCode(
      this.sandbox_id,
      code,
      { language }
    );

    return new Execution(response);
  }

  /**
   * Execute a shell command in the sandbox
   */
  async runCommand(
    command: string,
    args?: string[],
    options?: {
      working_dir?: string;
      timeout?: number;
    }
  ): Promise<Execution> {
    if (!this._alive) {
      throw new Error('Sandbox has been terminated');
    }

    if (!this._client) {
      throw new Error('Client not initialized. Use Sandbox.create() to create a new instance.');
    }

    const response = await this._client.sandbox.sandboxes.runCommand(
      this.sandbox_id,
      command,
      {
        args: args || [],
        working_dir: options?.working_dir,
        timeout: options?.timeout
      }
    );

    return new Execution(response);
  }

  /**
   * Write content to a file in the sandbox
   */
  async writeFile(path: string, content: string): Promise<void> {
    if (!this._alive) {
      throw new Error('Sandbox has been terminated');
    }

    if (!this._client) {
      throw new Error('Client not initialized. Use Sandbox.create() to create a new instance.');
    }

    await this._client.sandbox.sandboxes.writeFile(
      this.sandbox_id,
      path,
      content
    );
  }

  /**
   * Read content from a file in the sandbox
   */
  async readFile(path: string): Promise<string> {
    if (!this._alive) {
      throw new Error('Sandbox has been terminated');
    }

    if (!this._client) {
      throw new Error('Client not initialized. Use Sandbox.create() to create a new instance.');
    }

    const response = await this._client.sandbox.sandboxes.readFile(
      this.sandbox_id,
      path
    );
    return response.content;
  }

  /**
   * List files in a directory
   */
  async listFiles(path: string = '/home/user'): Promise<string[]> {
    if (!this._alive) {
      throw new Error('Sandbox has been terminated');
    }

    if (!this._client) {
      throw new Error('Client not initialized. Use Sandbox.create() to create a new instance.');
    }

    const response = await this._client.sandbox.sandboxes.listFiles(
      this.sandbox_id,
      path
    );
    return response.files.map(f => f.name);
  }

  /**
   * Delete a file in the sandbox
   */
  async deleteFile(path: string): Promise<void> {
    if (!this._alive) {
      throw new Error('Sandbox has been terminated');
    }

    if (!this._client) {
      throw new Error('Client not initialized. Use Sandbox.create() to create a new instance.');
    }

    await this._client.sandbox.sandboxes.deleteFile(
      this.sandbox_id,
      path
    );
  }

  /**
   * Upload a local file to the sandbox
   */
  async uploadFile(file: File | Buffer, remotePath: string): Promise<void> {
    if (!this._alive) {
      throw new Error('Sandbox has been terminated');
    }

    if (!this._client) {
      throw new Error('Client not initialized. Use Sandbox.create() to create a new instance.');
    }

    await this._client.sandbox.sandboxes.uploadFile(
      this.sandbox_id,
      file,
      remotePath
    );
  }

  /**
   * Terminate the sandbox and clean up resources
   */
  async kill(): Promise<void> {
    if (this._alive && this._client) {
      try {
        await this._client.sandbox.sandboxes.kill(this.sandbox_id);
      } catch (error) {
        // Ignore errors during cleanup
      }
      this._alive = false;
    }
  }

  /**
   * Check if the sandbox is still running
   */
  async isAlive(): Promise<boolean> {
    if (!this._alive || !this._client) {
      return false;
    }

    try {
      const info = await this._client.sandbox.sandboxes.get(this.sandbox_id);
      return info.status === 'running';
    } catch {
      this._alive = false;
      return false;
    }
  }

  /**
   * Display sandbox information
   */
  showInfo(): void {
    console.log(`Created sandbox: ${this.sandbox_id}`);
    console.log(`Template: ${this.template}`);
    console.log(`Status: ${this.status}`);
    const cpuDisplay = this.cpu_count ? `${this.cpu_count} CPU` : 'Unknown CPU';
    const memoryDisplay = this.memory_mb ? `${this.memory_mb}MB RAM` : 'Unknown RAM';
    console.log(`Resources: ${cpuDisplay}, ${memoryDisplay}`);
    console.log(`Started: ${this.started_at}`);
    console.log(`Timeout: ${this.timeout_at}`);
  }
}