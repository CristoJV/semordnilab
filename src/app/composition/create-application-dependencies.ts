import {
  AddSemordnilapTagAssignments,
  ApplySemordnilapTagChanges,
  ClearCompositionDraft,
  CreateSemordnilapTag,
  DeleteSavedComposite,
  DeleteSemordnilapTag,
  ExportPersonalData,
  ImportPersonalData,
  InspectSavedCompositeDeletion,
  GetPersonalDataSummary,
  ListAvailableDatasets,
  ListSavedCompositeSemordnilaps,
  ListSemordnilapStatuses,
  ListSemordnilapTags,
  LoadAtomicSemordnilaps,
  LoadCompositionDraft,
  LoadSelectedDataset,
  LoadWorkspacePreferences,
  MigrateSemordnilapStatusReferences,
  NormalizeSemordnilapStatuses,
  RemoveAllSemordnilapStatuses,
  RemoveSemordnilapTagAssignments,
  RenameSavedComposite,
  SaveCompositeSemordnilap,
  SaveCompositionDraft,
  SaveSelectedDataset,
  SaveWorkspacePreferences,
  SetSemordnilapStatuses,
  UpdateSemordnilapTag,
  PreviewPersonalDataImport,
  type PersonalDataFileGateway,
  AddWordFilter,
  ClearWordReview,
  ListWordReviews,
  ListWordFilters,
  RemoveWordFilter,
  SetWordReview,
} from '@/application'
import { BrowserPersonalDataFileGateway } from '@/infrastructure/files/browser-personal-data-file-gateway'
import { SemordnilabDatabase } from '@/infrastructure/database'
import { StaticTsvSemordnilapDatasetSource } from '@/infrastructure/datasets'
import {
  DexieCompositionDraftRepository,
  DexiePersonalDataRepository,
  DexieSavedCompositeSemordnilapRepository,
  DexieSemordnilapStatusRepository,
  DexieSemordnilapTagRepository,
  DexieWorkspacePreferencesRepository,
  BrowserSelectedDatasetRepository,
  DexieWordFilterRepository,
} from '@/infrastructure/repositories'

export type ApplicationDependencies = {
  listAvailableDatasets: ListAvailableDatasets
  loadAtomicSemordnilaps: LoadAtomicSemordnilaps
  loadSelectedDataset: LoadSelectedDataset
  saveSelectedDataset: SaveSelectedDataset
  listSemordnilapStatuses: ListSemordnilapStatuses
  setSemordnilapStatuses: SetSemordnilapStatuses
  normalizeSemordnilapStatuses: NormalizeSemordnilapStatuses
  removeAllSemordnilapStatuses: RemoveAllSemordnilapStatuses
  migrateSemordnilapStatusReferences: MigrateSemordnilapStatusReferences
  listSemordnilapTags: ListSemordnilapTags
  createSemordnilapTag: CreateSemordnilapTag
  updateSemordnilapTag: UpdateSemordnilapTag
  deleteSemordnilapTag: DeleteSemordnilapTag
  addSemordnilapTagAssignments: AddSemordnilapTagAssignments
  applySemordnilapTagChanges: ApplySemordnilapTagChanges
  removeSemordnilapTagAssignments: RemoveSemordnilapTagAssignments
  listSavedCompositeSemordnilaps: ListSavedCompositeSemordnilaps
  saveCompositeSemordnilap: SaveCompositeSemordnilap
  loadCompositionDraft: LoadCompositionDraft
  saveCompositionDraft: SaveCompositionDraft
  clearCompositionDraft: ClearCompositionDraft
  loadWorkspacePreferences: LoadWorkspacePreferences
  saveWorkspacePreferences: SaveWorkspacePreferences
  renameSavedComposite: RenameSavedComposite
  deleteSavedComposite: DeleteSavedComposite
  inspectSavedCompositeDeletion: InspectSavedCompositeDeletion
  exportPersonalData: ExportPersonalData
  previewPersonalDataImport: PreviewPersonalDataImport
  importPersonalData: ImportPersonalData
  getPersonalDataSummary: GetPersonalDataSummary
  personalDataFileGateway: PersonalDataFileGateway
  listWordFilters: ListWordFilters
  addWordFilter: AddWordFilter
  removeWordFilter: RemoveWordFilter
  listWordReviews: ListWordReviews
  setWordReview: SetWordReview
  clearWordReview: ClearWordReview
}

export function createApplicationDependencies(): ApplicationDependencies {
  const datasetSource = new StaticTsvSemordnilapDatasetSource(
    import.meta.env.BASE_URL,
  )
  const database = new SemordnilabDatabase()
  const statusRepository = new DexieSemordnilapStatusRepository(database)
  const selectedDatasetRepository = new BrowserSelectedDatasetRepository()
  const tagRepository = new DexieSemordnilapTagRepository(database)
  const compositeRepository = new DexieSavedCompositeSemordnilapRepository(
    database,
  )
  const draftRepository = new DexieCompositionDraftRepository(database)
  const preferencesRepository = new DexieWorkspacePreferencesRepository(
    database,
  )
  const personalDataRepository = new DexiePersonalDataRepository(database)
  const wordFilterRepository = new DexieWordFilterRepository(database)

  return {
    listAvailableDatasets: new ListAvailableDatasets(datasetSource),
    loadAtomicSemordnilaps: new LoadAtomicSemordnilaps(datasetSource),
    loadSelectedDataset: new LoadSelectedDataset(selectedDatasetRepository),
    saveSelectedDataset: new SaveSelectedDataset(selectedDatasetRepository),
    listSemordnilapStatuses: new ListSemordnilapStatuses(statusRepository),
    setSemordnilapStatuses: new SetSemordnilapStatuses(statusRepository),
    normalizeSemordnilapStatuses: new NormalizeSemordnilapStatuses(
      statusRepository,
    ),
    removeAllSemordnilapStatuses: new RemoveAllSemordnilapStatuses(
      statusRepository,
    ),
    migrateSemordnilapStatusReferences: new MigrateSemordnilapStatusReferences(
      statusRepository,
    ),
    listSemordnilapTags: new ListSemordnilapTags(tagRepository),
    createSemordnilapTag: new CreateSemordnilapTag(tagRepository),
    updateSemordnilapTag: new UpdateSemordnilapTag(tagRepository),
    deleteSemordnilapTag: new DeleteSemordnilapTag(tagRepository),
    addSemordnilapTagAssignments: new AddSemordnilapTagAssignments(
      tagRepository,
    ),
    applySemordnilapTagChanges: new ApplySemordnilapTagChanges(tagRepository),
    removeSemordnilapTagAssignments: new RemoveSemordnilapTagAssignments(
      tagRepository,
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
    inspectSavedCompositeDeletion: new InspectSavedCompositeDeletion(
      personalDataRepository,
    ),
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
    listWordFilters: new ListWordFilters(wordFilterRepository),
    addWordFilter: new AddWordFilter(wordFilterRepository),
    removeWordFilter: new RemoveWordFilter(wordFilterRepository),
    listWordReviews: new ListWordReviews(wordFilterRepository),
    setWordReview: new SetWordReview(wordFilterRepository),
    clearWordReview: new ClearWordReview(wordFilterRepository),
  }
}
