import type { AvailableDataset } from '@/application/dto/semordnilap-catalog'
import type { SemordnilapDatasetSource } from '@/application/ports/semordnilap-dataset-source'

export class ListAvailableDatasets {
  private readonly source: SemordnilapDatasetSource

  constructor(source: SemordnilapDatasetSource) {
    this.source = source
  }

  execute(): readonly AvailableDataset[] {
    return this.source.listAvailable()
  }
}
