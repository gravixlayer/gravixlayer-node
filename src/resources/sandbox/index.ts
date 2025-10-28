/**
 * Main Sandbox resource that contains sandboxes and templates
 */
import { GravixLayer } from '../../client';
import { Sandboxes } from './sandboxes';
import { SandboxTemplates } from './templates';

export class SandboxResource {
  public sandboxes: Sandboxes;
  public templates: SandboxTemplates;

  constructor(client: GravixLayer) {
    this.sandboxes = new Sandboxes(client);
    this.templates = new SandboxTemplates(client);
  }
}

export { Sandbox } from './sandbox-class';
export * from './sandboxes';
export * from './templates';