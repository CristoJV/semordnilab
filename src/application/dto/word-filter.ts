import type { LanguageCode } from '@/domain/semordnilap'

export type WordFilterRecord = {
  language: LanguageCode
  normalizedWord: string
  displayWord: string
  createdAt: string
}

export type VocabularyWord = {
  normalizedWord: string
  displayWord: string
}
