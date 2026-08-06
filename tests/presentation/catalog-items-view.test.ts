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
})
