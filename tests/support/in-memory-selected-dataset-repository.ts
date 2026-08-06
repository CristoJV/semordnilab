import type { SelectedDatasetRepository } from '@/application'
import type { DatasetId } from '@/domain/semordnilap'

export class InMemorySelectedDatasetRepository implements SelectedDatasetRepository {
  private value: DatasetId | ''

  constructor(value: DatasetId | '' = '') {
    this.value = value
  }

  load(): DatasetId | '' {
    return this.value
  }

  save(datasetId: DatasetId | ''): void {
    this.value = datasetId
  }
}
