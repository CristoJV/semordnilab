import type { WordFilterRecord } from '@/application/dto/word-filter'
import type { LanguageCode } from '@/domain/semordnilap'

export interface WordFilterRepository {
  list(language?: LanguageCode): Promise<readonly WordFilterRecord[]>
  put(record: WordFilterRecord): Promise<void>
  remove(language: LanguageCode, normalizedWord: string): Promise<void>
}
