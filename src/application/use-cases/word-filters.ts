import type { WordFilterRepository } from '@/application/ports/word-filter-repository'
import { normalizeWordFilterKey } from '@/application/word-filters/word-filter-policy'
import type { LanguageCode } from '@/domain/semordnilap'

export class ListWordFilters {
  private readonly repository: WordFilterRepository

  constructor(repository: WordFilterRepository) {
    this.repository = repository
  }

  async execute(language?: LanguageCode) {
    return this.repository.list(language)
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
    const normalizedWord = normalizeWordFilterKey(displayWord)
    if (!language.trim() || !normalizedWord) {
      throw new Error('El idioma y la palabra son obligatorios.')
    }
    await this.repository.put({
      language,
      normalizedWord,
      displayWord: displayWord.trim(),
      createdAt: this.now().toISOString(),
    })
  }
}

export class RemoveWordFilter {
  private readonly repository: WordFilterRepository

  constructor(repository: WordFilterRepository) {
    this.repository = repository
  }

  async execute(language: LanguageCode, word: string): Promise<void> {
    const normalizedWord = normalizeWordFilterKey(word)
    if (!normalizedWord) return
    await this.repository.remove(language, normalizedWord)
  }
}
