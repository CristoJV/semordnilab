import type { CatalogSortDirection } from '@/application'

import type { CatalogSide, CatalogSort, CatalogSortField } from './catalog-view'

export function setCatalogSort(
  current: CatalogSort,
  field: CatalogSortField,
  side: CatalogSide,
  direction: CatalogSortDirection | null,
): CatalogSort {
  const index = current.findIndex(
    (criterion) => criterion.field === field && criterion.side === side,
  )

  if (direction === null) {
    return index < 0
      ? current
      : current.filter((_, criterionIndex) => criterionIndex !== index)
  }

  const nextCriterion = { field, side, direction }
  if (index < 0) return [...current, nextCriterion]

  return current.map((criterion, criterionIndex) =>
    criterionIndex === index ? nextCriterion : criterion,
  )
}

export function cycleCatalogSort(
  current: CatalogSort,
  field: CatalogSortField,
  side: CatalogSide,
): CatalogSort {
  const active = current.find(
    (criterion) => criterion.field === field && criterion.side === side,
  )
  if (!active) return setCatalogSort(current, field, side, 'ascending')
  if (active.direction === 'ascending') {
    return setCatalogSort(current, field, side, 'descending')
  }
  return setCatalogSort(current, field, side, null)
}
