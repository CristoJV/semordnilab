import { describe, expect, it } from 'vitest'

import {
  NormalizeSemordnilapStatuses,
  SetSemordnilapStatuses,
  type SemordnilapStatusRecord,
} from '@/application'
import {
  applySemordnilapStatusSelections,
  normalizeSemordnilapStatusRecords,
} from '@/application/statuses/semordnilap-status-policy'

import { InMemorySemordnilapStatusRepository } from '../support/in-memory-semordnilap-status-repository'

const favorite: SemordnilapStatusRecord = {
  datasetId: 'es-gl',
  semordnilapId: 'amor-roma',
  status: 'favorite',
}
const discarded: SemordnilapStatusRecord = {
  ...favorite,
  status: 'discarded',
}

describe('estados exclusivos del catálogo', () => {
  it('da prioridad al descarte al normalizar datos antiguos incompatibles', () => {
    expect(normalizeSemordnilapStatusRecords([favorite, discarded])).toEqual([
      discarded,
    ])
  })

  it('sustituye el estado optimista sin afectar a otros semordnilaps', () => {
    const other: SemordnilapStatusRecord = {
      datasetId: 'es-gl',
      semordnilapId: 'otro',
      status: 'favorite',
    }

    expect(
      applySemordnilapStatusSelections([favorite, other], 'es-gl', [
        { semordnilapId: favorite.semordnilapId, status: 'discarded' },
      ]),
    ).toEqual([other, discarded])
  })

  it('repara y persiste los conflictos al cargar un dataset', async () => {
    const repository = new InMemorySemordnilapStatusRepository([
      favorite,
      discarded,
    ])

    await new NormalizeSemordnilapStatuses(repository).execute('es-gl')

    expect(await repository.listByDataset('es-gl')).toEqual([discarded])
  })

  it('aplica en lote una selección distinta por semordnilap', async () => {
    const repository = new InMemorySemordnilapStatusRepository([favorite])
    await new SetSemordnilapStatuses(repository).execute('es-gl', [
      { semordnilapId: favorite.semordnilapId, status: null },
      { semordnilapId: 'otro', status: 'discarded' },
    ])

    expect(await repository.listByDataset('es-gl')).toEqual([
      {
        datasetId: 'es-gl',
        semordnilapId: 'otro',
        status: 'discarded',
      },
    ])
  })
})
