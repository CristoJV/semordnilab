import type { SelectedDatasetRepository } from '@/application'
import type { DatasetId } from '@/domain/semordnilap'

const STORAGE_KEY = 'semordnilab:selected-dataset'

type StorageAdapter = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export class BrowserSelectedDatasetRepository implements SelectedDatasetRepository {
  private readonly storage: StorageAdapter

  constructor(storage: StorageAdapter = window.localStorage) {
    this.storage = storage
  }

  load(): DatasetId | '' {
    try {
      return (this.storage.getItem(STORAGE_KEY)?.trim() as DatasetId) || ''
    } catch {
      return ''
    }
  }

  save(datasetId: DatasetId | ''): void {
    try {
      if (datasetId) this.storage.setItem(STORAGE_KEY, datasetId)
      else this.storage.removeItem(STORAGE_KEY)
    } catch {
      // La sesión no es crítica y la selección sigue funcionando en memoria.
    }
  }
}
