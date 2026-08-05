import { ListAvailableDatasets, LoadAtomicSemordnilaps } from '@/application'
import { StaticTsvSemordnilapDatasetSource } from '@/infrastructure/datasets'

export type ApplicationDependencies = {
  listAvailableDatasets: ListAvailableDatasets
  loadAtomicSemordnilaps: LoadAtomicSemordnilaps
}

export function createApplicationDependencies(): ApplicationDependencies {
  const datasetSource = new StaticTsvSemordnilapDatasetSource(
    import.meta.env.BASE_URL,
  )

  return {
    listAvailableDatasets: new ListAvailableDatasets(datasetSource),
    loadAtomicSemordnilaps: new LoadAtomicSemordnilaps(datasetSource),
  }
}
