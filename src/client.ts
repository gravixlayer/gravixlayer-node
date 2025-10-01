import fetch from 'node-fetch';
import { 
  GravixLayerError, 
  GravixLayerAuthenticationError, 
  GravixLayerRateLimitError, 
  GravixLayerServerError, 
  GravixLayerBadRequestError, 
  GravixLayerConnectionError 
} from './types/exceptions';
import { ChatResource } from './resources/chat/completions';
import { Embeddings } from './resources/embeddings';
import { Completions } from './resources/completions';
import { Deployments } from './resources/deployments';
import { Accelerators } from './resources/accelerators';
import { Files } from './resources/files';
import { VectorDatabase } from './resources/vectors/main';

export interface GravixLayerOptions {
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
  headers?: Record<string, string>;
  userAgent?: string;
  // Industry standard compatibility parameters
  organization?: string;
  project?: string;
}

export class GravixLayer {
  private apiKey: string;
  private baseURL: string;
  private timeout: number;
  private maxRetries: number;
  private customHeaders: Record<string, string>;
  private userAgent: string;
  private organization?: string;
  private project?: string;

  public chat: ChatResource;
  public embeddings: Embeddings;
  public completions: Completions;
  public deployments: Deployments;
  public accelerators: Accelerators;
  public files: Files;
  public vectors: VectorDatabase;

  constructor(options: GravixLayerOptions = {}) {
    this.apiKey = options.apiKey || process.env.GRAVIXLAYER_API_KEY || '';
    this.baseURL = options.baseURL || process.env.GRAVIXLAYER_BASE_URL || 'https://api.gravixlayer.com/v1/inference';
    
    // Store compatibility parameters
    this.organization = options.organization;
    this.project = options.project;

    // Validate URL scheme - support both HTTP and HTTPS
    if (!this.baseURL.startsWith('http://') && !this.baseURL.startsWith('https://')) {
      throw new Error('Base URL must use HTTP or HTTPS protocol');
    }

    this.timeout = options.timeout || 60000; // 60 seconds in milliseconds
    this.maxRetries = options.maxRetries || 3;
    this.customHeaders = options.headers || {};
    this.userAgent = options.userAgent || 'gravixlayer-js/0.0.1';

    if (!this.apiKey) {
      throw new Error('API key must be provided via options or GRAVIXLAYER_API_KEY environment variable');
    }

    // Initialize resources
    this.chat = new ChatResource(this);
    this.embeddings = new Embeddings(this);
    this.completions = new Completions(this);
    this.deployments = new Deployments(this);
    this.accelerators = new Accelerators(this);
    this.files = new Files(this);
    this.vectors = new VectorDatabase(this);
  }

  async _makeRequest(
    method: string,
    endpoint: string,
    data?: any,
    stream: boolean = false,
    options: any = {}
  ): Promise<any> {
    const url = endpoint ? `${this.baseURL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}` : this.baseURL;
    
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': this.userAgent,
      ...this.customHeaders,
      ...options.headers,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method,
          headers: headers as any,
          body: data ? JSON.stringify(data) : undefined,
          signal: controller.signal,
          ...options,
        } as any);

        clearTimeout(timeoutId);

        if (response.ok) {
          return response;
        }

        if (response.status === 401) {
          throw new GravixLayerAuthenticationError('Authentication failed.');
        }

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          console.warn(`Rate limit exceeded. Retrying in ${retryAfter || Math.pow(2, attempt)}s...`);
          
          if (attempt < this.maxRetries) {
            await this._sleep(retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000);
            continue;
          }
          throw new GravixLayerRateLimitError(await response.text());
        }

        if ([502, 503, 504].includes(response.status) && attempt < this.maxRetries) {
          console.warn(`Server error: ${response.status}. Retrying...`);
          await this._sleep(Math.pow(2, attempt) * 1000);
          continue;
        }

        if (response.status >= 400 && response.status < 500) {
          throw new GravixLayerBadRequestError(await response.text());
        }

        if (response.status >= 500 && response.status < 600) {
          throw new GravixLayerServerError(await response.text());
        }

        throw new GravixLayerError(`HTTP ${response.status}: ${response.statusText}`);

      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error instanceof GravixLayerError) {
          throw error;
        }

        if (attempt === this.maxRetries) {
          throw new GravixLayerConnectionError(error instanceof Error ? error.message : String(error));
        }

        console.warn('Transient connection error, retrying...');
        await this._sleep(Math.pow(2, attempt) * 1000);
      }
    }

    throw new GravixLayerError('Failed to complete request.');
  }

  private _sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}