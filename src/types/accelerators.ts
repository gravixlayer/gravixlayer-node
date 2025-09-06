export interface Accelerator {
  accelerator_id: string;
  pricing: number;
  hw_model: string;
  hw_link: string;
  hw_memory: number;
  provider: string;
  status: string;
  updated_at: string;
  // Computed properties
  name: string;
  hardware_string: string;
  memory: string;
  gpu_type: string;
  use_case: string;
}

export interface AcceleratorList {
  accelerators: Accelerator[];
}