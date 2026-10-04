import type { WordFilterRecord, WordFilterRepository } from '@/application'
import type { LanguageCode } from '@/domain/semordnilap'

export class InMemoryWordFilterRepository implements WordFilterRepository {
  private records: WordFilterRecord[]

  constructor(records: readonly WordFilterRecord[] = []) {
    this.records = [...records]
  }

  async list(language?: LanguageCode) {
    return language
      ? this.records.filter((record) => record.language === language)
      : [...this.records]
  }

  async put(record: WordFilterRecord): Promise<void> {
    this.records = this.records.filter(
      (candidate) =>
        candidate.language !== record.language ||
        candidate.normalizedWord !== record.normalizedWord,
    )
    this.records.push(record)
  }

  async remove(language: LanguageCode, normalizedWord: string): Promise<void> {
    this.records = this.records.filter(
      (record) =>
        record.language !== language ||
        record.normalizedWord !== normalizedWord,
    )
  }
}
