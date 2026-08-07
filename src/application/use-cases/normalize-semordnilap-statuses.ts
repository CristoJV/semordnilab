import type { SemordnilapStatusRepository } from '@/application/ports/semordnilap-status-repository'
import { findConflictingSemordnilapStatusIds } from '@/application/statuses/semordnilap-status-policy'
import type { DatasetId } from '@/domain/semordnilap'

export class NormalizeSemordnilapStatuses {
  private readonly repository: SemordnilapStatusRepository

  constructor(repository: SemordnilapStatusRepository) {
    this.repository = repository
  }

  async execute(datasetId: DatasetId): Promise<void> {
    const records = await this.repository.listByDataset(datasetId)
    const conflictingIds = findConflictingSemordnilapStatusIds(
      records,
      datasetId,
    )
    if (conflictingIds.length === 0) return
    await this.repository.setForSemordnilaps(
      datasetId,
      conflictingIds.map((semordnilapId) => ({
        semordnilapId,
        status: 'discarded',
      })),
    )
  }
}
