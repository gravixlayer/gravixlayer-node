export interface DeploymentCreate {
  deployment_name: string;
  model_name: string;
  gpu_model: string;
  gpu_count?: number;
  min_replicas?: number;
  max_replicas?: number;
  hw_type?: string;
}

export interface Deployment {
  deployment_id: string;
  user_email: string;
  model_name: string;
  deployment_name: string;
  status: string;
  created_at: string;
  gpu_model: string;
  gpu_count: number;
  min_replicas: number;
  max_replicas?: number;
  hw_type: string;
}

export interface DeploymentList {
  deployments: Deployment[];
}

export interface DeploymentResponse {
  deployment_id: string;
  message: string;
  status: string;
}
