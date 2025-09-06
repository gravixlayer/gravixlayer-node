// The main GravixLayer client is already async-first
// This file exists for compatibility and re-exports the main client
export { GravixLayer as AsyncGravixLayer, type GravixLayerOptions as AsyncGravixLayerOptions } from './client';