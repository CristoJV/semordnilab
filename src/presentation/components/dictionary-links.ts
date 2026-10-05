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
      return [{ label: 'DLE · RAE', url: `https://dle.rae.es/${word}` }]
    case 'gl':
      return [
        {
          label: 'Dicionario · RAG',
          url: `https://academia.gal/dicionario/-/termo/${word}`,
        },
      ]
    case 'pt':
      return [
        {
          label: 'Academia das Ciências',
          url: `https://dicionario.acad-ciencias.pt/pesquisa/${word}/`,
        },
        {
          label: 'Priberam',
          url: `https://dicionario.priberam.org/${word}`,
        },
      ]
    default:
      return []
  }
}
