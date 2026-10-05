import type { LanguageCode } from '@/domain/semordnilap'

export type WordReviewStatus = 'verified' | 'excluded'

export type WordFilterRecord = {
  language: LanguageCode
  normalizedWord: string
  displayWord: string
  createdAt: string
  status?: WordReviewStatus
}

export type VocabularyWord = {
  normalizedWord: string
  displayWord: string
}
