import { GravixLayer } from '../client';
import { DeploymentCreate, Deployment, DeploymentResponse } from '../types/deployments';

export class Deployments {
  constructor(private client: GravixLayer) {}

  async create(params: DeploymentCreate): Promise<DeploymentResponse> {
    const data = {
      deployment_name: params.deployment_name,
      hw_type: params.hw_type || 'dedicated',
      hardware: params.hardware,
      min_replicas: params.min_replicas || 1,
      model_name: params.model_name
    };

    // Use a different base URL for deployments API
    const originalBaseURL = (this.client as any).baseURL;
    (this.client as any).baseURL = originalBaseURL.replace('/v1/inference', '/v1/deployments');

    try {
      const response = await this.client._makeRequest('POST', 'create', data);
      const result = await response.json();
      return result as DeploymentResponse;
    } finally {
      (this.client as any).baseURL = originalBaseURL;
    }
  }

  async list(): Promise<Deployment[]> {
    // Use a different base URL for deployments API
    const originalBaseURL = (this.client as any).baseURL;
    (this.client as any).baseURL = originalBaseURL.replace('/v1/inference', '/v1/deployments');

    try {
      const response = await this.client._makeRequest('GET', 'list');
      const deploymentsData = await response.json();

      // Handle different response formats
      if (Array.isArray(deploymentsData)) {
        return deploymentsData as Deployment[];
      } else if (deploymentsData && typeof deploymentsData === 'object' && deploymentsData.deployments) {
        return deploymentsData.deployments as Deployment[];
      } else if (deploymentsData && typeof deploymentsData === 'object' && Object.keys(deploymentsData).length === 0) {
        // Empty object response means no deployments
        return [];
      } else {
        // If it's a different format, return empty array and log the issue
        console.warn(`Unexpected response format: ${typeof deploymentsData}, content:`, deploymentsData);
        return [];
      }
    } finally {
      (this.client as any).baseURL = originalBaseURL;
    }
  }

  async delete(deploymentId: string): Promise<Record<string, any>> {
    // Use a different base URL for deployments API
    const originalBaseURL = (this.client as any).baseURL;
    (this.client as any).baseURL = originalBaseURL.replace('/v1/inference', '/v1/deployments');

    try {
      const response = await this.client._makeRequest('DELETE', `delete/${deploymentId}`);
      return await response.json();
    } finally {
      (this.client as any).baseURL = originalBaseURL;
    }
  }
}