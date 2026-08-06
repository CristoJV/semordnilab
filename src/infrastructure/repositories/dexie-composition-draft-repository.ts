import type {
  CompositionDraftRecord,
  CompositionDraftRepository,
} from '@/application'
import type { DatasetId } from '@/domain/semordnilap'
import type { SemordnilabDatabase } from '@/infrastructure/database'

export class DexieCompositionDraftRepository implements CompositionDraftRepository {
  private readonly database: SemordnilabDatabase

  constructor(database: SemordnilabDatabase) {
    this.database = database
  }

  get(datasetId: DatasetId) {
    return this.database.compositionDrafts.get(datasetId)
  }

  async put(record: CompositionDraftRecord): Promise<void> {
    await this.database.compositionDrafts.put(record)
  }

  async remove(datasetId: DatasetId): Promise<void> {
    await this.database.compositionDrafts.delete(datasetId)
  }
}
