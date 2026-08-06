import type { TagId } from '@/application/dto/semordnilap-tag'
import type { SemordnilapTagRepository } from '@/application/ports/semordnilap-tag-repository'
import type { DatasetId, SemordnilapId } from '@/domain/semordnilap'

export class AddSemordnilapTagAssignments {
  private readonly repository: SemordnilapTagRepository
  private readonly now: () => Date

  constructor(
    repository: SemordnilapTagRepository,
    now: () => Date = () => new Date(),
  ) {
    this.repository = repository
    this.now = now
  }

  execute(
    datasetId: DatasetId,
    semordnilapIds: readonly SemordnilapId[],
    tagId: TagId,
  ): Promise<void> {
    const createdAt = this.now().toISOString()
    return this.repository.addAssignments(
      [...new Set(semordnilapIds)].map((semordnilapId) => ({
        datasetId,
        semordnilapId,
        tagId,
        createdAt,
      })),
    )
  }
}

export class RemoveSemordnilapTagAssignments {
  private readonly repository: SemordnilapTagRepository

  constructor(repository: SemordnilapTagRepository) {
    this.repository = repository
  }

  execute(
    datasetId: DatasetId,
    semordnilapIds: readonly SemordnilapId[],
    tagId: TagId,
  ): Promise<void> {
    return this.repository.removeAssignments(
      datasetId,
      [...new Set(semordnilapIds)],
      tagId,
    )
  }
}
