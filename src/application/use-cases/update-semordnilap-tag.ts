import type {
  SemordnilapTag,
  TagColor,
  TagId,
} from '@/application/dto/semordnilap-tag'
import type { SemordnilapTagRepository } from '@/application/ports/semordnilap-tag-repository'
import {
  assertTagColor,
  cleanTagName,
  normalizeTagName,
} from '@/application/tags/tag-validation'

export class UpdateSemordnilapTag {
  private readonly repository: SemordnilapTagRepository
  private readonly now: () => Date

  constructor(
    repository: SemordnilapTagRepository,
    now: () => Date = () => new Date(),
  ) {
    this.repository = repository
    this.now = now
  }

  async execute(
    current: SemordnilapTag,
    input: { name: string; color: TagColor },
  ): Promise<SemordnilapTag> {
    assertTagColor(input.color)
    const name = cleanTagName(input.name)
    const normalizedName = normalizeTagName(name)
    const duplicate = await this.repository.findByNormalizedName(normalizedName)
    if (duplicate && duplicate.id !== current.id) {
      throw new Error('Ya existe una etiqueta con ese nombre.')
    }
    const updated = {
      ...current,
      name,
      normalizedName,
      color: input.color,
      updatedAt: this.now().toISOString(),
    }
    await this.repository.update(updated)
    return updated
  }
}

export class DeleteSemordnilapTag {
  private readonly repository: SemordnilapTagRepository

  constructor(repository: SemordnilapTagRepository) {
    this.repository = repository
  }

  execute(tagId: TagId): Promise<void> {
    return this.repository.delete(tagId)
  }
}
