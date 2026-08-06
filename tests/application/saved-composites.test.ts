import { describe, expect, it } from 'vitest'

import {
  ListSavedCompositeSemordnilaps,
  SaveCompositeSemordnilap,
} from '@/application'

import { createAtomicSemordnilap } from '../support/fixtures'
import { InMemorySavedCompositeSemordnilapRepository } from '../support/in-memory-saved-data-repositories'

const ella = createAtomicSemordnilap('ella', 'ella', 'ella', 'a lle', 'alle')
const noSe = createAtomicSemordnilap('no-se', 'no se', 'nose', 'e son', 'eson')

describe('composites guardados', () => {
  it('guarda una secuencia canónica y detecta duplicados', async () => {
    const repository = new InMemorySavedCompositeSemordnilapRepository()
    const save = new SaveCompositeSemordnilap(
      repository,
      () => new Date('2026-08-06T10:00:00.000Z'),
    )

    const first = await save.execute({
      datasetId: 'test-es-gl',
      components: [ella, noSe],
      title: 'Mi prueba',
    })
    const duplicate = await save.execute({
      datasetId: 'test-es-gl',
      components: [ella, noSe],
      title: 'Otro título',
    })

    expect(first.created).toBe(true)
    expect(first.record).toMatchObject({
      id: expect.stringMatching(/^composite:test-es-gl:/),
      title: 'Mi prueba',
      atomicComponentIds: ['ella', 'no-se'],
    })
    expect(duplicate).toEqual({ record: first.record, created: false })
  })

  it('resuelve composites anidados y deriva sus expresiones', async () => {
    const repository = new InMemorySavedCompositeSemordnilapRepository()
    const save = new SaveCompositeSemordnilap(repository)
    const list = new ListSavedCompositeSemordnilaps(repository)
    await save.execute({
      datasetId: 'test-es-gl',
      components: [ella, noSe],
    })
    const [firstComposite] = await list.execute('test-es-gl', [ella, noSe])
    expect(firstComposite).toBeDefined()
    await save.execute({
      datasetId: 'test-es-gl',
      components: [firstComposite!, ella],
    })

    const composites = await list.execute('test-es-gl', [ella, noSe])
    expect(composites).toHaveLength(2)
    expect(composites[1]).toMatchObject({
      source: { text: 'ella no se ella', normalized: 'ellanoseella' },
      target: { text: 'a lle e son a lle', normalized: 'alleesonalle' },
    })
    expect(
      composites[1]?.atomicComponents.map(({ semordnilapId }) => semordnilapId),
    ).toEqual(['ella', 'no-se', 'ella'])
  })

  it('rechaza composiciones individuales o de datasets mezclados', async () => {
    const save = new SaveCompositeSemordnilap(
      new InMemorySavedCompositeSemordnilapRepository(),
    )

    await expect(
      save.execute({ datasetId: 'test-es-gl', components: [ella] }),
    ).rejects.toThrow('al menos dos componentes')
    await expect(
      save.execute({
        datasetId: 'otro',
        components: [ella, noSe],
      }),
    ).rejects.toThrow('mismo dataset')
  })

  it('rechaza un registro cuya identidad persistida no supera la integridad', async () => {
    const repository = new InMemorySavedCompositeSemordnilapRepository()
    await repository.add({
      id: 'composite:test-es-gl:alterado',
      datasetId: 'test-es-gl',
      components: [
        { kind: 'atomic', datasetId: 'test-es-gl', semordnilapId: 'ella' },
        { kind: 'atomic', datasetId: 'test-es-gl', semordnilapId: 'no-se' },
      ],
      atomicComponentIds: ['ella', 'no-se'],
      createdAt: '2026-08-06T10:00:00.000Z',
      updatedAt: '2026-08-06T10:00:00.000Z',
    })
    const list = new ListSavedCompositeSemordnilaps(repository)

    await expect(list.execute('test-es-gl', [ella, noSe])).rejects.toThrow(
      'comprobación de integridad',
    )
  })
})
