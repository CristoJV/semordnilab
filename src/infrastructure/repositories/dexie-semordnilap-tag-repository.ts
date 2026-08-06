import type {
  SemordnilapTag,
  SemordnilapTagAssignment,
  SemordnilapTagRepository,
  TagId,
} from '@/application'
import type { DatasetId, SemordnilapId } from '@/domain/semordnilap'
import type { SemordnilabDatabase } from '@/infrastructure/database'

export class DexieSemordnilapTagRepository implements SemordnilapTagRepository {
  private readonly database: SemordnilabDatabase

  constructor(database: SemordnilabDatabase) {
    this.database = database
  }

  async list(datasetId: DatasetId) {
    const [tags, assignments] = await Promise.all([
      this.database.tags.orderBy('createdAt').toArray(),
      this.database.semordnilapTags
        .where('datasetId')
        .equals(datasetId)
        .toArray(),
    ])
    return { tags, assignments }
  }

  findByNormalizedName(name: string) {
    return this.database.tags.where('normalizedName').equals(name).first()
  }

  async add(tag: SemordnilapTag): Promise<void> {
    await this.database.tags.add(tag)
  }

  async update(tag: SemordnilapTag): Promise<void> {
    await this.database.transaction('rw', this.database.tags, async () => {
      if (!(await this.database.tags.get(tag.id))) {
        throw new Error('La etiqueta ya no existe.')
      }
      await this.database.tags.put(tag)
    })
  }

  async delete(tagId: TagId): Promise<void> {
    await this.database.transaction(
      'rw',
      [this.database.tags, this.database.semordnilapTags],
      async () => {
        await Promise.all([
          this.database.tags.delete(tagId),
          this.database.semordnilapTags.where('tagId').equals(tagId).delete(),
        ])
      },
    )
  }

  async addAssignments(
    assignments: readonly SemordnilapTagAssignment[],
  ): Promise<void> {
    if (assignments.length === 0) return
    await this.database.transaction(
      'rw',
      [this.database.tags, this.database.semordnilapTags],
      async () => {
        const tagIds = [...new Set(assignments.map(({ tagId }) => tagId))]
        const tags = await this.database.tags.bulkGet(tagIds)
        if (tags.some((tag) => !tag)) {
          throw new Error('Alguna de las etiquetas ya no existe.')
        }
        await this.database.semordnilapTags.bulkPut([...assignments])
      },
    )
  }

  async removeAssignments(
    datasetId: DatasetId,
    semordnilapIds: readonly SemordnilapId[],
    tagId: TagId,
  ): Promise<void> {
    await this.database.semordnilapTags.bulkDelete(
      semordnilapIds.map((semordnilapId) => [datasetId, semordnilapId, tagId]),
    )
  }
}
