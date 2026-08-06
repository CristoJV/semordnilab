import type {
  SemordnilapTag,
  SemordnilapTagAssignment,
  SemordnilapTagCollection,
  SemordnilapTagChange,
  TagId,
} from '@/application/dto/semordnilap-tag'
import type { DatasetId, SemordnilapId } from '@/domain/semordnilap'

export interface SemordnilapTagRepository {
  list(datasetId: DatasetId | ''): Promise<SemordnilapTagCollection>
  findByNormalizedName(name: string): Promise<SemordnilapTag | undefined>
  add(tag: SemordnilapTag): Promise<void>
  update(tag: SemordnilapTag): Promise<void>
  delete(tagId: TagId): Promise<void>
  addAssignments(
    assignments: readonly SemordnilapTagAssignment[],
  ): Promise<void>
  removeAssignments(
    datasetId: DatasetId,
    semordnilapIds: readonly SemordnilapId[],
    tagId: TagId,
  ): Promise<void>
  applyAssignmentChanges(
    datasetId: DatasetId,
    semordnilapIds: readonly SemordnilapId[],
    changes: readonly SemordnilapTagChange[],
    createdAt: string,
  ): Promise<void>
}
