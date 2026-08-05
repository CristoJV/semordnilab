import 'fake-indexeddb/auto'

import { afterEach, describe, expect, it } from 'vitest'

import { SemordnilabDatabase } from '@/infrastructure/database'
import { DexieSemordnilapStatusRepository } from '@/infrastructure/repositories'

const databases: SemordnilabDatabase[] = []

function createRepository() {
  const database = new SemordnilabDatabase(
    `semordnilab-test-${databases.length}-${Date.now()}`,
  )
  databases.push(database)
  return new DexieSemordnilapStatusRepository(database)
}

afterEach(async () => {
  await Promise.all(databases.splice(0).map((database) => database.delete()))
})

describe('DexieSemordnilapStatusRepository', () => {
  it('persiste estados independientes para un mismo semordnilap', async () => {
    const repository = createRepository()
    const reference = {
      datasetId: 'es-gl',
      semordnilapId: 'amor-roma',
    }

    await repository.add({ ...reference, status: 'favorite' })
    await repository.add({ ...reference, status: 'discarded' })

    expect(await repository.listByDataset('es-gl')).toEqual(
      expect.arrayContaining([
        { ...reference, status: 'favorite' },
        { ...reference, status: 'discarded' },
      ]),
    )

    await repository.remove({ ...reference, status: 'discarded' })
    expect(await repository.listByDataset('es-gl')).toEqual([
      { ...reference, status: 'favorite' },
    ])
  })

  it('elimina solo el estado y el dataset solicitados', async () => {
    const repository = createRepository()
    await repository.add({
      datasetId: 'es-gl',
      semordnilapId: 'uno',
      status: 'discarded',
    })
    await repository.add({
      datasetId: 'es-gl',
      semordnilapId: 'dos',
      status: 'favorite',
    })
    await repository.add({
      datasetId: 'es-ca',
      semordnilapId: 'tres',
      status: 'discarded',
    })

    await repository.removeAll('es-gl', 'discarded')

    expect(await repository.listByDataset('es-gl')).toEqual([
      { datasetId: 'es-gl', semordnilapId: 'dos', status: 'favorite' },
    ])
    expect(await repository.listByDataset('es-ca')).toEqual([
      { datasetId: 'es-ca', semordnilapId: 'tres', status: 'discarded' },
    ])
  })
})
