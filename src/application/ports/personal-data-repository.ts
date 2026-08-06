import type { PersonalDataSnapshot } from '@/application/dto/personal-data'
import type { DatasetId, SemordnilapId } from '@/domain/semordnilap'

export type CompositeDeletionPlan = {
  found: boolean
  rootId: SemordnilapId
  directDependentIds: readonly SemordnilapId[]
  dependentIds: readonly SemordnilapId[]
  dependentDraftDatasetIds: readonly DatasetId[]
}

export interface PersonalDataRepository {
  readAll(): Promise<PersonalDataSnapshot>
  replaceAll(snapshot: PersonalDataSnapshot): Promise<void>
  updateCompositeTitle(
    id: SemordnilapId,
    title: string | undefined,
    updatedAt: string,
  ): Promise<boolean>
  inspectCompositeDeletion(id: SemordnilapId): Promise<CompositeDeletionPlan>
  deleteCompositePlan(plan: CompositeDeletionPlan): Promise<void>
}
