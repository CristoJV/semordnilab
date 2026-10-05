import type { SemordnilapCatalogItem } from '@/application/dto/semordnilap-catalog'
import type { VocabularyWord } from '@/application/dto/word-filter'
import type { LanguageCode, SemordnilapExpression } from '@/domain/semordnilap'
import type { Semordnilap } from '@/domain/semordnilap'

const WORD_PATTERN = /[\p{L}\p{M}\p{N}]+(?:['’·-][\p{L}\p{M}\p{N}]+)*/gu

export function normalizeWordFilterKey(value: string): string {
  return value.trim().normalize('NFKC').replace(/[’‘]/gu, "'").toLowerCase()
}

export function normalizeWordSearchKey(value: string): string {
  return normalizeWordFilterKey(value).normalize('NFKD').replace(/\p{M}/gu, '')
}

export function isWordFilterValue(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > 120) return false
  const matches = trimmed.match(WORD_PATTERN)
  return matches?.length === 1 && matches[0] === trimmed
}

export function expressionWords(
  expression: SemordnilapExpression,
): readonly VocabularyWord[] {
  const matches = expression.text.match(WORD_PATTERN) ?? []
  return matches
    .map((displayWord) => ({
      displayWord,
      normalizedWord: normalizeWordFilterKey(displayWord),
    }))
    .filter(({ normalizedWord }) => normalizedWord.length > 0)
}

export function extractLanguageVocabulary(
  items: readonly SemordnilapCatalogItem[],
  language: LanguageCode,
): readonly VocabularyWord[] {
  const words = new Map<string, VocabularyWord>()
  for (const { semordnilap } of items) {
    for (const expression of [semordnilap.source, semordnilap.target]) {
      if (expression.language !== language) continue
      for (const word of expressionWords(expression)) {
        if (!words.has(word.normalizedWord))
          words.set(word.normalizedWord, word)
      }
    }
  }
  return [...words.values()].sort((left, right) =>
    left.displayWord.localeCompare(right.displayWord, language, {
      sensitivity: 'base',
    }),
  )
}

export type WordImpact = {
  count: number
  examples: readonly string[]
}

export function buildLanguageWordImpact(
  items: readonly SemordnilapCatalogItem[],
  language: LanguageCode,
  exampleLimit = 4,
): ReadonlyMap<string, WordImpact> {
  const impact = new Map<string, { count: number; examples: string[] }>()
  for (const { semordnilap } of items) {
    const keys = new Set<string>()
    for (const expression of [semordnilap.source, semordnilap.target]) {
      if (expression.language !== language) continue
      for (const { normalizedWord } of expressionWords(expression)) {
        keys.add(normalizedWord)
      }
    }
    const example = `${semordnilap.source.text} ↔ ${semordnilap.target.text}`
    for (const key of keys) {
      const current = impact.get(key) ?? { count: 0, examples: [] }
      current.count += 1
      if (current.examples.length < exampleLimit) current.examples.push(example)
      impact.set(key, current)
    }
  }
  return impact
}

export function semordnilapMatchesWordFilters(
  semordnilap: Semordnilap,
  filters: ReadonlyMap<LanguageCode, ReadonlySet<string>>,
): boolean {
  return [semordnilap.source, semordnilap.target].some((expression) => {
    const words = filters.get(expression.language)
    return (
      words !== undefined &&
      expressionWords(expression).some(({ normalizedWord }) =>
        words.has(normalizedWord),
      )
    )
  })
}
