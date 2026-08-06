import 'fake-indexeddb/auto'

import { afterEach, describe, expect, it } from 'vitest'

import { SemordnilabDatabase } from '@/infrastructure/database'
import {
  DexieCompositionDraftRepository,
  DexieSavedCompositeSemordnilapRepository,
  DexiePersonalDataRepository,
  DexieWorkspacePreferencesRepository,
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

  it('revierte la sustitución completa si una escritura falla', async () => {
    const database = createDatabase()
    const repository = new DexiePersonalDataRepository(database)
    const original = {
      statuses: [
        {
          datasetId: 'es-gl',
          semordnilapId: 'uno',
          status: 'favorite' as const,
        },
      ],
      savedComposites: [],
      compositionDrafts: [],
    }
    await repository.replaceAll(original)

    await expect(
      repository.replaceAll({
        statuses: original.statuses,
        savedComposites: [
          {
            id: undefined,
            datasetId: 'es-gl',
            components: [],
            atomicComponentIds: [],
            createdAt: '2026-08-06T10:00:00.000Z',
            updatedAt: '2026-08-06T10:00:00.000Z',
          },
        ],
        compositionDrafts: [],
      } as never),
    ).rejects.toThrow()

    expect(await repository.readAll()).toEqual(original)
  })

  it('elimina un composite y sus estados solo si no tiene referencias', async () => {
    const database = createDatabase()
    const repository = new DexiePersonalDataRepository(database)
    const composite = {
      id: 'composite:es-gl:uno',
      datasetId: 'es-gl',
      components: [],
      atomicComponentIds: [],
      createdAt: '2026-08-06T10:00:00.000Z',
      updatedAt: '2026-08-06T10:00:00.000Z',
    }
    await repository.replaceAll({
      statuses: [
        {
          datasetId: 'es-gl',
          semordnilapId: composite.id,
          status: 'favorite',
        },
      ],
      savedComposites: [composite],
      compositionDrafts: [
        {
          datasetId: 'es-gl',
          components: [
            {
              kind: 'composite',
              datasetId: 'es-gl',
              semordnilapId: composite.id,
            },
          ],
          insertionIndex: 1,
          updatedAt: '2026-08-06T10:00:00.000Z',
        },
      ],
    })

    expect(
      await repository.deleteCompositeIfUnreferenced(composite.id),
    ).toEqual({
      found: true,
      removed: false,
      dependentComposites: 0,
      dependentDrafts: 1,
    })
    await database.compositionDrafts.clear()
    expect(
      await repository.deleteCompositeIfUnreferenced(composite.id),
    ).toMatchObject({ removed: true })
    expect(await database.savedComposites.count()).toBe(0)
    expect(await database.semordnilapStatuses.count()).toBe(0)
  })

  it('persiste las preferencias como un registro versionable', async () => {
    const repository = new DexieWorkspacePreferencesRepository(createDatabase())
    const preferences = {
      id: 'workspace' as const,
      rememberCatalogView: true,
      rememberCompositionCollapsed: true,
      compositionCollapsed: false,
      catalogViews: [],
      updatedAt: '2026-08-06T10:00:00.000Z',
    }
    await repository.put(preferences)
    expect(await repository.get()).toEqual(preferences)
  })
})
