import {
  AddSemordnilapStatus,
  ListAvailableDatasets,
  ListSemordnilapStatuses,
  LoadAtomicSemordnilaps,
  RemoveAllSemordnilapStatuses,
  RemoveSemordnilapStatus,
} from '@/application'
import { SemordnilabDatabase } from '@/infrastructure/database'
import { StaticTsvSemordnilapDatasetSource } from '@/infrastructure/datasets'
import { DexieSemordnilapStatusRepository } from '@/infrastructure/repositories'

export type ApplicationDependencies = {
  listAvailableDatasets: ListAvailableDatasets
  loadAtomicSemordnilaps: LoadAtomicSemordnilaps
  listSemordnilapStatuses: ListSemordnilapStatuses
  addSemordnilapStatus: AddSemordnilapStatus
  removeSemordnilapStatus: RemoveSemordnilapStatus
  removeAllSemordnilapStatuses: RemoveAllSemordnilapStatuses
}

export function createApplicationDependencies(): ApplicationDependencies {
  const datasetSource = new StaticTsvSemordnilapDatasetSource(
    import.meta.env.BASE_URL,
  )
  const database = new SemordnilabDatabase()
  const statusRepository = new DexieSemordnilapStatusRepository(database)

  return {
    listAvailableDatasets: new ListAvailableDatasets(datasetSource),
    loadAtomicSemordnilaps: new LoadAtomicSemordnilaps(datasetSource),
    listSemordnilapStatuses: new ListSemordnilapStatuses(statusRepository),
    addSemordnilapStatus: new AddSemordnilapStatus(statusRepository),
    removeSemordnilapStatus: new RemoveSemordnilapStatus(statusRepository),
    removeAllSemordnilapStatuses: new RemoveAllSemordnilapStatuses(
      statusRepository,
    ),
  }
}
