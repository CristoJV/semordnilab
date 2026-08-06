import type { CompositionDraftRecord } from '@/application/dto/composition-draft'
import type { DatasetId } from '@/domain/semordnilap'

export interface CompositionDraftRepository {
  get(datasetId: DatasetId): Promise<CompositionDraftRecord | undefined>
  put(record: CompositionDraftRecord): Promise<void>
  remove(datasetId: DatasetId): Promise<void>
}
