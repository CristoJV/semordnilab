import type { SemordnilapCatalogItem } from '@/application/dto/semordnilap-catalog'
import type { VocabularyWord } from '@/application/dto/word-filter'
import type { LanguageCode, SemordnilapExpression } from '@/domain/semordnilap'
import type { Semordnilap } from '@/domain/semordnilap'

const WORD_PATTERN = /[\p{L}\p{M}\p{N}]+(?:['’·-][\p{L}\p{M}\p{N}]+)*/gu

export function normalizeWordFilterKey(value: string): string {
  return value
    .trim()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[’‘]/gu, "'")
    .toLocaleLowerCase()
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
