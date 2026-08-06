import type { SemordnilapCatalogItem } from '@/application'

export type CatalogMatchRange = {
  start: number
  end: number
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es')
}

export function normalizeCatalogQuery(value: string): string {
  return normalize(value).trim()
}

function expressionRank(
  text: string,
  normalizedExpression: string,
  searchText: string,
  query: string,
): number | null {
  if (!query) return 0
  const visible = normalize(text)
  if (visible === query) return 0
  if (visible.startsWith(query)) return 1
  if (visible.includes(query)) return 2
  const normalizedValue = normalize(normalizedExpression)
  if (normalizedValue === query) return 3
  if (normalizedValue.startsWith(query)) return 4
  if (normalizedValue.includes(query)) return 5
  return searchText.includes(query) ? 6 : null
}

export function scoreCatalogMatch(
  item: SemordnilapCatalogItem,
  sourceQuery: string,
  targetQuery: string,
): number | null {
  const sourceRank = expressionRank(
    item.semordnilap.source.text,
    item.semordnilap.source.normalized,
    item.sourceSearchText,
    sourceQuery,
  )
  if (sourceRank === null) return null
  const targetRank = expressionRank(
    item.semordnilap.target.text,
    item.semordnilap.target.normalized,
    item.targetSearchText,
    targetQuery,
  )
  return targetRank === null ? null : sourceRank + targetRank
}

export function findNormalizedMatch(
  text: string,
  rawQuery: string,
): CatalogMatchRange | null {
  const query = Array.from(normalizeCatalogQuery(rawQuery))
  if (query.length === 0) return null

  const normalizedText: string[] = []
  const sourceRanges: CatalogMatchRange[] = []
  let sourceIndex = 0
  for (const character of text) {
    const start = sourceIndex
    sourceIndex += character.length
    const normalizedCharacters = normalize(character)
    if (normalizedCharacters.length === 0 && sourceRanges.length > 0) {
      sourceRanges[sourceRanges.length - 1] = {
        ...sourceRanges[sourceRanges.length - 1]!,
        end: sourceIndex,
      }
    }
    for (const normalizedCharacter of normalizedCharacters) {
      normalizedText.push(normalizedCharacter)
      sourceRanges.push({ start, end: sourceIndex })
    }
  }

  const lastStart = normalizedText.length - query.length
  for (let start = 0; start <= lastStart; start += 1) {
    if (
      query.every(
        (character, offset) => normalizedText[start + offset] === character,
      )
    ) {
      return {
        start: sourceRanges[start]!.start,
        end: sourceRanges[start + query.length - 1]!.end,
      }
    }
  }
  return null
}
