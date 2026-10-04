import Dexie, { type Table } from 'dexie'

import type {
  CompositionDraftRecord,
  SavedCompositeSemordnilapRecord,
  SemordnilapCatalogStatus,
  SemordnilapTag,
  SemordnilapTagAssignment,
  TagId,
  SemordnilapStatusRecord,
  WorkspacePreferencesRecord,
  WordFilterRecord,
} from '@/application'
import type {
  DatasetId,
  LanguageCode,
  SemordnilapId,
} from '@/domain/semordnilap'

export const DATABASE_VERSION = 6

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
  readonly tags: Table<SemordnilapTag, TagId>
  readonly semordnilapTags: Table<
    SemordnilapTagAssignment,
    [DatasetId, SemordnilapId, TagId]
  >
  readonly wordFilters: Table<WordFilterRecord, [LanguageCode, string]>

  constructor(databaseName = 'semordnilab') {
    super(databaseName)

    this.version(1).stores({ semordnilapStatuses: statusSchema })
    this.version(2).stores({
      semordnilapStatuses: statusSchema,
      savedComposites: 'id, datasetId, createdAt, updatedAt',
      compositionDrafts: 'datasetId, updatedAt',
    })
    this.version(4).stores({
      semordnilapStatuses: statusSchema,
      savedComposites: 'id, datasetId, createdAt, updatedAt',
      compositionDrafts: 'datasetId, updatedAt',
      workspacePreferences: 'id, updatedAt',
      tags: 'id, &normalizedName, createdAt, updatedAt',
      semordnilapTags:
        '[datasetId+semordnilapId+tagId], datasetId, semordnilapId, tagId, [datasetId+tagId]',
    })
    this.version(5)
      .stores({
        semordnilapStatuses: statusSchema,
        savedComposites: 'id, datasetId, createdAt, updatedAt',
        compositionDrafts: 'datasetId, updatedAt',
        workspacePreferences: 'id, updatedAt',
        tags: 'id, &normalizedName, createdAt, updatedAt',
        semordnilapTags:
          '[datasetId+semordnilapId+tagId], datasetId, semordnilapId, tagId, [datasetId+tagId]',
      })
      .upgrade((transaction) =>
        transaction
          .table<SemordnilapTag, TagId>('tags')
          .toCollection()
          .modify((tag) => {
            if (!tag.icon) tag.icon = 'tag'
          }),
      )
    this.version(DATABASE_VERSION).stores({
      semordnilapStatuses: statusSchema,
      savedComposites: 'id, datasetId, createdAt, updatedAt',
      compositionDrafts: 'datasetId, updatedAt',
      workspacePreferences: 'id, updatedAt',
      tags: 'id, &normalizedName, createdAt, updatedAt',
      semordnilapTags:
        '[datasetId+semordnilapId+tagId], datasetId, semordnilapId, tagId, [datasetId+tagId]',
      wordFilters: '[language+normalizedWord], language, createdAt',
    })

    this.semordnilapStatuses = this.table('semordnilapStatuses')
    this.savedComposites = this.table('savedComposites')
    this.compositionDrafts = this.table('compositionDrafts')
    this.workspacePreferences = this.table('workspacePreferences')
    this.tags = this.table('tags')
    this.semordnilapTags = this.table('semordnilapTags')
    this.wordFilters = this.table('wordFilters')
  }
}
