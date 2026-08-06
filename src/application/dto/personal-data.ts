import type { CompositionDraftRecord } from './composition-draft'
import type { SavedCompositeSemordnilapRecord } from './saved-composite'
import type { SemordnilapStatusRecord } from './semordnilap-status'
import type {
  SemordnilapTag,
  SemordnilapTagAssignment,
} from './semordnilap-tag'
import type { WorkspacePreferencesRecord } from './workspace-preferences'

export type PersonalDataSnapshot = {
  statuses: readonly SemordnilapStatusRecord[]
  savedComposites: readonly SavedCompositeSemordnilapRecord[]
  compositionDrafts: readonly CompositionDraftRecord[]
  tags: readonly SemordnilapTag[]
  semordnilapTags: readonly SemordnilapTagAssignment[]
  workspacePreferences?: WorkspacePreferencesRecord
}

export type SemordnilabBackup = {
  format: 'semordnilab-personal-data'
  version: 1 | 2 | 3
  exportedAt: string
  data: PersonalDataSnapshot
}

export type PersonalDataSummary = {
  statuses: number
  favorites: number
  discarded: number
  savedComposites: number
  compositionDrafts: number
  tags: number
  taggedSemordnilaps: number
  includesPreferences: boolean
}

export type PersonalDataImportOptions = {
  mode: 'merge' | 'replace'
  draftConflicts: 'keep-current' | 'use-imported'
  importPreferences: boolean
}

export type PersonalDataImportPreview = {
  backup: SemordnilabBackup
  imported: PersonalDataSummary
  resulting: PersonalDataSummary
  duplicateComposites: number
  draftConflicts: number
}
