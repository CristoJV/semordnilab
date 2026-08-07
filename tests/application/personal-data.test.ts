import { describe, expect, it, vi } from 'vitest'

import {
  DeleteSavedComposite,
  ExportPersonalData,
  ImportPersonalData,
  PreviewPersonalDataImport,
  RenameSavedComposite,
  SaveCompositeSemordnilap,
  type PersonalDataSnapshot,
  type SemordnilapDatasetSource,
} from '@/application'

import {
  createAtomicSemordnilap,
  createCatalogItem,
  testDataset,
} from '../support/fixtures'
import {
  InMemoryCompositionDraftRepository,
  InMemoryPersonalDataRepository,
  InMemorySavedCompositeSemordnilapRepository,
  InMemoryWorkspacePreferencesRepository,
} from '../support/in-memory-saved-data-repositories'
import { InMemorySemordnilapStatusRepository } from '../support/in-memory-semordnilap-status-repository'

const ella = createAtomicSemordnilap('ella', 'ella', 'ella', 'a lle', 'alle')
const noSe = createAtomicSemordnilap('no-se', 'no se', 'nose', 'e son', 'eson')
const source: SemordnilapDatasetSource = {
  listAvailable: () => [testDataset],
  load: async () => ({
    dataset: testDataset,
    items: [createCatalogItem(ella), createCatalogItem(noSe)],
  }),
}

function createRepository() {
  const statuses = new InMemorySemordnilapStatusRepository()
  const composites = new InMemorySavedCompositeSemordnilapRepository()
  const drafts = new InMemoryCompositionDraftRepository()
  const preferences = new InMemoryWorkspacePreferencesRepository()
  return {
    repository: new InMemoryPersonalDataRepository(
      statuses,
      composites,
      drafts,
      preferences,
    ),
    statuses,
    composites,
    drafts,
  }
}

const mergeOptions = {
  mode: 'merge' as const,
  draftConflicts: 'keep-current' as const,
  importPreferences: true,
}

describe('copias de datos personales', () => {
  it('normaliza estados incompatibles al importar una copia antigua', async () => {
    const target = createRepository()
    const content = JSON.stringify({
      format: 'semordnilab-personal-data',
      version: 3,
      exportedAt: '2026-08-06T12:00:00.000Z',
      data: {
        statuses: [
          {
            datasetId: testDataset.id,
            semordnilapId: ella.id,
            status: 'favorite',
          },
          {
            datasetId: testDataset.id,
            semordnilapId: ella.id,
            status: 'discarded',
          },
        ],
        savedComposites: [],
        compositionDrafts: [],
        tags: [],
        semordnilapTags: [],
      },
    })

    await new ImportPersonalData(target.repository, source).execute(content, {
      ...mergeOptions,
      mode: 'replace',
    })

    expect((await target.repository.readAll()).statuses).toEqual([
      {
        datasetId: testDataset.id,
        semordnilapId: ella.id,
        status: 'discarded',
      },
    ])
  })

  it('exporta, valida y combina una copia compatible', async () => {
    const origin = createRepository()
    const saved = await new SaveCompositeSemordnilap(
      origin.composites,
      () => new Date('2026-08-06T10:00:00.000Z'),
    ).execute({
      datasetId: testDataset.id,
      components: [ella, noSe],
      title: 'Hallazgo',
    })
    await origin.statuses.setForSemordnilaps(testDataset.id, [
      { semordnilapId: saved.record.id, status: 'favorite' },
    ])
    const originSnapshot = await origin.repository.readAll()
    await origin.repository.replaceAll({
      ...originSnapshot,
      tags: [
        {
          id: 'tag:hallazgo',
          name: 'Hallazgo',
          normalizedName: 'hallazgo',
          color: 'violet',
          icon: 'star',
          createdAt: '2026-08-06T10:30:00.000Z',
          updatedAt: '2026-08-06T10:30:00.000Z',
        },
      ],
      semordnilapTags: [
        {
          datasetId: testDataset.id,
          semordnilapId: saved.record.id,
          tagId: 'tag:hallazgo',
          createdAt: '2026-08-06T10:30:00.000Z',
        },
      ],
    })
    const exported = await new ExportPersonalData(
      origin.repository,
      () => new Date('2026-08-06T12:00:00.000Z'),
    ).execute()
    expect(JSON.parse(exported.content)).toMatchObject({ version: 3 })

    const target = createRepository()
    await target.statuses.setForSemordnilaps(testDataset.id, [
      { semordnilapId: ella.id, status: 'discarded' },
    ])
    const preview = await new PreviewPersonalDataImport(
      target.repository,
      source,
    ).execute(exported.content, mergeOptions)
    expect(preview.imported).toMatchObject({
      favorites: 1,
      savedComposites: 1,
      tags: 1,
      taggedSemordnilaps: 1,
    })
    expect(preview.resulting.statuses).toBe(2)

    await new ImportPersonalData(target.repository, source).execute(
      exported.content,
      mergeOptions,
    )
    const result = await target.repository.readAll()
    expect(result.statuses).toHaveLength(2)
    expect(result.savedComposites).toEqual([saved.record])
    expect(result.tags).toHaveLength(1)
    expect(result.semordnilapTags).toHaveLength(1)
  })

  it('rechaza referencias ausentes antes de escribir', async () => {
    const base = createRepository()
    const replaceAll = vi.spyOn(base.repository, 'replaceAll')
    const invalid = JSON.stringify({
      format: 'semordnilab-personal-data',
      version: 1,
      exportedAt: '2026-08-06T12:00:00.000Z',
      data: {
        statuses: [
          {
            datasetId: testDataset.id,
            semordnilapId: 'ausente',
            status: 'favorite',
          },
        ],
        savedComposites: [],
        compositionDrafts: [],
      },
    })

    await expect(
      new ImportPersonalData(base.repository, source).execute(
        invalid,
        mergeOptions,
      ),
    ).rejects.toThrow('no existe')
    expect(replaceAll).not.toHaveBeenCalled()
  })

  it('rechaza formatos y versiones desconocidas', async () => {
    const base = createRepository()
    const preview = new PreviewPersonalDataImport(base.repository, source)
    await expect(preview.execute('{}', mergeOptions)).rejects.toThrow(
      'no es una copia',
    )
    await expect(
      preview.execute(
        JSON.stringify({
          format: 'semordnilab-personal-data',
          version: 99,
          exportedAt: '2026-08-06T12:00:00.000Z',
          data: {},
        }),
        mergeOptions,
      ),
    ).rejects.toThrow('versión')
  })

  it('fusiona etiquetas equivalentes y remapea sus asignaciones', async () => {
    const base = createRepository()
    await base.repository.replaceAll({
      statuses: [],
      savedComposites: [],
      compositionDrafts: [],
      tags: [
        {
          id: 'tag:local',
          name: 'Revisar',
          normalizedName: 'revisar',
          color: 'violet',
          icon: 'tag',
          createdAt: '2026-08-06T10:00:00.000Z',
          updatedAt: '2026-08-06T10:00:00.000Z',
        },
      ],
      semordnilapTags: [],
    })
    const imported = JSON.stringify({
      format: 'semordnilab-personal-data',
      version: 2,
      exportedAt: '2026-08-06T12:00:00.000Z',
      data: {
        statuses: [],
        savedComposites: [],
        compositionDrafts: [],
        tags: [
          {
            id: 'tag:importada',
            name: 'REVISAR',
            normalizedName: 'revisar',
            color: 'mustard',
            createdAt: '2026-08-06T11:00:00.000Z',
            updatedAt: '2026-08-06T11:00:00.000Z',
          },
        ],
        semordnilapTags: [
          {
            datasetId: testDataset.id,
            semordnilapId: ella.id,
            tagId: 'tag:importada',
            createdAt: '2026-08-06T11:00:00.000Z',
          },
        ],
      },
    })

    const legacyPreview = await new PreviewPersonalDataImport(
      base.repository,
      source,
    ).execute(imported, mergeOptions)
    expect(legacyPreview.backup.data.tags[0]).toMatchObject({ icon: 'tag' })

    await new ImportPersonalData(base.repository, source).execute(
      imported,
      mergeOptions,
    )
    const result = await base.repository.readAll()
    expect(result.tags).toHaveLength(1)
    expect(result.tags[0]).toMatchObject({ id: 'tag:local', color: 'violet' })
    expect(result.semordnilapTags).toEqual([
      expect.objectContaining({ tagId: 'tag:local', semordnilapId: ella.id }),
    ])
  })
})

