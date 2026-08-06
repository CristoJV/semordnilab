import type { PersonalDataSnapshot } from '@/application/dto/personal-data'
import type { SemordnilapId } from '@/domain/semordnilap'

export type CompositeDeletionResult = {
  found: boolean
  removed: boolean
  dependentComposites: number
  dependentDrafts: number
}

export interface PersonalDataRepository {
  readAll(): Promise<PersonalDataSnapshot>
  replaceAll(snapshot: PersonalDataSnapshot): Promise<void>
  updateCompositeTitle(
    id: SemordnilapId,
    title: string | undefined,
    updatedAt: string,
  ): Promise<boolean>
  deleteCompositeIfUnreferenced(
    id: SemordnilapId,
  ): Promise<CompositeDeletionResult>
}
