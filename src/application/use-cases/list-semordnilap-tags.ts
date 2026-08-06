import type { SemordnilapTagRepository } from '@/application/ports/semordnilap-tag-repository'
import type { DatasetId } from '@/domain/semordnilap'

export class ListSemordnilapTags {
  private readonly repository: SemordnilapTagRepository

  constructor(repository: SemordnilapTagRepository) {
    this.repository = repository
  }

  execute(datasetId: DatasetId | '') {
    return this.repository.list(datasetId)
  }
}
