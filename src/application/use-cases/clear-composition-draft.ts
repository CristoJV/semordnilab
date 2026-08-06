import type { CompositionDraftRepository } from '@/application/ports/composition-draft-repository'
import type { DatasetId } from '@/domain/semordnilap'

export class ClearCompositionDraft {
  private readonly repository: CompositionDraftRepository

  constructor(repository: CompositionDraftRepository) {
    this.repository = repository
  }

  execute(datasetId: DatasetId): Promise<void> {
    return this.repository.remove(datasetId)
  }
}
