import type { SavedCompositeSemordnilapRecord } from '@/application/dto/saved-composite'
import type { SavedCompositeSemordnilapRepository } from '@/application/ports/saved-composite-semordnilap-repository'
import {
  composeSemordnilaps,
  createStableSemordnilapId,
  InvalidSemordnilapError,
  toSemordnilapReference,
  type DatasetId,
  type Semordnilap,
} from '@/domain/semordnilap'

export type SaveCompositeSemordnilapInput = {
  datasetId: DatasetId
  components: readonly Semordnilap[]
  title?: string
}

export type SaveCompositeSemordnilapResult = {
  record: SavedCompositeSemordnilapRecord
  created: boolean
}

export class SaveCompositeSemordnilap {
  private readonly repository: SavedCompositeSemordnilapRepository
  private readonly now: () => Date

  constructor(
    repository: SavedCompositeSemordnilapRepository,
    now: () => Date = () => new Date(),
  ) {
    this.repository = repository
    this.now = now
  }

  async execute(
    input: SaveCompositeSemordnilapInput,
  ): Promise<SaveCompositeSemordnilapResult> {
    if (input.components.length < 2) {
      throw new InvalidSemordnilapError(
        'Un composite guardado necesita al menos dos componentes.',
      )
    }
    if (
      input.components.some(
        (component) => component.datasetId !== input.datasetId,
      )
    ) {
      throw new InvalidSemordnilapError(
        'Todos los componentes deben pertenecer al mismo dataset.',
      )
    }
    const snapshot = composeSemordnilaps(input.components)
    if (!snapshot.isSemordnilap) {
      throw new InvalidSemordnilapError(
        'La composición no forma un semordnilap válido.',
      )
    }

    const atomicComponentIds = input.components.flatMap((component) =>
      component.kind === 'atomic'
        ? [component.id]
        : component.atomicComponents.map(({ semordnilapId }) => semordnilapId),
    )
    const id = createStableSemordnilapId(
      'composite',
      input.datasetId,
      atomicComponentIds,
    )
    const existing = await this.repository.get(id)
    if (existing) {
      if (
        existing.atomicComponentIds.join('\u001f') !==
        atomicComponentIds.join('\u001f')
      ) {
        throw new InvalidSemordnilapError(
          'Se ha detectado una colisión de identificadores de composites.',
        )
      }
      return { record: existing, created: false }
    }

    const timestamp = this.now().toISOString()
    const title = input.title?.trim()
    const record: SavedCompositeSemordnilapRecord = {
      id,
      datasetId: input.datasetId,
      components: input.components.map(toSemordnilapReference),
      atomicComponentIds,
      ...(title ? { title } : {}),
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    await this.repository.add(record)
    return { record, created: true }
  }
}
