import 'fake-indexeddb/auto'

import { afterEach, describe, expect, it } from 'vitest'

import { SemordnilabDatabase } from '@/infrastructure/database'
import {
  DexieCompositionDraftRepository,
  DexieSavedCompositeSemordnilapRepository,
} from '@/infrastructure/repositories'

const databases: SemordnilabDatabase[] = []

afterEach(async () => {
  await Promise.all(databases.splice(0).map((database) => database.delete()))
})

function createDatabase() {
  const database = new SemordnilabDatabase(
    `semordnilab-saved-${databases.length}-${Date.now()}`,
  )
  databases.push(database)
  return database
}

describe('repositorios Dexie de datos guardados', () => {
  it('persiste composites por dataset sin guardar textos derivados', async () => {
    const repository = new DexieSavedCompositeSemordnilapRepository(
      createDatabase(),
    )
    const record = {
      id: 'composite:es-gl:uno',
      datasetId: 'es-gl',
      components: [
        {
          kind: 'atomic' as const,
          datasetId: 'es-gl',
          semordnilapId: 'atomic:es-gl:uno',
        },
        {
          kind: 'atomic' as const,
          datasetId: 'es-gl',
          semordnilapId: 'atomic:es-gl:dos',
        },
      ],
      atomicComponentIds: ['atomic:es-gl:uno', 'atomic:es-gl:dos'],
      createdAt: '2026-08-06T10:00:00.000Z',
      updatedAt: '2026-08-06T10:00:00.000Z',
    }

    await repository.add(record)

    expect(await repository.get(record.id)).toEqual(record)
    expect(await repository.listByDataset('es-gl')).toEqual([record])
    expect(await repository.listByDataset('es-pt')).toEqual([])
  })

  it('reemplaza de forma atómica el borrador de cada dataset', async () => {
    const repository = new DexieCompositionDraftRepository(createDatabase())
    const first = {
      datasetId: 'es-gl',
      components: [],
      insertionIndex: 0,
      updatedAt: '2026-08-06T10:00:00.000Z',
    }
    const second = { ...first, insertionIndex: 1, updatedAt: 'later' }

    await repository.put(first)
    await repository.put(second)
    expect(await repository.get('es-gl')).toEqual(second)

    await repository.remove('es-gl')
    expect(await repository.get('es-gl')).toBeUndefined()
  })
})
