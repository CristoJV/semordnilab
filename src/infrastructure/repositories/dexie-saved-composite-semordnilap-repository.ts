import type {
  SavedCompositeSemordnilapRecord,
  SavedCompositeSemordnilapRepository,
} from '@/application'
import type { DatasetId, SemordnilapId } from '@/domain/semordnilap'
import type { SemordnilabDatabase } from '@/infrastructure/database'

export class DexieSavedCompositeSemordnilapRepository implements SavedCompositeSemordnilapRepository {
  private readonly database: SemordnilabDatabase

  constructor(database: SemordnilabDatabase) {
    this.database = database
  }

  listByDataset(
    datasetId: DatasetId,
  ): Promise<readonly SavedCompositeSemordnilapRecord[]> {
    return this.database.savedComposites
      .where('datasetId')
      .equals(datasetId)
      .toArray()
  }

  get(id: SemordnilapId) {
    return this.database.savedComposites.get(id)
  }

  async add(record: SavedCompositeSemordnilapRecord): Promise<void> {
    await this.database.savedComposites.add(record)
  }
}
