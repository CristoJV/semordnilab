import type {
  SemordnilapCatalogStatus,
  SemordnilapIdAlias,
  SemordnilapStatusRecord,
  SemordnilapStatusSelection,
  SemordnilapStatusRepository,
} from '@/application'
import type { DatasetId } from '@/domain/semordnilap'

function recordKey(record: SemordnilapStatusRecord): string {
  return `${record.datasetId}:${record.semordnilapId}:${record.status}`
}

export class InMemorySemordnilapStatusRepository implements SemordnilapStatusRepository {
  private readonly records = new Map<string, SemordnilapStatusRecord>()

  constructor(initialRecords: readonly SemordnilapStatusRecord[] = []) {
    for (const record of initialRecords)
      this.records.set(recordKey(record), record)
  }

  readAllRecords(): readonly SemordnilapStatusRecord[] {
    return [...this.records.values()]
  }

  replaceAllRecords(records: readonly SemordnilapStatusRecord[]): void {
    this.records.clear()
    for (const record of records) this.records.set(recordKey(record), record)
  }

  async listByDataset(
    datasetId: DatasetId,
  ): Promise<readonly SemordnilapStatusRecord[]> {
    return [...this.records.values()].filter(
      (record) => record.datasetId === datasetId,
    )
  }

  async setForSemordnilaps(
    datasetId: DatasetId,
    selections: readonly SemordnilapStatusSelection[],
  ): Promise<void> {
    const selectionById = new Map(
      selections.map((selection) => [selection.semordnilapId, selection]),
    )
    for (const [key, record] of this.records) {
      if (
        record.datasetId === datasetId &&
        selectionById.has(record.semordnilapId)
      ) {
        this.records.delete(key)
      }
    }
    for (const selection of selectionById.values()) {
      if (!selection.status) continue
      const record = { datasetId, ...selection, status: selection.status }
      this.records.set(recordKey(record), record)
    }
  }

  async removeAll(
    datasetId: DatasetId,
    status: SemordnilapCatalogStatus,
  ): Promise<void> {
    for (const [key, record] of this.records) {
      if (record.datasetId === datasetId && record.status === status) {
        this.records.delete(key)
      }
    }
  }

  async migrateReferences(
    datasetId: DatasetId,
    aliases: readonly SemordnilapIdAlias[],
  ): Promise<void> {
    const aliasByPreviousId = new Map(
      aliases.map(({ previousId, currentId }) => [previousId, currentId]),
    )
    for (const [key, record] of [...this.records]) {
      const currentId = aliasByPreviousId.get(record.semordnilapId)
      if (record.datasetId !== datasetId || !currentId) continue
      this.records.delete(key)
      const migrated = { ...record, semordnilapId: currentId }
      this.records.set(recordKey(migrated), migrated)
    }
  }
}
