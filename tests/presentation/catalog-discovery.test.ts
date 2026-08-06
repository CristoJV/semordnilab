import { describe, expect, it } from 'vitest'

import { selectDiscoveryItems } from '@/presentation/components/catalog-discovery'

import { createAtomicSemordnilap, createCatalogItem } from '../support/fixtures'

const items = Array.from({ length: 30 }, (_, index) => {
  const length = index % 3 === 0 ? 4 : index % 3 === 1 ? 8 : 14
  const text = String(index).padEnd(length, 'a')
  return createCatalogItem(
    createAtomicSemordnilap(`item-${index}`, text, text, text, text),
  )
})

describe('descubrimiento del catálogo', () => {
  it('limita el grupo y mantiene variedad de longitudes', () => {
    const selected = selectDiscoveryItems(items, 7, 9)
    const buckets = new Set(
      selected.map(({ semordnilap }) => {
        const length = semordnilap.source.normalized.length
        return length <= 5 ? 'short' : length <= 10 ? 'medium' : 'long'
      }),
    )

    expect(selected).toHaveLength(9)
    expect(buckets).toEqual(new Set(['short', 'medium', 'long']))
  })

  it('es estable para una semilla y cambia con la siguiente', () => {
    const first = selectDiscoveryItems(items, 3, 12).map(
      ({ semordnilap }) => semordnilap.id,
    )
    const repeated = selectDiscoveryItems(items, 3, 12).map(
      ({ semordnilap }) => semordnilap.id,
    )
    const next = selectDiscoveryItems(items, 4, 12).map(
      ({ semordnilap }) => semordnilap.id,
    )

    expect(repeated).toEqual(first)
    expect(next).not.toEqual(first)
  })
})
