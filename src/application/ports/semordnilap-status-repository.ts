import type {
  SemordnilapCatalogStatus,
  SemordnilapIdAlias,
  SemordnilapStatusRecord,
  SemordnilapStatusSelection,
} from '@/application/dto/semordnilap-status'
import type { DatasetId } from '@/domain/semordnilap'

export interface SemordnilapStatusRepository {
  listByDataset(
    datasetId: DatasetId,
  ): Promise<readonly SemordnilapStatusRecord[]>
  setForSemordnilaps(
    datasetId: DatasetId,
    selections: readonly SemordnilapStatusSelection[],
  ): Promise<void>
  removeAll(
    datasetId: DatasetId,
    status: SemordnilapCatalogStatus,
  ): Promise<void>
  migrateReferences(
    datasetId: DatasetId,
    aliases: readonly SemordnilapIdAlias[],
  ): Promise<void>
}
