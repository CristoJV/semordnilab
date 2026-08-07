import { describe, expect, it } from 'vitest'

import {
  cycleCatalogSort,
  setCatalogSort,
} from '@/presentation/components/catalog-sort'

describe('ordenación del catálogo', () => {
  it('combina criterios conservando su prioridad', () => {
    const alphabetical = setCatalogSort(
      [],
      'alphabetical',
      'source',
      'ascending',
    )
    const combined = setCatalogSort(
      alphabetical,
      'length',
      'source',
      'descending',
    )

    expect(combined).toEqual([
      {
        field: 'alphabetical',
        side: 'source',
        direction: 'ascending',
      },
      { field: 'length', side: 'source', direction: 'descending' },
    ])

    expect(
      setCatalogSort(combined, 'alphabetical', 'source', 'descending'),
    ).toEqual([
      {
        field: 'alphabetical',
        side: 'source',
        direction: 'descending',
      },
      { field: 'length', side: 'source', direction: 'descending' },
    ])
  })

  it('elimina un criterio sin alterar los demás', () => {
    const current = [
      { field: 'length', side: 'target', direction: 'ascending' },
      { field: 'alphabetical', side: 'source', direction: 'descending' },
    ] as const

    expect(setCatalogSort(current, 'length', 'target', null)).toEqual([
      { field: 'alphabetical', side: 'source', direction: 'descending' },
    ])
  })

  it('mantiene el ciclo de escritorio ascendente, descendente y apagado', () => {
    const ascending = cycleCatalogSort([], 'length', 'target')
    const descending = cycleCatalogSort(ascending, 'length', 'target')

    expect(ascending[0]?.direction).toBe('ascending')
    expect(descending[0]?.direction).toBe('descending')
    expect(cycleCatalogSort(descending, 'length', 'target')).toEqual([])
  })
})
