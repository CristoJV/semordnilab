import type {
  SemordnilapCatalogStatus,
  SemordnilapStatusRecord,
  SemordnilapStatusReference,
  SemordnilapStatusRepository,
} from '@/application'
import type { DatasetId } from '@/domain/semordnilap'
import type { SemordnilabDatabase } from '@/infrastructure/database/semordnilab-database'

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

  async add(record: SemordnilapStatusRecord): Promise<void> {
    await this.database.semordnilapStatuses.put(record)
  }

  async remove(reference: SemordnilapStatusReference): Promise<void> {
    await this.database.semordnilapStatuses.delete([
      reference.datasetId,
      reference.semordnilapId,
      reference.status,
    ])
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
}
