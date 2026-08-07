import { describe, expect, it } from 'vitest'

import type { SemordnilapCatalogItem } from '@/application'
import type { CompositeSemordnilap } from '@/domain/semordnilap'
import {
  advanceDiscoverySession,
  resolveDiscoveryItems,
  shuffleCatalogItems,
} from '@/presentation/components/catalog-discovery'

import { createAtomicSemordnilap, createCatalogItem } from '../support/fixtures'

const items = Array.from({ length: 30 }, (_, index) => {
  const text = `item ${index}`
  return createCatalogItem(
    createAtomicSemordnilap(`item-${index}`, text, text, text, text),
  )
})

const ids = (selected: readonly SemordnilapCatalogItem[]) =>
  selected.map(({ semordnilap }) => semordnilap.id)

describe('descubrimiento del catálogo', () => {
  it('baraja de forma reproducible cuando se inyecta el azar', () => {
    const sequence = [0.15, 0.8, 0.35, 0.6]
    const random = () => sequence.shift() ?? 0.25
    const first = shuffleCatalogItems(items.slice(0, 5), random)
    const repeatedSequence = [0.15, 0.8, 0.35, 0.6]
    const repeated = shuffleCatalogItems(
      items.slice(0, 5),
      () => repeatedSequence.shift() ?? 0.25,
    )

    expect(ids(first)).toEqual(ids(repeated))
    expect(new Set(ids(first))).toEqual(new Set(ids(items.slice(0, 5))))
  })

  it('no repite elementos hasta agotar la bolsa', () => {
    let session = advanceDiscoverySession(items, null, () => 0.4, 9)
    const groups: string[][] = []
    for (let index = 0; index < 4; index += 1) {
      groups.push(ids(resolveDiscoveryItems(items, session)))
      session = advanceDiscoverySession(items, session, () => 0.4, 9)
    }

    const completeBag = groups.flat()
    expect(completeBag).toHaveLength(30)
    expect(new Set(completeBag)).toHaveLength(30)
    expect(groups.map((group) => group.length)).toEqual([9, 9, 9, 3])

    const reshuffled = resolveDiscoveryItems(items, session)
    expect(reshuffled).toHaveLength(9)
  })

  it('excluye composites aunque formen parte del catálogo normal', () => {
    const base = items[0]!
    const composite: CompositeSemordnilap = {
      kind: 'composite',
      id: 'composite-1',
      datasetId: base.semordnilap.datasetId,
      components: [],
      atomicComponents: [],
      source: base.semordnilap.source,
      target: base.semordnilap.target,
      createdAt: '2026-08-07T00:00:00.000Z',
      updatedAt: '2026-08-07T00:00:00.000Z',
    }
    const catalog = [
      ...items.slice(0, 3),
      { ...base, semordnilap: composite, metadata: null },
    ]
    const session = advanceDiscoverySession(catalog, null, () => 0.5, 10)

    expect(
      resolveDiscoveryItems(catalog, session).map(
        ({ semordnilap }) => semordnilap.kind,
      ),
    ).toEqual(['atomic', 'atomic', 'atomic'])
  })
})
