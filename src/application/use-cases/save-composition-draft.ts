import type { CompositionDraftRecord } from '@/application/dto/composition-draft'
import type { CompositionDraftRepository } from '@/application/ports/composition-draft-repository'

export class SaveCompositionDraft {
  private readonly repository: CompositionDraftRepository

  constructor(repository: CompositionDraftRepository) {
    this.repository = repository
  }

  execute(record: CompositionDraftRecord): Promise<void> {
    return this.repository.put(record)
  }
}
