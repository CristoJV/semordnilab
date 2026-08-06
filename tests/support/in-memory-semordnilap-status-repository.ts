import type {
  SemordnilapCatalogStatus,
  SemordnilapIdAlias,
  SemordnilapStatusRecord,
  SemordnilapStatusReference,
  SemordnilapStatusRepository,
} from '@/application'
import type { DatasetId } from '@/domain/semordnilap'

function recordKey(record: SemordnilapStatusReference): string {
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

  async add(record: SemordnilapStatusRecord): Promise<void> {
    this.records.set(recordKey(record), record)
  }

  async remove(reference: SemordnilapStatusReference): Promise<void> {
    this.records.delete(recordKey(reference))
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
