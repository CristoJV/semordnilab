import { describe, expect, it } from 'vitest'

import {
  AddWordFilter,
  ListWordFilters,
  RemoveWordFilter,
  extractLanguageVocabulary,
  normalizeWordFilterKey,
  semordnilapMatchesWordFilters,
  type WordFilterRecord,
  type WordFilterRepository,
} from '@/application'

import {
  createAtomicSemordnilap,
  createCatalogItem,
  testDataset,
} from '../support/fixtures'
import type { Semordnilap } from '@/domain/semordnilap'

class MemoryWordFilterRepository implements WordFilterRepository {
  records: WordFilterRecord[] = []

  async list(language?: string) {
    return language
      ? this.records.filter((record) => record.language === language)
      : [...this.records]
  }

  async put(record: WordFilterRecord) {
    this.records = this.records.filter(
      (candidate) =>
        candidate.language !== record.language ||
        candidate.normalizedWord !== record.normalizedWord,
    )
    this.records.push(record)
  }

  async remove(language: string, normalizedWord: string) {
    this.records = this.records.filter(
      (record) =>
        record.language !== language ||
        record.normalizedWord !== normalizedWord,
    )
  }
}

describe('filtros de palabras por idioma', () => {
  it('normaliza de forma estable sin perder separadores internos', () => {
    expect(normalizeWordFilterKey('  Ár-BOL  ')).toBe('ar-bol')
    expect(normalizeWordFilterKey('D’ALGUÉN')).toBe("d'alguen")
  })

  it('deriva palabras únicas del idioma y conserva una forma visible', () => {
    const items = [
      createCatalogItem(
        createAtomicSemordnilap(
          'uno',
          'Árbol, azul',
          'arbolazul',
          'luz a',
          'luza',
        ),
      ),
      createCatalogItem(
        createAtomicSemordnilap(
          'dos',
          'árbol alto',
          'arbolalto',
          'otla lobrá',
          'otlalobra',
        ),
      ),
    ]

    expect(extractLanguageVocabulary(items, 'es')).toEqual([
      { displayWord: 'alto', normalizedWord: 'alto' },
      { displayWord: 'Árbol', normalizedWord: 'arbol' },
      { displayWord: 'azul', normalizedWord: 'azul' },
    ])
    expect(extractLanguageVocabulary(items, 'pt')).toEqual([])
  })

  it('añade, lista y recupera una palabra usando su clave normalizada', async () => {
    const repository = new MemoryWordFilterRepository()
    const add = new AddWordFilter(
      repository,
      () => new Date('2026-10-04T10:00:00.000Z'),
    )

    await add.execute('es', 'Árbol')
    await add.execute('gl', 'Ola')

    expect(await new ListWordFilters(repository).execute('es')).toEqual([
      {
        language: 'es',
        displayWord: 'Árbol',
        normalizedWord: 'arbol',
        createdAt: '2026-10-04T10:00:00.000Z',
      },
    ])
    await new RemoveWordFilter(repository).execute('es', 'ÁRBOL')
    expect(await new ListWordFilters(repository).execute('es')).toEqual([])
    expect(await new ListWordFilters(repository).execute()).toHaveLength(1)
  })

  it('detecta tokens completos sólo en los idiomas activos', () => {
    const item = createAtomicSemordnilap(
      'frase',
      'un árbol alto',
      'unarbolalto',
      'otla erobra ahnu',
      'otlaerobraahnu',
    )
    expect(
      semordnilapMatchesWordFilters(
        item,
        new Map([['es', new Set(['arbol'])]]),
      ),
    ).toBe(true)
    expect(
      semordnilapMatchesWordFilters(item, new Map([['es', new Set(['ar'])]])),
    ).toBe(false)
    expect(
      semordnilapMatchesWordFilters(
        item,
        new Map([['gl', new Set(['arbol'])]]),
      ),
    ).toBe(false)
  })

  it('aplica la misma regla a expresiones de composites', () => {
    const composite: Semordnilap = {
      kind: 'composite',
      id: 'composite:test:uno',
      datasetId: testDataset.id,
      components: [],
      atomicComponents: [],
      source: { language: 'es', text: 'no se', normalized: 'nose' },
      target: { language: 'gl', text: 'e son', normalized: 'eson' },
      createdAt: '2026-10-04T10:00:00.000Z',
      updatedAt: '2026-10-04T10:00:00.000Z',
    }
    expect(
      semordnilapMatchesWordFilters(
        composite,
        new Map([['es', new Set(['se'])]]),
      ),
    ).toBe(true)
  })
})
