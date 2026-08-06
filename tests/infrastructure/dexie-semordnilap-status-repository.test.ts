import 'fake-indexeddb/auto'

import Dexie from 'dexie'
import { afterEach, describe, expect, it } from 'vitest'

import {
  DATABASE_VERSION,
  SemordnilabDatabase,
} from '@/infrastructure/database'
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

  it('migra identificadores antiguos dentro de una transacción', async () => {
    const repository = createRepository()
    await repository.add({
      datasetId: 'es-gl',
      semordnilapId: 'es-gl:2',
      status: 'favorite',
    })

    await repository.migrateReferences('es-gl', [
      { previousId: 'es-gl:2', currentId: 'atomic:es-gl:estable' },
    ])

    expect(await repository.listByDataset('es-gl')).toEqual([
      {
        datasetId: 'es-gl',
        semordnilapId: 'atomic:es-gl:estable',
        status: 'favorite',
      },
    ])
  })

  it('actualiza una base v1 sin perder sus estados', async () => {
    const databaseName = `semordnilab-v1-${Date.now()}`
    const legacy = new Dexie(databaseName)
    legacy.version(1).stores({
      semordnilapStatuses:
        '[datasetId+semordnilapId+status], datasetId, semordnilapId, status, [datasetId+status]',
    })
    await legacy.table('semordnilapStatuses').put({
      datasetId: 'es-gl',
      semordnilapId: 'es-gl:2',
      status: 'discarded',
    })
    legacy.close()

    const upgraded = new SemordnilabDatabase(databaseName)
    databases.push(upgraded)
    await upgraded.open()

    expect(upgraded.verno).toBe(DATABASE_VERSION)
    expect(await upgraded.semordnilapStatuses.toArray()).toEqual([
      {
        datasetId: 'es-gl',
        semordnilapId: 'es-gl:2',
        status: 'discarded',
      },
    ])
    expect(await upgraded.savedComposites.count()).toBe(0)
    expect(await upgraded.compositionDrafts.count()).toBe(0)
    expect(await upgraded.workspacePreferences.count()).toBe(0)
    expect(await upgraded.tags.count()).toBe(0)
    expect(await upgraded.semordnilapTags.count()).toBe(0)
  })

  it('actualiza una base v2 sin perder composites ni borradores', async () => {
    const databaseName = `semordnilab-v2-${Date.now()}`
    const legacy = new Dexie(databaseName)
    legacy.version(2).stores({
      semordnilapStatuses:
        '[datasetId+semordnilapId+status], datasetId, semordnilapId, status, [datasetId+status]',
      savedComposites: 'id, datasetId, createdAt, updatedAt',
      compositionDrafts: 'datasetId, updatedAt',
    })
    const composite = {
      id: 'composite:es-gl:uno',
      datasetId: 'es-gl',
      components: [],
      atomicComponentIds: [],
      createdAt: '2026-08-06T10:00:00.000Z',
      updatedAt: '2026-08-06T10:00:00.000Z',
    }
    const draft = {
      datasetId: 'es-gl',
      components: [],
      insertionIndex: 0,
      updatedAt: '2026-08-06T10:00:00.000Z',
    }
    await legacy.table('savedComposites').put(composite)
    await legacy.table('compositionDrafts').put(draft)
    legacy.close()

    const upgraded = new SemordnilabDatabase(databaseName)
    databases.push(upgraded)
    await upgraded.open()

    expect(await upgraded.savedComposites.toArray()).toEqual([composite])
    expect(await upgraded.compositionDrafts.toArray()).toEqual([draft])
    expect(await upgraded.workspacePreferences.count()).toBe(0)
    expect(await upgraded.tags.count()).toBe(0)
    expect(await upgraded.semordnilapTags.count()).toBe(0)
  })

  it('actualiza una base v3 de forma aditiva sin reescribir sus datos', async () => {
    const databaseName = `semordnilab-v3-${Date.now()}`
    const legacy = new Dexie(databaseName)
    legacy.version(3).stores({
      semordnilapStatuses:
        '[datasetId+semordnilapId+status], datasetId, semordnilapId, status, [datasetId+status]',
      savedComposites: 'id, datasetId, createdAt, updatedAt',
      compositionDrafts: 'datasetId, updatedAt',
      workspacePreferences: 'id, updatedAt',
    })
    const status = {
      datasetId: 'es-gl',
      semordnilapId: 'atomic:es-gl:uno',
      status: 'favorite',
    }
    const preferences = {
      id: 'workspace',
      rememberCatalogView: false,
      rememberCompositionCollapsed: false,
      compositionCollapsed: false,
      catalogViews: [],
      updatedAt: '2026-08-06T10:00:00.000Z',
    }
    await legacy.table('semordnilapStatuses').put(status)
    await legacy.table('workspacePreferences').put(preferences)
    legacy.close()

    const upgraded = new SemordnilabDatabase(databaseName)
    databases.push(upgraded)
    await upgraded.open()

    expect(upgraded.verno).toBe(DATABASE_VERSION)
    expect(await upgraded.semordnilapStatuses.toArray()).toEqual([status])
    expect(await upgraded.workspacePreferences.toArray()).toEqual([preferences])
    expect(await upgraded.tags.count()).toBe(0)
    expect(await upgraded.semordnilapTags.count()).toBe(0)
  })
})
