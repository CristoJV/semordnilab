import type { SemordnilapCatalogStatus } from '@/application/dto/semordnilap-status'
import type { SemordnilapStatusRepository } from '@/application/ports/semordnilap-status-repository'
import type { DatasetId } from '@/domain/semordnilap'

export class RemoveAllSemordnilapStatuses {
  private readonly repository: SemordnilapStatusRepository

  constructor(repository: SemordnilapStatusRepository) {
    this.repository = repository
  }

  execute(
    datasetId: DatasetId,
    status: SemordnilapCatalogStatus,
  ): Promise<void> {
    return this.repository.removeAll(datasetId, status)
  }
}
