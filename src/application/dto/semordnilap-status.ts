import type { DatasetId, SemordnilapId } from '@/domain/semordnilap'

export type SemordnilapCatalogStatus = 'favorite' | 'discarded'

export type SemordnilapStatusRecord = {
  datasetId: DatasetId
  semordnilapId: SemordnilapId
  status: SemordnilapCatalogStatus
}

export type SemordnilapStatusReference = {
  datasetId: DatasetId
  semordnilapId: SemordnilapId
  status: SemordnilapCatalogStatus
}

export type SemordnilapIdAlias = {
  previousId: SemordnilapId
  currentId: SemordnilapId
}
