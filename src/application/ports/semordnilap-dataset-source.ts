import type {
  AvailableDataset,
  LoadedSemordnilapDataset,
} from '@/application/dto/semordnilap-catalog'
import type { DatasetId } from '@/domain/semordnilap'

export interface SemordnilapDatasetSource {
  listAvailable(): readonly AvailableDataset[]
  load(
    datasetId: DatasetId,
    signal?: AbortSignal,
  ): Promise<LoadedSemordnilapDataset>
}
