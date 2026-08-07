import type { DatasetId, SemordnilapId } from '@/domain/semordnilap'

export const SEMORDNILAP_CATALOG_STATUSES = ['favorite', 'discarded'] as const

export type SemordnilapCatalogStatus =
  (typeof SEMORDNILAP_CATALOG_STATUSES)[number]

export type SemordnilapStatusRecord = {
  datasetId: DatasetId
  semordnilapId: SemordnilapId
  status: SemordnilapCatalogStatus
}

export type SemordnilapStatusSelection = {
  semordnilapId: SemordnilapId
  status: SemordnilapCatalogStatus | null
}

export type SemordnilapIdAlias = {
  previousId: SemordnilapId
  currentId: SemordnilapId
}
