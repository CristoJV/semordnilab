import type {
  SemordnilapTag,
  SemordnilapTagAssignment,
  SemordnilapTagRepository,
  TagId,
} from '@/application'
import type { DatasetId, SemordnilapId } from '@/domain/semordnilap'

export class InMemorySemordnilapTagRepository implements SemordnilapTagRepository {
  private readonly tags = new Map<TagId, SemordnilapTag>()
  private readonly assignments = new Map<string, SemordnilapTagAssignment>()

  async list(datasetId: DatasetId) {
    return {
      tags: [...this.tags.values()],
      assignments: [...this.assignments.values()].filter(
        (assignment) => assignment.datasetId === datasetId,
      ),
    }
  }

  async findByNormalizedName(name: string) {
    return [...this.tags.values()].find(
      ({ normalizedName }) => normalizedName === name,
    )
  }

  async add(tag: SemordnilapTag): Promise<void> {
    this.tags.set(tag.id, tag)
  }

  async update(tag: SemordnilapTag): Promise<void> {
    this.tags.set(tag.id, tag)
  }

  async delete(tagId: TagId): Promise<void> {
    this.tags.delete(tagId)
    for (const [key, assignment] of this.assignments) {
      if (assignment.tagId === tagId) this.assignments.delete(key)
    }
  }

  async addAssignments(
    assignments: readonly SemordnilapTagAssignment[],
  ): Promise<void> {
    for (const assignment of assignments) {
      this.assignments.set(this.key(assignment), assignment)
    }
  }

  async removeAssignments(
    datasetId: DatasetId,
    semordnilapIds: readonly SemordnilapId[],
    tagId: TagId,
  ): Promise<void> {
    for (const semordnilapId of semordnilapIds) {
      this.assignments.delete(
        this.key({ datasetId, semordnilapId, tagId, createdAt: '' }),
      )
    }
  }

  private key(assignment: SemordnilapTagAssignment) {
    return `${assignment.datasetId}\u001f${assignment.semordnilapId}\u001f${assignment.tagId}`
  }
}
