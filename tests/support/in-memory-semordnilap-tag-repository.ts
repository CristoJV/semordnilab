import type {
  SemordnilapTag,
  SemordnilapTagAssignment,
  SemordnilapTagChange,
  SemordnilapTagRepository,
  TagId,
} from '@/application'
import type { DatasetId, SemordnilapId } from '@/domain/semordnilap'

export class InMemorySemordnilapTagRepository implements SemordnilapTagRepository {
  private readonly tags = new Map<TagId, SemordnilapTag>()
  private readonly assignments = new Map<string, SemordnilapTagAssignment>()

  async list(datasetId: DatasetId | '') {
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

  async applyAssignmentChanges(
    datasetId: DatasetId,
    semordnilapIds: readonly SemordnilapId[],
    changes: readonly SemordnilapTagChange[],
    createdAt: string,
  ): Promise<void> {
    for (const { tagId, assigned } of changes) {
      if (assigned && !this.tags.has(tagId)) {
        throw new Error('La etiqueta ya no existe.')
      }
      for (const semordnilapId of semordnilapIds) {
        const assignment = { datasetId, semordnilapId, tagId, createdAt }
        const key = this.key(assignment)
        if (assigned && !this.assignments.has(key)) {
          this.assignments.set(key, assignment)
        } else if (!assigned) {
          this.assignments.delete(key)
        }
      }
    }
  }

  private key(assignment: SemordnilapTagAssignment) {
    return `${assignment.datasetId}\u001f${assignment.semordnilapId}\u001f${assignment.tagId}`
  }
}
