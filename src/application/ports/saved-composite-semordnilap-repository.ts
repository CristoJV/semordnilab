import type { SavedCompositeSemordnilapRecord } from '@/application/dto/saved-composite'
import type { DatasetId, SemordnilapId } from '@/domain/semordnilap'

export interface SavedCompositeSemordnilapRepository {
  listByDataset(
    datasetId: DatasetId,
  ): Promise<readonly SavedCompositeSemordnilapRecord[]>
  get(id: SemordnilapId): Promise<SavedCompositeSemordnilapRecord | undefined>
  add(record: SavedCompositeSemordnilapRecord): Promise<void>
}
