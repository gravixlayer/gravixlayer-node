import { GravixLayer } from "../client";
import {
  DeploymentCreate,
  Deployment,
  DeploymentResponse,
} from "../types/deployments";
import { Accelerator } from "../types/accelerators";

export class Deployments {
  constructor(private client: GravixLayer) {}

  async create(params: DeploymentCreate): Promise<DeploymentResponse> {
    let deploymentName = params.deployment_name;

    if (params.auto_retry) {
      const timestamp = Math.floor(Date.now() / 1000)
        .toString()
        .slice(-4);
      const suffix = Math.random().toString(36).substring(2, 6);
      deploymentName = `${deploymentName}-${timestamp}${suffix}`;
    }

    const data = {
      deployment_name: deploymentName,
      hw_type: params.hw_type || "dedicated",
      gpu_model: params.gpu_model,
      gpu_count: params.gpu_count || 1,
      min_replicas: params.min_replicas || 1,
      max_replicas: params.max_replicas || 1,
      model_name: params.model_name,
    };

    // Use a different base URL for deployments API
    const originalBaseURL = (this.client as any).baseURL;
    (this.client as any).baseURL = originalBaseURL.replace(
      "/v1/inference",
      "/v1/deployments",
    );

    try {
      const response = await this.client._makeRequest("POST", "create", data);
      const result = await response.json();
      return result as DeploymentResponse;
    } finally {
      (this.client as any).baseURL = originalBaseURL;
    }
  }

  async list(): Promise<Deployment[]> {
    // Use a different base URL for deployments API
    const originalBaseURL = (this.client as any).baseURL;
    (this.client as any).baseURL = originalBaseURL.replace(
      "/v1/inference",
      "/v1/deployments",
    );

    try {
      const response = await this.client._makeRequest("GET", "list");
      const deploymentsData = await response.json();

      // Handle different response formats
      if (Array.isArray(deploymentsData)) {
        return deploymentsData as Deployment[];
      } else if (
        deploymentsData &&
        typeof deploymentsData === "object" &&
        deploymentsData.deployments
      ) {
        return deploymentsData.deployments as Deployment[];
      } else if (
        deploymentsData &&
        typeof deploymentsData === "object" &&
        Object.keys(deploymentsData).length === 0
      ) {
        // Empty object response means no deployments
        return [];
      } else {
        // If it's a different format, return empty array and log the issue
        console.warn(
          `Unexpected response format: ${typeof deploymentsData}, content:`,
          deploymentsData,
        );
        return [];
      }
    } finally {
      (this.client as any).baseURL = originalBaseURL;
    }
  }

  async get(deploymentId: string): Promise<Deployment> {
    const deployments = await this.list();
    const deployment = deployments.find(
      (d) =>
        d.deployment_id === deploymentId || d.deployment_name === deploymentId,
    );

    if (!deployment) {
      throw new Error(`Deployment with ID or Name '${deploymentId}' not found`);
    }
    return deployment;
  }

  async listHardware(): Promise<Accelerator[]> {
    return this.client.accelerators.list();
  }

  async delete(deploymentId: string): Promise<Record<string, any>> {
    // Use a different base URL for deployments API
    const originalBaseURL = (this.client as any).baseURL;
    (this.client as any).baseURL = originalBaseURL.replace(
      "/v1/inference",
      "/v1/deployments",
    );

    try {
      const response = await this.client._makeRequest(
        "DELETE",
        `delete/${deploymentId}`,
      );
      return await response.json();
    } finally {
      (this.client as any).baseURL = originalBaseURL;
    }
  }
}
