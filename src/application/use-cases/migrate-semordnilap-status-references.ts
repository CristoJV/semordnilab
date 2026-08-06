import type { SemordnilapIdAlias } from '@/application/dto/semordnilap-status'
import type { SemordnilapStatusRepository } from '@/application/ports/semordnilap-status-repository'
import type { DatasetId } from '@/domain/semordnilap'

export class MigrateSemordnilapStatusReferences {
  private readonly repository: SemordnilapStatusRepository

  constructor(repository: SemordnilapStatusRepository) {
    this.repository = repository
  }

  execute(
    datasetId: DatasetId,
    aliases: readonly SemordnilapIdAlias[],
  ): Promise<void> {
    return aliases.length === 0
      ? Promise.resolve()
      : this.repository.migrateReferences(datasetId, aliases)
  }
}
