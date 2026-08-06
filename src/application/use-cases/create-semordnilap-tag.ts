import type {
  SemordnilapTag,
  TagColor,
} from '@/application/dto/semordnilap-tag'
import type { SemordnilapTagRepository } from '@/application/ports/semordnilap-tag-repository'
import {
  assertTagColor,
  cleanTagName,
  normalizeTagName,
} from '@/application/tags/tag-validation'

export type CreateSemordnilapTagInput = {
  name: string
  color: TagColor
}

export class CreateSemordnilapTag {
  private readonly repository: SemordnilapTagRepository
  private readonly createId: () => string
  private readonly now: () => Date

  constructor(
    repository: SemordnilapTagRepository,
    createId: () => string = () => crypto.randomUUID(),
    now: () => Date = () => new Date(),
  ) {
    this.repository = repository
    this.createId = createId
    this.now = now
  }

  async execute(input: CreateSemordnilapTagInput): Promise<SemordnilapTag> {
    assertTagColor(input.color)
    const name = cleanTagName(input.name)
    const normalizedName = normalizeTagName(name)
    if (await this.repository.findByNormalizedName(normalizedName)) {
      throw new Error('Ya existe una etiqueta con ese nombre.')
    }
    const timestamp = this.now().toISOString()
    const tag: SemordnilapTag = {
      id: `tag:${this.createId()}`,
      name,
      normalizedName,
      color: input.color,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    await this.repository.add(tag)
    return tag
  }
}
