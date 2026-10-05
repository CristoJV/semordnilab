import { describe, expect, it } from 'vitest'

import { selectVisibleCatalogItems } from '@/presentation/components/catalog-items-view'
import type { SemordnilapCatalogStatus } from '@/application'

import { createAtomicSemordnilap, createCatalogItem } from '../support/fixtures'

const first = createCatalogItem(
  createAtomicSemordnilap('first', 'desamor', 'desamor', 'romased', 'romased'),
)
const second = createCatalogItem(
  createAtomicSemordnilap('second', 'amor', 'amor', 'roma', 'roma'),
)
const items = [first, second]

function select(
  sourceQuery: string,
  hasStatus: (id: string, status: SemordnilapCatalogStatus) => boolean = () =>
    false,
) {
  return selectVisibleCatalogItems({
    items,
    viewMode: 'active',
    sourceQuery,
    targetQuery: '',
    sort: [],
    sourceLanguageCode: 'es',
    targetLanguageCode: 'gl',
    hasStatus,
  })
}

describe('vista estable del catálogo', () => {
  it('no mueve una fila cuando cambia a favorita', () => {
    const visible = select(
      '',
      (id, status) => id === second.semordnilap.id && status === 'favorite',
    )

    expect(visible.map(({ semordnilap }) => semordnilap.id)).toEqual([
      'first',
      'second',
    ])
  })

  it('aplica la relevancia solo mientras existe una consulta', () => {
    expect(select('amor').map(({ semordnilap }) => semordnilap.id)).toEqual([
      'second',
      'first',
    ])
    expect(select('').map(({ semordnilap }) => semordnilap.id)).toEqual([
      'first',
      'second',
    ])
  })

  it('filtra por frecuencia, número de palabras y puntuación sin ocultar composites', () => {
    const lowQuality = {
      ...first,
      metadata: {
        ...first.metadata!,
        sourceFrequency: 2,
        targetFrequency: 3,
        sourceWordCount: 3,
        pairScore: 0.2,
      },
    }
    const highQuality = {
      ...second,
      metadata: {
        ...second.metadata!,
        sourceFrequency: 40,
        targetFrequency: 20,
        sourceWordCount: 1,
        pairScore: 0.9,
      },
    }

    const visible = selectVisibleCatalogItems({
      items: [lowQuality, highQuality],
      viewMode: 'active',
      sourceQuery: '',
      targetQuery: '',
      sort: [],
      sourceLanguageCode: 'es',
      targetLanguageCode: 'gl',
      hasStatus: () => false,
      qualityFilters: {
        sourceMinFrequency: 10,
        targetMinFrequency: null,
        sourceMaxWordCount: 2,
        targetMaxWordCount: null,
        minPairScore: 0.5,
      },
    })

    expect(visible.map(({ semordnilap }) => semordnilap.id)).toEqual(['second'])
  })

  it('ordena señales numéricas y deja los elementos sin metadatos al final', () => {
    const weak = {
      ...first,
      metadata: {
        ...first.metadata!,
        sourceFrequency: 2,
        sourceWordCount: 3,
        pairScore: 0.2,
      },
    }
    const strong = {
      ...second,
      metadata: {
        ...second.metadata!,
        sourceFrequency: 40,
        sourceWordCount: 1,
        pairScore: 0.9,
      },
    }
    const criteria = [
      { field: 'frequency', side: 'source', direction: 'descending' },
      { field: 'wordCount', side: 'source', direction: 'ascending' },
      { field: 'pairScore', side: 'source', direction: 'descending' },
    ] as const

    for (const criterion of criteria) {
      const visible = selectVisibleCatalogItems({
        items: [weak, strong],
        viewMode: 'active',
        sourceQuery: '',
        targetQuery: '',
        sort: [criterion],
        sourceLanguageCode: 'es',
        targetLanguageCode: 'gl',
        hasStatus: () => false,
      })

      expect(visible.map(({ semordnilap }) => semordnilap.id)).toEqual([
        'second',
        'first',
      ])
    }
  })
})
