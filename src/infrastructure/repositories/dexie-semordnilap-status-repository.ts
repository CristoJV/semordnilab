import { SEMORDNILAP_CATALOG_STATUSES } from '@/application'
import type {
  SemordnilapCatalogStatus,
  SemordnilapIdAlias,
  SemordnilapStatusRecord,
  SemordnilapStatusSelection,
  SemordnilapStatusRepository,
} from '@/application'
import type { DatasetId } from '@/domain/semordnilap'
import type {
  SemordnilabDatabase,
  SemordnilapStatusKey,
} from '@/infrastructure/database/semordnilab-database'

export class DexieSemordnilapStatusRepository implements SemordnilapStatusRepository {
  private readonly database: SemordnilabDatabase

  constructor(database: SemordnilabDatabase) {
    this.database = database
  }

  listByDataset(
    datasetId: DatasetId,
  ): Promise<readonly SemordnilapStatusRecord[]> {
    return this.database.semordnilapStatuses
      .where('datasetId')
      .equals(datasetId)
      .toArray()
  }

  async setForSemordnilaps(
    datasetId: DatasetId,
    selections: readonly SemordnilapStatusSelection[],
  ): Promise<void> {
    const selectionById = new Map(
      selections.map((selection) => [selection.semordnilapId, selection]),
    )
    await this.database.transaction(
      'rw',
      this.database.semordnilapStatuses,
      async () => {
        const keys = [...selectionById.keys()].flatMap((semordnilapId) =>
          SEMORDNILAP_CATALOG_STATUSES.map((status): SemordnilapStatusKey => [
            datasetId,
            semordnilapId,
            status,
          ]),
        )
        await this.database.semordnilapStatuses.bulkDelete(keys)
        await this.database.semordnilapStatuses.bulkPut(
          [...selectionById.values()].flatMap((selection) =>
            selection.status
              ? [{ datasetId, ...selection, status: selection.status }]
              : [],
          ),
        )
      },
    )
  }

  async removeAll(
    datasetId: DatasetId,
    status: SemordnilapCatalogStatus,
  ): Promise<void> {
    await this.database.semordnilapStatuses
      .where('[datasetId+status]')
      .equals([datasetId, status])
      .delete()
  }

  async migrateReferences(
    datasetId: DatasetId,
    aliases: readonly SemordnilapIdAlias[],
  ): Promise<void> {
    const aliasByPreviousId = new Map(
      aliases.map(({ previousId, currentId }) => [previousId, currentId]),
    )
    await this.database.transaction(
      'rw',
      this.database.semordnilapStatuses,
      async () => {
        const records = await this.database.semordnilapStatuses
          .where('datasetId')
          .equals(datasetId)
          .toArray()
        for (const record of records) {
          const currentId = aliasByPreviousId.get(record.semordnilapId)
          if (!currentId || currentId === record.semordnilapId) continue
          await this.database.semordnilapStatuses.put({
            ...record,
            semordnilapId: currentId,
          })
          await this.database.semordnilapStatuses.delete([
            record.datasetId,
            record.semordnilapId,
            record.status,
          ])
        }
      },
    )
  }
}
