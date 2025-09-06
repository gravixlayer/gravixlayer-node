export interface DeploymentCreate {
  deployment_name: string;
  hw_type?: string;
  hardware: string;
  min_replicas?: number;
  model_name: string;
}

export interface Deployment {
  deployment_id: string;
  user_email: string;
  model_name: string;
  deployment_name: string;
  status: string;
  created_at: string;
  hardware: string;
  min_replicas: number;
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