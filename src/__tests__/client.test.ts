import { GravixLayer } from "../client";
import { GravixLayerError } from "../types/exceptions";

describe("GravixLayer Client", () => {
  it("should throw error when no API key is provided", () => {
    // Clear environment variable
    const originalApiKey = process.env.GRAVIXLAYER_API_KEY;
    delete process.env.GRAVIXLAYER_API_KEY;

    expect(() => {
      new GravixLayer();
    }).toThrow(
      "API key must be provided via options or GRAVIXLAYER_API_KEY environment variable",
    );

    // Restore environment variable
    if (originalApiKey) {
      process.env.GRAVIXLAYER_API_KEY = originalApiKey;
    }
  });

  it("should create client with API key", () => {
    const client = new GravixLayer({
      apiKey: "test-key",
    });

    expect(client).toBeInstanceOf(GravixLayer);
    expect(client.chat).toBeDefined();
    expect(client.embeddings).toBeDefined();
  });

  it("should use environment variable for API key", () => {
    process.env.GRAVIXLAYER_API_KEY = "env-test-key";

    const client = new GravixLayer();
    expect(client).toBeInstanceOf(GravixLayer);

    delete process.env.GRAVIXLAYER_API_KEY;
  });

  it("should validate base URL scheme", () => {
    expect(() => {
      new GravixLayer({
        apiKey: "test-key",
        baseURL: "invalid-url",
      });
    }).toThrow("Base URL must use HTTP or HTTPS protocol");
  });

  it("should accept valid HTTP and HTTPS URLs", () => {
    const httpClient = new GravixLayer({
      apiKey: "test-key",
      baseURL: "http://localhost:8000",
    });
    expect(httpClient).toBeInstanceOf(GravixLayer);

    const httpsClient = new GravixLayer({
      apiKey: "test-key",
      baseURL: "https://api.example.com",
    });
    expect(httpsClient).toBeInstanceOf(GravixLayer);
  });
});
