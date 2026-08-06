import type {
  SemordnilapCatalogStatus,
  SemordnilapIdAlias,
  SemordnilapStatusRecord,
  SemordnilapStatusReference,
} from '@/application/dto/semordnilap-status'
import type { DatasetId } from '@/domain/semordnilap'

export interface SemordnilapStatusRepository {
  listByDataset(
    datasetId: DatasetId,
  ): Promise<readonly SemordnilapStatusRecord[]>
  add(record: SemordnilapStatusRecord): Promise<void>
  remove(reference: SemordnilapStatusReference): Promise<void>
  removeAll(
    datasetId: DatasetId,
    status: SemordnilapCatalogStatus,
  ): Promise<void>
  migrateReferences(
    datasetId: DatasetId,
    aliases: readonly SemordnilapIdAlias[],
  ): Promise<void>
}
