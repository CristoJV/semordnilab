import Dexie, { type Table } from 'dexie'

import type {
  SemordnilapCatalogStatus,
  SemordnilapStatusRecord,
} from '@/application'
import type { DatasetId, SemordnilapId } from '@/domain/semordnilap'

export type SemordnilapStatusKey = [
  DatasetId,
  SemordnilapId,
  SemordnilapCatalogStatus,
]

export class SemordnilabDatabase extends Dexie {
  readonly semordnilapStatuses: Table<
    SemordnilapStatusRecord,
    SemordnilapStatusKey
  >

  constructor(databaseName = 'semordnilab') {
    super(databaseName)

    this.version(1).stores({
      semordnilapStatuses:
        '[datasetId+semordnilapId+status], datasetId, semordnilapId, status, [datasetId+status]',
    })

    this.semordnilapStatuses = this.table('semordnilapStatuses')
  }
}
