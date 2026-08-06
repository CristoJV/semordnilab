import Dexie, { type Table } from 'dexie'

import type {
  CompositionDraftRecord,
  SavedCompositeSemordnilapRecord,
  SemordnilapCatalogStatus,
  SemordnilapStatusRecord,
  WorkspacePreferencesRecord,
} from '@/application'
import type { DatasetId, SemordnilapId } from '@/domain/semordnilap'

export const DATABASE_VERSION = 3

export type SemordnilapStatusKey = [
  DatasetId,
  SemordnilapId,
  SemordnilapCatalogStatus,
]

const statusSchema =
  '[datasetId+semordnilapId+status], datasetId, semordnilapId, status, [datasetId+status]'

export class SemordnilabDatabase extends Dexie {
  readonly semordnilapStatuses: Table<
    SemordnilapStatusRecord,
    SemordnilapStatusKey
  >
  readonly savedComposites: Table<
    SavedCompositeSemordnilapRecord,
    SemordnilapId
  >
  readonly compositionDrafts: Table<CompositionDraftRecord, DatasetId>
  readonly workspacePreferences: Table<WorkspacePreferencesRecord, 'workspace'>

  constructor(databaseName = 'semordnilab') {
    super(databaseName)

    this.version(1).stores({ semordnilapStatuses: statusSchema })
    this.version(2).stores({
      semordnilapStatuses: statusSchema,
      savedComposites: 'id, datasetId, createdAt, updatedAt',
      compositionDrafts: 'datasetId, updatedAt',
    })
    this.version(DATABASE_VERSION).stores({
      semordnilapStatuses: statusSchema,
      savedComposites: 'id, datasetId, createdAt, updatedAt',
      compositionDrafts: 'datasetId, updatedAt',
      workspacePreferences: 'id, updatedAt',
    })

    this.semordnilapStatuses = this.table('semordnilapStatuses')
    this.savedComposites = this.table('savedComposites')
    this.compositionDrafts = this.table('compositionDrafts')
    this.workspacePreferences = this.table('workspacePreferences')
  }
}
