import type { LanguageCode } from '@/domain/semordnilap'

export type DictionaryLink = {
  label: string
  url: string
}

export function dictionaryLinksForWord(
  language: LanguageCode,
  displayWord: string,
): readonly DictionaryLink[] {
  const word = encodeURIComponent(displayWord.trim().normalize('NFC'))
  if (!word) return []
  switch (language) {
    case 'es':
      return [{ label: 'RAE (ES)', url: `https://dle.rae.es/${word}` }]
    case 'gl':
      return [
        {
          label: 'RAG (GL)',
          url: `https://academia.gal/dicionario/-/termo/${word}`,
        },
      ]
    case 'pt':
      return [
        {
          label: 'AdC (PT)',
          url: `https://dicionario.acad-ciencias.pt/pesquisa/${word}/`,
        },
      ]
    default:
      return []
  }
}
