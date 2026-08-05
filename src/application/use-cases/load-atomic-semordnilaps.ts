import type { LoadedSemordnilapDataset } from '@/application/dto/semordnilap-catalog'
import type { SemordnilapDatasetSource } from '@/application/ports/semordnilap-dataset-source'
import type { DatasetId } from '@/domain/semordnilap'

export class LoadAtomicSemordnilaps {
  private readonly source: SemordnilapDatasetSource

  constructor(source: SemordnilapDatasetSource) {
    this.source = source
  }

  execute(
    datasetId: DatasetId,
    signal?: AbortSignal,
  ): Promise<LoadedSemordnilapDataset> {
    return this.source.load(datasetId, signal)
  }
}
