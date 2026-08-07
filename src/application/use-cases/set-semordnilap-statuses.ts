import type { SemordnilapStatusSelection } from '@/application/dto/semordnilap-status'
import type { SemordnilapStatusRepository } from '@/application/ports/semordnilap-status-repository'
import type { DatasetId } from '@/domain/semordnilap'

export class SetSemordnilapStatuses {
  private readonly repository: SemordnilapStatusRepository

  constructor(repository: SemordnilapStatusRepository) {
    this.repository = repository
  }

  execute(
    datasetId: DatasetId,
    selections: readonly SemordnilapStatusSelection[],
  ): Promise<void> {
    return selections.length === 0
      ? Promise.resolve()
      : this.repository.setForSemordnilaps(datasetId, selections)
  }
}
