import {
  AddSemordnilapStatus,
  ClearCompositionDraft,
  DeleteSavedComposite,
  ExportPersonalData,
  ImportPersonalData,
  GetPersonalDataSummary,
  ListAvailableDatasets,
  ListSavedCompositeSemordnilaps,
  ListSemordnilapStatuses,
  LoadAtomicSemordnilaps,
  LoadCompositionDraft,
  LoadWorkspacePreferences,
  MigrateSemordnilapStatusReferences,
  RemoveAllSemordnilapStatuses,
  RemoveSemordnilapStatus,
  RenameSavedComposite,
  SaveCompositeSemordnilap,
  SaveCompositionDraft,
  SaveWorkspacePreferences,
  PreviewPersonalDataImport,
  type PersonalDataFileGateway,
} from '@/application'
import { BrowserPersonalDataFileGateway } from '@/infrastructure/files/browser-personal-data-file-gateway'
import { SemordnilabDatabase } from '@/infrastructure/database'
import { StaticTsvSemordnilapDatasetSource } from '@/infrastructure/datasets'
import {
  DexieCompositionDraftRepository,
  DexiePersonalDataRepository,
  DexieSavedCompositeSemordnilapRepository,
  DexieSemordnilapStatusRepository,
  DexieWorkspacePreferencesRepository,
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
  loadWorkspacePreferences: LoadWorkspacePreferences
  saveWorkspacePreferences: SaveWorkspacePreferences
  renameSavedComposite: RenameSavedComposite
  deleteSavedComposite: DeleteSavedComposite
  exportPersonalData: ExportPersonalData
  previewPersonalDataImport: PreviewPersonalDataImport
  importPersonalData: ImportPersonalData
  getPersonalDataSummary: GetPersonalDataSummary
  personalDataFileGateway: PersonalDataFileGateway
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
  const preferencesRepository = new DexieWorkspacePreferencesRepository(
    database,
  )
  const personalDataRepository = new DexiePersonalDataRepository(database)

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
    loadWorkspacePreferences: new LoadWorkspacePreferences(
      preferencesRepository,
    ),
    saveWorkspacePreferences: new SaveWorkspacePreferences(
      preferencesRepository,
    ),
    renameSavedComposite: new RenameSavedComposite(personalDataRepository),
    deleteSavedComposite: new DeleteSavedComposite(personalDataRepository),
    exportPersonalData: new ExportPersonalData(personalDataRepository),
    previewPersonalDataImport: new PreviewPersonalDataImport(
      personalDataRepository,
      datasetSource,
    ),
    importPersonalData: new ImportPersonalData(
      personalDataRepository,
      datasetSource,
    ),
    getPersonalDataSummary: new GetPersonalDataSummary(personalDataRepository),
    personalDataFileGateway: new BrowserPersonalDataFileGateway(),
  }
}
