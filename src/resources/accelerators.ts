import { GravixLayer } from "../client";
import { Accelerator } from "../types/accelerators";

export class Accelerators {
  constructor(private client: GravixLayer) {}

  async list(): Promise<Accelerator[]> {
    // Use the accelerators endpoint
    const originalBaseURL = (this.client as any).baseURL;
    (this.client as any).baseURL = originalBaseURL.replace(
      "/v1/inference",
      "/v1",
    );

    try {
      const response = await this.client._makeRequest("GET", "accelerators");
      const acceleratorsData = await response.json();

      // Handle different response formats
      let rawAccelerators: any[] = [];
      if (Array.isArray(acceleratorsData)) {
        rawAccelerators = acceleratorsData;
      } else if (
        acceleratorsData &&
        typeof acceleratorsData === "object" &&
        acceleratorsData.accelerators
      ) {
        rawAccelerators = acceleratorsData.accelerators;
      } else if (
        acceleratorsData &&
        typeof acceleratorsData === "object" &&
        Object.keys(acceleratorsData).length === 0
      ) {
        // Empty object response means no accelerators
        return [];
      } else {
        // If it's a different format, return empty array and log the issue
        console.warn(
          `Unexpected response format: ${typeof acceleratorsData}, content:`,
          acceleratorsData,
        );
        return [];
      }

      // Transform raw accelerators to include computed properties
      return rawAccelerators.map((acc) => this._transformAccelerator(acc));
    } finally {
      (this.client as any).baseURL = originalBaseURL;
    }
  }

  private _transformAccelerator(acc: any): Accelerator {
    // Generate computed properties
    const name = acc.accelerator_id?.replace(/_/g, " ") || "";

    // Generate hardware string in the expected format
    const providerLower = acc.provider?.toLowerCase() || "";
    const modelLower = acc.hw_model?.toLowerCase() || "";
    const memoryStr = `${acc.hw_memory || 0}gb`;
    const linkLower = acc.hw_link?.toLowerCase() || "";
    const hardware_string = `${providerLower}-${modelLower}-${memoryStr}-${linkLower}_1`;

    // Format memory as string
    const memory = `${acc.hw_memory || 0}GB`;

    // Get GPU type (model)
    const gpu_type = acc.hw_model?.toLowerCase() || "";

    // Determine use case based on memory and model
    let use_case = "";
    const hwMemory = acc.hw_memory || 0;
    const hwModel = acc.hw_model?.toLowerCase() || "";

    if (hwMemory <= 16) {
      use_case = "Small models, development";
    } else if (hwMemory <= 32) {
      use_case = "Medium models";
    } else if (hwMemory <= 24 && hwModel.includes("rtx")) {
      use_case = "Development, small production";
    } else {
      use_case = "Large models, production";
    }

    return {
      accelerator_id: acc.accelerator_id || "",
      pricing: acc.pricing || 0,
      hw_model: acc.hw_model || "",
      hw_link: acc.hw_link || "",
      hw_memory: acc.hw_memory || 0,
      provider: acc.provider || "",
      status: acc.status || "",
      updated_at: acc.updated_at || "",
      // Computed properties
      name,
      hardware_string,
      memory,
      gpu_type,
      use_case,
    };
  }
}
