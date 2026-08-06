import type { SelectedDatasetRepository } from '@/application/ports/selected-dataset-repository'
import type { DatasetId } from '@/domain/semordnilap'

export class LoadSelectedDataset {
  private readonly repository: SelectedDatasetRepository

  constructor(repository: SelectedDatasetRepository) {
    this.repository = repository
  }

  execute(): DatasetId | '' {
    return this.repository.load()
  }
}

export class SaveSelectedDataset {
  private readonly repository: SelectedDatasetRepository

  constructor(repository: SelectedDatasetRepository) {
    this.repository = repository
  }

  execute(datasetId: DatasetId | ''): void {
    this.repository.save(datasetId)
  }
}
