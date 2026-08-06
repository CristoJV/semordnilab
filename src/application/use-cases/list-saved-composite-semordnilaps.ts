import { resolveSavedComposites } from '@/application/composites/resolve-saved-composites'
import type { SavedCompositeSemordnilapRepository } from '@/application/ports/saved-composite-semordnilap-repository'
import type {
  AtomicSemordnilap,
  CompositeSemordnilap,
  DatasetId,
} from '@/domain/semordnilap'

export class ListSavedCompositeSemordnilaps {
  private readonly repository: SavedCompositeSemordnilapRepository

  constructor(repository: SavedCompositeSemordnilapRepository) {
    this.repository = repository
  }

  async execute(
    datasetId: DatasetId,
    atomics: readonly AtomicSemordnilap[],
  ): Promise<readonly CompositeSemordnilap[]> {
    const records = await this.repository.listByDataset(datasetId)
    return resolveSavedComposites(records, atomics)
  }
}
