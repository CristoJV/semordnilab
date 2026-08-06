import 'fake-indexeddb/auto'

import { afterEach, describe, expect, it } from 'vitest'

import { SemordnilabDatabase } from '@/infrastructure/database'
import {
  DexieCompositionDraftRepository,
  DexieSavedCompositeSemordnilapRepository,
  DexiePersonalDataRepository,
  DexieSemordnilapTagRepository,
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
      tags: [],
      semordnilapTags: [],
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
        tags: [],
        semordnilapTags: [],
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
      tags: [],
      semordnilapTags: [],
    })

    expect(await repository.inspectCompositeDeletion(composite.id)).toEqual({
      found: true,
      rootId: composite.id,
      directDependentIds: [],
      dependentIds: [],
      dependentDraftDatasetIds: ['es-gl'],
    })
    await database.compositionDrafts.clear()
    const plan = await repository.inspectCompositeDeletion(composite.id)
    await repository.deleteCompositePlan(plan)
    expect(await database.savedComposites.count()).toBe(0)
    expect(await database.semordnilapStatuses.count()).toBe(0)
  })

  it('elimina en cascada todos los derivados y conserva datos no relacionados', async () => {
    const database = createDatabase()
    const repository = new DexiePersonalDataRepository(database)
    const record = (id: string, dependency?: string) => ({
      id,
      datasetId: 'es-gl',
      components: dependency
        ? [
            {
              kind: 'composite' as const,
              datasetId: 'es-gl',
              semordnilapId: dependency,
            },
          ]
        : [],
      atomicComponentIds: [],
      createdAt: '2026-08-06T10:00:00.000Z',
      updatedAt: '2026-08-06T10:00:00.000Z',
    })
    const root = record('A')
    const direct = record('B', 'A')
    const indirect = record('C', 'B')
    const unrelated = record('D')
    const tag = {
      id: 'tag:uno',
      name: 'Uno',
      normalizedName: 'uno',
      color: 'violet' as const,
      createdAt: '2026-08-06T10:00:00.000Z',
      updatedAt: '2026-08-06T10:00:00.000Z',
    }
    await repository.replaceAll({
      statuses: [
        { datasetId: 'es-gl', semordnilapId: 'C', status: 'favorite' },
        { datasetId: 'es-gl', semordnilapId: 'D', status: 'favorite' },
      ],
      savedComposites: [root, direct, indirect, unrelated],
      compositionDrafts: [],
      tags: [tag],
      semordnilapTags: [
        {
          datasetId: 'es-gl',
          semordnilapId: 'B',
          tagId: tag.id,
          createdAt: tag.createdAt,
        },
        {
          datasetId: 'es-gl',
          semordnilapId: 'D',
          tagId: tag.id,
          createdAt: tag.createdAt,
        },
      ],
    })

    const plan = await repository.inspectCompositeDeletion('A')
    expect(plan).toMatchObject({
      directDependentIds: ['B'],
      dependentIds: ['B', 'C'],
    })
    await repository.deleteCompositePlan(plan)

    const snapshot = await repository.readAll()
    expect(snapshot.savedComposites).toEqual([unrelated])
    expect(snapshot.statuses).toEqual([
      { datasetId: 'es-gl', semordnilapId: 'D', status: 'favorite' },
    ])
    expect(snapshot.semordnilapTags).toEqual([
      {
        datasetId: 'es-gl',
        semordnilapId: 'D',
        tagId: tag.id,
        createdAt: tag.createdAt,
      },
    ])
    expect(snapshot.tags).toEqual([tag])
  })

  it('cancela la eliminación si las dependencias cambian tras la confirmación', async () => {
    const database = createDatabase()
    const repository = new DexiePersonalDataRepository(database)
    const root = {
      id: 'A',
      datasetId: 'es-gl',
      components: [],
      atomicComponentIds: [],
      createdAt: '2026-08-06T10:00:00.000Z',
      updatedAt: '2026-08-06T10:00:00.000Z',
    }
    await repository.replaceAll({
      statuses: [],
      savedComposites: [root],
      compositionDrafts: [],
      tags: [],
      semordnilapTags: [],
    })
    const stalePlan = await repository.inspectCompositeDeletion(root.id)
    await database.savedComposites.add({
      ...root,
      id: 'B',
      components: [
        {
          kind: 'composite',
          datasetId: 'es-gl',
          semordnilapId: root.id,
        },
      ],
    })

    await expect(repository.deleteCompositePlan(stalePlan)).rejects.toThrow(
      'dependencias han cambiado',
    )
    expect(await database.savedComposites.count()).toBe(2)
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

  it('persiste etiquetas y elimina sus asignaciones en una transacción', async () => {
    const database = createDatabase()
    const repository = new DexieSemordnilapTagRepository(database)
    const tag = {
      id: 'tag:curioso',
      name: 'Curioso',
      normalizedName: 'curioso',
      color: 'violet' as const,
      createdAt: '2026-08-06T10:00:00.000Z',
      updatedAt: '2026-08-06T10:00:00.000Z',
    }
    await repository.add(tag)
    await repository.addAssignments([
      {
        datasetId: 'es-gl',
        semordnilapId: 'atomic:uno',
        tagId: tag.id,
        createdAt: '2026-08-06T10:00:00.000Z',
      },
    ])

    expect(await repository.list('es-gl')).toEqual({
      tags: [tag],
      assignments: [
        {
          datasetId: 'es-gl',
          semordnilapId: 'atomic:uno',
          tagId: tag.id,
          createdAt: '2026-08-06T10:00:00.000Z',
        },
      ],
    })

    await repository.delete(tag.id)
    expect(await repository.list('es-gl')).toEqual({
      tags: [],
      assignments: [],
    })
  })
})
