export class GravixLayerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GravixLayerError';
  }
}

export class GravixLayerAuthenticationError extends GravixLayerError {
  constructor(message: string) {
    super(message);
    this.name = 'GravixLayerAuthenticationError';
  }
}

export class GravixLayerRateLimitError extends GravixLayerError {
  constructor(message: string) {
    super(message);
    this.name = 'GravixLayerRateLimitError';
  }
}

export class GravixLayerServerError extends GravixLayerError {
  constructor(message: string) {
    super(message);
    this.name = 'GravixLayerServerError';
  }
}

export class GravixLayerBadRequestError extends GravixLayerError {
  constructor(message: string) {
    super(message);
    this.name = 'GravixLayerBadRequestError';
  }
}

export class GravixLayerConnectionError extends GravixLayerError {
  constructor(message: string) {
    super(message);
    this.name = 'GravixLayerConnectionError';
  }
}
