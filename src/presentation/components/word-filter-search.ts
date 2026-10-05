import type { VocabularyWord } from '@/application'
import { normalizeWordSearchKey } from '@/application'

function subsequenceSpan(value: string, query: string): number | null {
  let queryIndex = 0
  let firstIndex = -1
  for (let valueIndex = 0; valueIndex < value.length; valueIndex += 1) {
    if (value[valueIndex] !== query[queryIndex]) continue
    if (firstIndex < 0) firstIndex = valueIndex
    queryIndex += 1
    if (queryIndex === query.length) return valueIndex - firstIndex + 1
  }
  return null
}

export function searchVocabulary<T extends VocabularyWord>(
  words: readonly T[],
  rawQuery: string,
): readonly T[] {
  const query = normalizeWordSearchKey(rawQuery)
  if (!query) return words

  return words
    .map((word, index) => {
      const value = normalizeWordSearchKey(word.displayWord)
      const substringIndex = value.indexOf(query)
      const span = subsequenceSpan(value, query)
      if (span === null) return null
      const category =
        value === query
          ? 0
          : value.startsWith(query)
            ? 1
            : substringIndex >= 0
              ? 2
              : 3
      return { word, index, category, span }
    })
    .filter((match): match is NonNullable<typeof match> => match !== null)
    .sort(
      (left, right) =>
        left.category - right.category ||
        left.span - right.span ||
        left.word.normalizedWord.length - right.word.normalizedWord.length ||
        left.index - right.index,
    )
    .map(({ word }) => word)
}
