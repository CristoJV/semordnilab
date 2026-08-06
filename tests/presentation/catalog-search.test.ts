import { describe, expect, it } from 'vitest'

import {
  findNormalizedMatch,
  normalizeCatalogQuery,
  scoreCatalogMatch,
} from '@/presentation/components/catalog-search'

import { createAtomicSemordnilap, createCatalogItem } from '../support/fixtures'

const exact = createCatalogItem(
  createAtomicSemordnilap('exact', 'amor', 'amor', 'roma', 'roma'),
)
const starts = createCatalogItem(
  createAtomicSemordnilap(
    'starts',
    'amor mío',
    'amormio',
    'oim roma',
    'oimroma',
  ),
)
const partial = createCatalogItem(
  createAtomicSemordnilap(
    'partial',
    'desamor',
    'desamor',
    'romased',
    'romased',
  ),
)

describe('búsqueda sencilla del catálogo', () => {
  it('normaliza mayúsculas, espacios exteriores y diacríticos', () => {
    expect(normalizeCatalogQuery('  ÁMOR  ')).toBe('amor')
  })

  it('prioriza coincidencia exacta, inicio y coincidencia parcial', () => {
    expect(scoreCatalogMatch(exact, 'amor', '')).toBeLessThan(
      scoreCatalogMatch(starts, 'amor', '')!,
    )
    expect(scoreCatalogMatch(starts, 'amor', '')).toBeLessThan(
      scoreCatalogMatch(partial, 'amor', '')!,
    )
  })

  it('mantiene la intersección de los dos idiomas', () => {
    expect(scoreCatalogMatch(exact, 'amor', 'roma')).not.toBeNull()
    expect(scoreCatalogMatch(exact, 'amor', 'otro')).toBeNull()
  })

  it('localiza el texto visible aunque tenga diacríticos', () => {
    expect(findNormalizedMatch('Mi ámbar', 'AMBA')).toEqual({
      start: 3,
      end: 7,
    })
    expect(findNormalizedMatch('a\u0301mbar', 'ámbar')).toEqual({
      start: 0,
      end: 6,
    })
  })
})
