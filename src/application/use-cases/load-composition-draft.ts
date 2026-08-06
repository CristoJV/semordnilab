import type { CompositionDraftRepository } from '@/application/ports/composition-draft-repository'
import type { DatasetId } from '@/domain/semordnilap'

export class LoadCompositionDraft {
  private readonly repository: CompositionDraftRepository

  constructor(repository: CompositionDraftRepository) {
    this.repository = repository
  }

  execute(datasetId: DatasetId) {
    return this.repository.get(datasetId)
  }
}
