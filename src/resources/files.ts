import FormData from 'form-data';
import { createReadStream, statSync } from 'fs';
import {
  FileObject,
  FileUploadResponse,
  FileListResponse,
  FileDeleteResponse,
  FileCreateParams,
  FILE_PURPOSES,
} from '../types/files';
import { GravixLayerBadRequestError, GravixLayerAuthenticationError } from '../types/exceptions';

export class Files {
  constructor(private client: any) {}

  /**
   * Upload a file for use with AI models.
   */
  async create(params: FileCreateParams): Promise<FileUploadResponse> {
    const { file, purpose, expires_after, filename } = params;

    // Validate required parameters
    if (!file) {
      throw new GravixLayerBadRequestError('file is required');
    }

    if (!purpose) {
      throw new GravixLayerBadRequestError('purpose is required');
    }

    // Validate purpose
    if (!FILE_PURPOSES.includes(purpose)) {
      throw new GravixLayerBadRequestError(`Invalid purpose. Supported: ${FILE_PURPOSES.join(', ')}`);
    }

    // Prepare form data
    const formData = new FormData();
    formData.append('purpose', purpose);

    if (expires_after !== undefined) {
      if (!Number.isInteger(expires_after) || expires_after <= 0) {
        throw new GravixLayerBadRequestError('expires_after must be a positive integer (seconds)');
      }
      formData.append('expires_after', expires_after.toString());
    }

    // Handle file input
    if (typeof file === 'string') {
      // File path
      try {
        const stats = statSync(file);
        if (stats.size === 0) {
          throw new GravixLayerBadRequestError('File size must be between 1 byte and 200MB');
        }
        if (stats.size > 200 * 1024 * 1024) {
          // 200MB
          throw new GravixLayerBadRequestError('File size must be between 1 byte and 200MB');
        }

        const uploadFilename = filename || file.split('/').pop() || 'uploaded_file';
        formData.append('file', createReadStream(file), uploadFilename);
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          throw new GravixLayerBadRequestError(`File not found: ${file}`);
        }
        throw error;
      }
    } else if (file instanceof Buffer) {
      const uploadFilename = filename || 'uploaded_file';
      formData.append('file', file, uploadFilename);
    } else {
      // File object or stream
      const uploadFilename = filename || (file as any).name || 'uploaded_file';
      formData.append('file', file as any, uploadFilename);
    }

    // Use files API endpoint
    const originalBaseURL = this.client.baseURL;
    this.client.baseURL = this.client.baseURL.replace('/v1/inference', '/v1/files');

    try {
      const response = await this.client._makeRequest('POST', '', formData, false);

      const result = (await response.json()) as any;
      return {
        message: result.message || 'file uploaded',
        file_name: result.file_name || result.filename || '',
        purpose: result.purpose || purpose,
      };
    } finally {
      this.client.baseURL = originalBaseURL;
    }
  }

  /**
   * Upload a file for use with AI models (alias for create).
   */
  async upload(params: FileCreateParams): Promise<FileUploadResponse> {
    return this.create(params);
  }

  /**
   * List all files belonging to the user.
   */
  async list(): Promise<FileListResponse> {
    const originalBaseURL = this.client.baseURL;
    this.client.baseURL = this.client.baseURL.replace('/v1/inference', '/v1/files');

    try {
      const response = await this.client._makeRequest('GET', '');
      const result = await response.json();

      const filesData = result.data || [];
      const files: FileObject[] = filesData.map((fileData: any) => ({
        id: fileData.id || '',
        object: fileData.object || 'file',
        bytes: fileData.bytes || 0,
        created_at: fileData.created_at || 0,
        filename: fileData.filename || '',
        purpose: fileData.purpose || '',
        expires_after: fileData.expires_after,
      }));

      return { data: files };
    } finally {
      this.client.baseURL = originalBaseURL;
    }
  }

  /**
   * Retrieve metadata for a specific file by its ID.
   */
  async retrieve(fileId: string): Promise<FileObject> {
    if (!fileId) {
      throw new GravixLayerBadRequestError('file ID required');
    }

    const originalBaseURL = this.client.baseURL;
    this.client.baseURL = this.client.baseURL.replace('/v1/inference', '/v1/files');

    try {
      const response = await this.client._makeRequest('GET', fileId);
      const result = await response.json();

      return {
        id: result.id || '',
        object: result.object || 'file',
        bytes: result.bytes || 0,
        created_at: result.created_at || 0,
        filename: result.filename || '',
        purpose: result.purpose || '',
        expires_after: result.expires_after,
      };
    } finally {
      this.client.baseURL = originalBaseURL;
    }
  }

  /**
   * Download the actual file content.
   */
  async content(fileId: string): Promise<Buffer> {
    if (!fileId) {
      throw new GravixLayerBadRequestError('file ID required');
    }

    const originalBaseURL = this.client.baseURL;
    this.client.baseURL = this.client.baseURL.replace('/v1/inference', '/v1/files');

    try {
      const response = await this.client._makeRequest('GET', `${fileId}/content`);

      if (!response.ok) {
        let errorMessage = 'Failed to download file content';

        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        } catch (parseError) {
          // If we can't parse the error, use the status
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }

        if (response.status === 404) {
          throw new GravixLayerBadRequestError('file not found');
        } else if (response.status === 500) {
          throw new GravixLayerBadRequestError('storage error');
        } else {
          throw new GravixLayerBadRequestError(errorMessage);
        }
      }

      return Buffer.from(await response.arrayBuffer());
    } finally {
      this.client.baseURL = originalBaseURL;
    }
  }

  /**
   * Delete a file permanently. This action cannot be undone.
   */
  async delete(fileId: string): Promise<FileDeleteResponse> {
    if (!fileId) {
      throw new GravixLayerBadRequestError('File ID is required');
    }

    const originalBaseURL = this.client.baseURL;
    this.client.baseURL = this.client.baseURL.replace('/v1/inference', '/v1/files');

    try {
      const response = await this.client._makeRequest('DELETE', fileId);
      const result = await response.json();

      return {
        message: result.message || '',
        file_id: result.file_id || '',
        file_name: result.file_name || '',
      };
    } finally {
      this.client.baseURL = originalBaseURL;
    }
  }
}
