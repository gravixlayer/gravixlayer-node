/**
 * File management types for GravixLayer SDK
 */

export interface FileObject {
  id: string;
  object: string;
  bytes: number;
  created_at: number;
  filename: string;
  purpose: string;
  expires_after?: number;
}

export interface FileUploadResponse {
  message: string;
  file_name: string;
  purpose: string;
}

export interface FileListResponse {
  data: FileObject[];
}

export interface FileDeleteResponse {
  message: string;
  file_id: string;
  file_name: string;
}

export interface FileCreateParams {
  file: File | Buffer | NodeJS.ReadableStream | string;
  purpose: FilePurpose;
  expires_after?: number;
  filename?: string;
}

export type FilePurpose = 'assistants' | 'batch' | 'batch_output' | 'fine-tune' | 'vision' | 'user_data' | 'evals';

export const FILE_PURPOSES: FilePurpose[] = [
  'assistants',
  'batch',
  'batch_output',
  'fine-tune',
  'vision',
  'user_data',
  'evals',
];
