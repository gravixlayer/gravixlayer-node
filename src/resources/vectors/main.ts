/**
 * Main vector database resource for GravixLayer SDK
 */
import { VectorIndexes } from './indexes';
import { Vectors } from './vectors';

export class VectorDatabase {
  public indexes: VectorIndexes;

  constructor(private client: any) {
    this.indexes = new VectorIndexes(client);
  }

  /**
   * Get a Vectors resource for a specific index
   */
  index(indexId: string): Vectors {
    return new Vectors(this.client, indexId);
  }
}
