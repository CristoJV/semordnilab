import type { WordReviewStatus } from '@/application/dto/word-filter'
import type { WordFilterRepository } from '@/application/ports/word-filter-repository'
import {
  isWordFilterValue,
  normalizeWordFilterKey,
} from '@/application/word-filters/word-filter-policy'
import type { LanguageCode } from '@/domain/semordnilap'

export class ListWordFilters {
  private readonly repository: WordFilterRepository

  constructor(repository: WordFilterRepository) {
    this.repository = repository
  }

  async execute(language?: LanguageCode) {
    return (await this.repository.list(language)).filter(
      ({ status }) => status === undefined || status === 'excluded',
    )
  }
}

export class ListWordReviews {
  private readonly repository: WordFilterRepository

  constructor(repository: WordFilterRepository) {
    this.repository = repository
  }

  async execute(language?: LanguageCode) {
    return (await this.repository.list(language)).map((record) => ({
      ...record,
      status: record.status ?? ('excluded' as const),
    }))
  }
}

export class SetWordReview {
  private readonly repository: WordFilterRepository
  private readonly now: () => Date

  constructor(
    repository: WordFilterRepository,
    now: () => Date = () => new Date(),
  ) {
    this.repository = repository
    this.now = now
  }

  async execute(
    language: LanguageCode,
    displayWord: string,
    status: WordReviewStatus,
  ): Promise<void> {
    const normalizedLanguage = language.trim()
    const normalizedWord = normalizeWordFilterKey(displayWord)
    if (
      !/^[a-z]{2,3}(?:-[A-Z]{2})?$/u.test(normalizedLanguage) ||
      !normalizedWord ||
      !isWordFilterValue(displayWord)
    ) {
      throw new Error('El idioma y la palabra son obligatorios.')
    }
    await this.repository.put({
      language: normalizedLanguage,
      normalizedWord,
      displayWord: displayWord.trim().normalize('NFC'),
      status,
      createdAt: this.now().toISOString(),
    })
  }
}

export class ClearWordReview {
  private readonly repository: WordFilterRepository

  constructor(repository: WordFilterRepository) {
    this.repository = repository
  }

  async execute(language: LanguageCode, word: string): Promise<void> {
    const normalizedLanguage = language.trim()
    const normalizedWord = normalizeWordFilterKey(word)
    if (!normalizedLanguage || !normalizedWord) return
    await this.repository.remove(normalizedLanguage, normalizedWord)
  }
}

export class AddWordFilter {
  private readonly repository: WordFilterRepository
  private readonly now: () => Date

  constructor(
    repository: WordFilterRepository,
    now: () => Date = () => new Date(),
  ) {
    this.repository = repository
    this.now = now
  }

  async execute(language: LanguageCode, displayWord: string): Promise<void> {
    const normalizedLanguage = language.trim()
    const normalizedWord = normalizeWordFilterKey(displayWord)
    if (
      !/^[a-z]{2,3}(?:-[A-Z]{2})?$/u.test(normalizedLanguage) ||
      !normalizedWord ||
      !isWordFilterValue(displayWord)
    ) {
      throw new Error('El idioma y la palabra son obligatorios.')
    }
    await new SetWordReview(this.repository, this.now).execute(
      normalizedLanguage,
      displayWord,
      'excluded',
    )
  }
}

export class RemoveWordFilter {
  private readonly repository: WordFilterRepository

  constructor(repository: WordFilterRepository) {
    this.repository = repository
  }

  async execute(language: LanguageCode, word: string): Promise<void> {
    await new ClearWordReview(this.repository).execute(language, word)
  }
}
