import type { SemordnilapStatusRecord } from '@/application/dto/semordnilap-status'
import type { SemordnilapStatusRepository } from '@/application/ports/semordnilap-status-repository'
import type { DatasetId } from '@/domain/semordnilap'

export class ListSemordnilapStatuses {
  private readonly repository: SemordnilapStatusRepository

  constructor(repository: SemordnilapStatusRepository) {
    this.repository = repository
  }

  execute(datasetId: DatasetId): Promise<readonly SemordnilapStatusRecord[]> {
    return this.repository.listByDataset(datasetId)
  }
}
