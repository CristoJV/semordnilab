import type {
  CatalogViewMode,
  SemordnilapCatalogItem,
  SemordnilapCatalogStatus,
} from '@/application'
import type { SemordnilapId } from '@/domain/semordnilap'

import { scoreCatalogMatch } from './catalog-search'
import type { CatalogSort, CatalogSortCriterion } from './catalog-view'

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
  qualityFilters?: CatalogQualityFilters
}

export type CatalogQualityFilters = {
  sourceMinFrequency: number | null
  targetMinFrequency: number | null
  sourceMaxWordCount: number | null
  targetMaxWordCount: number | null
  minPairScore: number | null
}

export const EMPTY_CATALOG_QUALITY_FILTERS: CatalogQualityFilters = {
  sourceMinFrequency: null,
  targetMinFrequency: null,
  sourceMaxWordCount: null,
  targetMaxWordCount: null,
  minPairScore: null,
}

function numericCriterionValue(
  item: SemordnilapCatalogItem,
  criterion: CatalogSortCriterion,
): number | null {
  const metadata = item.metadata
  if (!metadata) return null
  if (criterion.field === 'pairScore') return metadata.pairScore
  if (criterion.field === 'frequency') {
    return criterion.side === 'source'
      ? metadata.sourceFrequency
      : metadata.targetFrequency
  }
  if (criterion.field === 'wordCount') {
    return criterion.side === 'source'
      ? metadata.sourceWordCount
      : metadata.targetWordCount
  }
  return null
}

function compareByCriterion(
  first: SemordnilapCatalogItem,
  second: SemordnilapCatalogItem,
  criterion: CatalogSortCriterion,
  collator: Intl.Collator,
): number {
  const firstExpression = first.semordnilap[criterion.side]
  const secondExpression = second.semordnilap[criterion.side]
  let comparison: number
  if (criterion.field === 'alphabetical') {
    comparison = collator.compare(firstExpression.text, secondExpression.text)
  } else if (criterion.field === 'length') {
    comparison =
      Array.from(firstExpression.normalized).length -
      Array.from(secondExpression.normalized).length
  } else {
    const firstValue = numericCriterionValue(first, criterion)
    const secondValue = numericCriterionValue(second, criterion)
    if (firstValue === null) return secondValue === null ? 0 : 1
    if (secondValue === null) return -1
    comparison = firstValue - secondValue
  }
  return criterion.direction === 'descending' ? comparison * -1 : comparison
}

function matchesQualityFilters(
  item: SemordnilapCatalogItem,
  filters: CatalogQualityFilters,
): boolean {
  const metadata = item.metadata
  if (!metadata) return true
  return (
    (filters.sourceMinFrequency === null ||
      metadata.sourceFrequency >= filters.sourceMinFrequency) &&
    (filters.targetMinFrequency === null ||
      metadata.targetFrequency >= filters.targetMinFrequency) &&
    (filters.sourceMaxWordCount === null ||
      metadata.sourceWordCount <= filters.sourceMaxWordCount) &&
    (filters.targetMaxWordCount === null ||
      metadata.targetWordCount <= filters.targetMaxWordCount) &&
    (filters.minPairScore === null ||
      metadata.pairScore >= filters.minPairScore)
  )
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
  qualityFilters = EMPTY_CATALOG_QUALITY_FILTERS,
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
    if (!belongsToView || !matchesQualityFilters(item, qualityFilters))
      return []
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