describe('gestión de composites', () => {
  it('renombra sin alterar la estructura ni la identidad', async () => {
    const base = createRepository()
    const saved = await new SaveCompositeSemordnilap(base.composites).execute({
      datasetId: testDataset.id,
      components: [ella, noSe],
    })
    await new RenameSavedComposite(
      base.repository,
      () => new Date('2026-08-06T14:00:00.000Z'),
    ).execute(saved.record.id, '  Nuevo nombre  ')

    expect((await base.repository.readAll()).savedComposites[0]).toEqual({
      ...saved.record,
      title: 'Nuevo nombre',
      updatedAt: '2026-08-06T14:00:00.000Z',
    })
  })

  it('bloquea la eliminación mientras otra entidad conserve la referencia', async () => {
    const base = createRepository()
    const saved = await new SaveCompositeSemordnilap(base.composites).execute({
      datasetId: testDataset.id,
      components: [ella, noSe],
    })
    await base.drafts.put({
      datasetId: testDataset.id,
      components: [
        {
          kind: 'composite',
          datasetId: testDataset.id,
          semordnilapId: saved.record.id,
        },
      ],
      insertionIndex: 1,
      updatedAt: '2026-08-06T12:00:00.000Z',
    })

    await expect(
      new DeleteSavedComposite(base.repository).execute(saved.record.id),
    ).rejects.toThrow('Retira los composites afectados del borrador')
    expect((await base.repository.readAll()).savedComposites).toHaveLength(1)
  })

  it('elimina también sus estados cuando no quedan dependencias', async () => {
    const base = createRepository()
    const saved = await new SaveCompositeSemordnilap(base.composites).execute({
      datasetId: testDataset.id,
      components: [ella, noSe],
    })
    await base.statuses.setForSemordnilaps(testDataset.id, [
      { semordnilapId: saved.record.id, status: 'favorite' },
    ])

    await new DeleteSavedComposite(base.repository).execute(saved.record.id)
    expect(await base.repository.readAll()).toMatchObject({
      statuses: [],
      savedComposites: [],
    } satisfies Partial<PersonalDataSnapshot>)
  })
})
