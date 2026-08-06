import type { DatasetId } from '@/domain/semordnilap'

export type CatalogViewMode = 'active' | 'saved' | 'favorites' | 'discarded'
export type CatalogSortField = 'alphabetical' | 'length'
export type CatalogSide = 'source' | 'target'
export type CatalogSortDirection = 'ascending' | 'descending'

export type CatalogSortPreference = {
  field: CatalogSortField
  side: CatalogSide
  direction: CatalogSortDirection
}

export type DatasetCatalogViewPreference = {
  datasetId: DatasetId
  sourceQuery: string
  targetQuery: string
  viewMode: CatalogViewMode
  sort: readonly CatalogSortPreference[]
}

export type WorkspacePreferencesRecord = {
  id: 'workspace'
  rememberCatalogView: boolean
  rememberCompositionCollapsed: boolean
  compositionCollapsed: boolean
  catalogViews: readonly DatasetCatalogViewPreference[]
  updatedAt: string
}

export const DEFAULT_WORKSPACE_PREFERENCES: WorkspacePreferencesRecord = {
  id: 'workspace',
  rememberCatalogView: true,
  rememberCompositionCollapsed: true,
  compositionCollapsed: false,
  catalogViews: [],
  updatedAt: '',
}
