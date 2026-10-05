import { describe, expect, it } from 'vitest'

import { dictionaryLinksForWord } from '@/presentation/components/dictionary-links'

describe('enlaces de diccionario', () => {
  it('conserva la grafía exacta y codifica el término en cada proveedor', () => {
    expect(dictionaryLinksForWord('es', 'Árbol')).toEqual([
      { label: 'DLE · RAE', url: 'https://dle.rae.es/%C3%81rbol' },
    ])
    expect(dictionaryLinksForWord('gl', 'pé')[0]?.url).toBe(
      'https://academia.gal/dicionario/-/termo/p%C3%A9',
    )
    expect(dictionaryLinksForWord('pt', 'árvore')).toHaveLength(2)
  })

  it('no inventa proveedores para idiomas desconocidos', () => {
    expect(dictionaryLinksForWord('xx', 'word')).toEqual([])
  })
})
