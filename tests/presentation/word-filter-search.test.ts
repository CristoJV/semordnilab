import { describe, expect, it } from 'vitest'

import { searchVocabulary } from '@/presentation/components/word-filter-search'

const words = [
  { displayWord: 'Árbol', normalizedWord: 'arbol' },
  { displayWord: 'Alba', normalizedWord: 'alba' },
  { displayWord: 'Ella', normalizedWord: 'ella' },
  { displayWord: 'Sol', normalizedWord: 'sol' },
]

describe('búsqueda aproximada de palabras', () => {
  it('ignora acentos y prioriza prefijos sobre subsecuencias', () => {
    expect(
      searchVocabulary(words, 'arb').map((word) => word.displayWord),
    ).toEqual(['Árbol'])
    expect(
      searchVocabulary(words, 'al').map((word) => word.displayWord),
    ).toEqual(['Alba', 'Árbol'])
  })

  it('devuelve todo el espacio cuando la consulta está vacía', () => {
    expect(searchVocabulary(words, '')).toEqual(words)
  })
})
