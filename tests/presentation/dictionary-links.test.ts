import { describe, expect, it } from 'vitest'

import { dictionaryLinksForWord } from '@/presentation/components/dictionary-links'

describe('enlaces de diccionario', () => {
  it('conserva la grafía exacta y codifica el término en cada proveedor', () => {
    expect(dictionaryLinksForWord('es', 'Árbol')).toEqual([
      { label: 'RAE (ES)', url: 'https://dle.rae.es/%C3%81rbol' },
    ])
    expect(dictionaryLinksForWord('gl', 'pé')).toEqual([
      {
        label: 'RAG (GL)',
        url: 'https://academia.gal/dicionario/-/termo/p%C3%A9',
      },
    ])
    expect(dictionaryLinksForWord('pt', 'árvore')).toEqual([
      {
        label: 'AdC (PT)',
        url: 'https://dicionario.acad-ciencias.pt/pesquisa/%C3%A1rvore/',
      },
    ])
  })

  it('no inventa proveedores para idiomas desconocidos', () => {
    expect(dictionaryLinksForWord('xx', 'word')).toEqual([])
  })
})
