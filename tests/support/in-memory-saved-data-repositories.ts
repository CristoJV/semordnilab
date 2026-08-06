import type {
  CompositionDraftRecord,
  CompositionDraftRepository,
  SavedCompositeSemordnilapRecord,
  SavedCompositeSemordnilapRepository,
} from '@/application'
import type { DatasetId, SemordnilapId } from '@/domain/semordnilap'

export class InMemorySavedCompositeSemordnilapRepository implements SavedCompositeSemordnilapRepository {
  private readonly records = new Map<
    SemordnilapId,
    SavedCompositeSemordnilapRecord
  >()

  async listByDataset(
    datasetId: DatasetId,
  ): Promise<readonly SavedCompositeSemordnilapRecord[]> {
    return [...this.records.values()].filter(
      (record) => record.datasetId === datasetId,
    )
  }

  async get(id: SemordnilapId) {
    return this.records.get(id)
  }

  async add(record: SavedCompositeSemordnilapRecord): Promise<void> {
    if (this.records.has(record.id)) throw new Error('Composite duplicado')
    this.records.set(record.id, record)
  }
}

export class InMemoryCompositionDraftRepository implements CompositionDraftRepository {
  private readonly records = new Map<DatasetId, CompositionDraftRecord>()

  async get(datasetId: DatasetId) {
    return this.records.get(datasetId)
  }

  async put(record: CompositionDraftRecord): Promise<void> {
    this.records.set(record.datasetId, record)
  }

  async remove(datasetId: DatasetId): Promise<void> {
    this.records.delete(datasetId)
  }
}
