import type { DatasetId } from '@/domain/semordnilap'

export interface SelectedDatasetRepository {
  load(): DatasetId | ''
  save(datasetId: DatasetId | ''): void
}
