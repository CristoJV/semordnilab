import type { WordFilterRecord, WordFilterRepository } from '@/application'
import type { LanguageCode } from '@/domain/semordnilap'
import type { SemordnilabDatabase } from '@/infrastructure/database'

export class DexieWordFilterRepository implements WordFilterRepository {
  private readonly database: SemordnilabDatabase

  constructor(database: SemordnilabDatabase) {
    this.database = database
  }

  async list(language?: LanguageCode): Promise<readonly WordFilterRecord[]> {
    const records = language
      ? await this.database.wordFilters
          .where('language')
          .equals(language)
          .toArray()
      : await this.database.wordFilters.toArray()
    let collator: Intl.Collator
    try {
      collator = new Intl.Collator(language, { sensitivity: 'base' })
    } catch {
      collator = new Intl.Collator(undefined, { sensitivity: 'base' })
    }
    return records.sort((left, right) =>
      collator.compare(left.displayWord, right.displayWord),
    )
  }

  async put(record: WordFilterRecord): Promise<void> {
    await this.database.wordFilters.put(record)
  }

  async remove(language: LanguageCode, normalizedWord: string): Promise<void> {
    await this.database.wordFilters.delete([language, normalizedWord])
  }
}
