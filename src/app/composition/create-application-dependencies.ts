import {
  AddSemordnilapStatus,
  ClearCompositionDraft,
  ListAvailableDatasets,
  ListSavedCompositeSemordnilaps,
  ListSemordnilapStatuses,
  LoadAtomicSemordnilaps,
  LoadCompositionDraft,
  MigrateSemordnilapStatusReferences,
  RemoveAllSemordnilapStatuses,
  RemoveSemordnilapStatus,
  SaveCompositeSemordnilap,
  SaveCompositionDraft,
} from '@/application'
import { SemordnilabDatabase } from '@/infrastructure/database'
import { StaticTsvSemordnilapDatasetSource } from '@/infrastructure/datasets'
import {
  DexieCompositionDraftRepository,
  DexieSavedCompositeSemordnilapRepository,
  DexieSemordnilapStatusRepository,
} from '@/infrastructure/repositories'

export type ApplicationDependencies = {
  listAvailableDatasets: ListAvailableDatasets
  loadAtomicSemordnilaps: LoadAtomicSemordnilaps
  listSemordnilapStatuses: ListSemordnilapStatuses
  addSemordnilapStatus: AddSemordnilapStatus
  removeSemordnilapStatus: RemoveSemordnilapStatus
  removeAllSemordnilapStatuses: RemoveAllSemordnilapStatuses
  migrateSemordnilapStatusReferences: MigrateSemordnilapStatusReferences
  listSavedCompositeSemordnilaps: ListSavedCompositeSemordnilaps
  saveCompositeSemordnilap: SaveCompositeSemordnilap
  loadCompositionDraft: LoadCompositionDraft
  saveCompositionDraft: SaveCompositionDraft
  clearCompositionDraft: ClearCompositionDraft
}

export function createApplicationDependencies(): ApplicationDependencies {
  const datasetSource = new StaticTsvSemordnilapDatasetSource(
    import.meta.env.BASE_URL,
  )
  const database = new SemordnilabDatabase()
  const statusRepository = new DexieSemordnilapStatusRepository(database)
  const compositeRepository = new DexieSavedCompositeSemordnilapRepository(
    database,
  )
  const draftRepository = new DexieCompositionDraftRepository(database)

  return {
    listAvailableDatasets: new ListAvailableDatasets(datasetSource),
    loadAtomicSemordnilaps: new LoadAtomicSemordnilaps(datasetSource),
    listSemordnilapStatuses: new ListSemordnilapStatuses(statusRepository),
    addSemordnilapStatus: new AddSemordnilapStatus(statusRepository),
    removeSemordnilapStatus: new RemoveSemordnilapStatus(statusRepository),
    removeAllSemordnilapStatuses: new RemoveAllSemordnilapStatuses(
      statusRepository,
    ),
    migrateSemordnilapStatusReferences: new MigrateSemordnilapStatusReferences(
      statusRepository,
    ),
    listSavedCompositeSemordnilaps: new ListSavedCompositeSemordnilaps(
      compositeRepository,
    ),
    saveCompositeSemordnilap: new SaveCompositeSemordnilap(compositeRepository),
    loadCompositionDraft: new LoadCompositionDraft(draftRepository),
    saveCompositionDraft: new SaveCompositionDraft(draftRepository),
    clearCompositionDraft: new ClearCompositionDraft(draftRepository),
  }
}
