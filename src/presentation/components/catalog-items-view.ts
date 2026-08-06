import type {
  CatalogViewMode,
  SemordnilapCatalogItem,
  SemordnilapCatalogStatus,
} from '@/application'
import type { SemordnilapId } from '@/domain/semordnilap'

import { scoreCatalogMatch } from './catalog-search'
import type {
  CatalogSide,
  CatalogSort,
  CatalogSortCriterion,
  CatalogSortField,
} from './catalog-view'

type SelectCatalogItemsOptions = {
  items: readonly SemordnilapCatalogItem[]
  viewMode: CatalogViewMode
  sourceQuery: string
  targetQuery: string
  sort: CatalogSort
  sourceLanguageCode: string
  targetLanguageCode: string
  hasStatus: (
    semordnilapId: SemordnilapId,
    status: SemordnilapCatalogStatus,
  ) => boolean
}

export function cycleCatalogSort(
  current: CatalogSort,
  field: CatalogSortField,
  side: CatalogSide,
): CatalogSort {
  const index = current.findIndex(
    (criterion) => criterion.field === field && criterion.side === side,
  )
  if (index < 0) {
    return [...current, { field, side, direction: 'ascending' }]
  }
  const active = current[index]!
  if (active.direction === 'ascending') {
    return current.map((criterion, criterionIndex) =>
      criterionIndex === index
        ? { ...criterion, direction: 'descending' }
        : criterion,
    )
  }
  return current.filter((_, criterionIndex) => criterionIndex !== index)
}

function compareByCriterion(
  first: SemordnilapCatalogItem,
  second: SemordnilapCatalogItem,
  criterion: CatalogSortCriterion,
  collator: Intl.Collator,
): number {
  const firstExpression = first.semordnilap[criterion.side]
  const secondExpression = second.semordnilap[criterion.side]
  const comparison =
    criterion.field === 'alphabetical'
      ? collator.compare(firstExpression.text, secondExpression.text)
      : Array.from(firstExpression.normalized).length -
        Array.from(secondExpression.normalized).length
  return criterion.direction === 'descending' ? comparison * -1 : comparison
}

export function selectVisibleCatalogItems({
  items,
  viewMode,
  sourceQuery,
  targetQuery,
  sort,
  sourceLanguageCode,
  targetLanguageCode,
  hasStatus,
}: SelectCatalogItemsOptions): readonly SemordnilapCatalogItem[] {
  const collators = {
    source: new Intl.Collator(sourceLanguageCode, {
      sensitivity: 'base',
      numeric: true,
    }),
    target: new Intl.Collator(targetLanguageCode, {
      sensitivity: 'base',
      numeric: true,
    }),
  }
  const matches = items.flatMap((item, originalPosition) => {
    const discarded = hasStatus(item.semordnilap.id, 'discarded')
    const belongsToView =
      viewMode === 'discarded'
        ? discarded
        : !discarded &&
          (viewMode === 'saved'
            ? item.semordnilap.kind === 'composite'
            : viewMode === 'favorites'
              ? hasStatus(item.semordnilap.id, 'favorite')
              : true)
    if (!belongsToView) return []
    const relevance = scoreCatalogMatch(item, sourceQuery, targetQuery)
    return relevance === null ? [] : [{ item, relevance, originalPosition }]
  })

  return matches
    .toSorted((firstMatch, secondMatch) => {
      for (const criterion of sort) {
        const comparison = compareByCriterion(
          firstMatch.item,
          secondMatch.item,
          criterion,
          collators[criterion.side],
        )
        if (comparison !== 0) return comparison
      }
      if (
        sort.length === 0 &&
        (sourceQuery || targetQuery) &&
        firstMatch.relevance !== secondMatch.relevance
      ) {
        return firstMatch.relevance - secondMatch.relevance
      }
      return firstMatch.originalPosition - secondMatch.originalPosition
    })
    .map(({ item }) => item)
}
