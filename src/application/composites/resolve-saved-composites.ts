import type { SavedCompositeSemordnilapRecord } from '@/application/dto/saved-composite'
import {
  composeSemordnilaps,
  createStableSemordnilapId,
  InvalidSemordnilapError,
  type AtomicSemordnilap,
  type AtomicSemordnilapReference,
  type CompositeSemordnilap,
  type Semordnilap,
  type SemordnilapId,
  type SemordnilapReference,
} from '@/domain/semordnilap'

function sameIds(
  first: readonly SemordnilapId[],
  second: readonly SemordnilapId[],
): boolean {
  return (
    first.length === second.length &&
    first.every((value, index) => value === second[index])
  )
}

export function resolveSavedComposites(
  records: readonly SavedCompositeSemordnilapRecord[],
  atomics: readonly AtomicSemordnilap[],
): readonly CompositeSemordnilap[] {
  const atomicById = new Map(atomics.map((atomic) => [atomic.id, atomic]))
  const recordById = new Map(records.map((record) => [record.id, record]))
  const resolved = new Map<SemordnilapId, CompositeSemordnilap>()
  const resolving = new Set<SemordnilapId>()

  const resolveReference = (reference: SemordnilapReference): Semordnilap => {
    if (reference.kind === 'atomic') {
      const atomic = atomicById.get(reference.semordnilapId)
      if (!atomic || atomic.datasetId !== reference.datasetId) {
        throw new InvalidSemordnilapError(
          `No se encuentra el semordnilap atómico ${reference.semordnilapId}.`,
        )
      }
      return atomic
    }
    return resolveRecord(reference.semordnilapId)
  }

  const resolveRecord = (id: SemordnilapId): CompositeSemordnilap => {
    const cached = resolved.get(id)
    if (cached) return cached
    if (resolving.has(id)) {
      throw new InvalidSemordnilapError(
        'La colección de composites contiene una referencia circular.',
      )
    }

    const record = recordById.get(id)
    if (!record) {
      throw new InvalidSemordnilapError(`No se encuentra el composite ${id}.`)
    }
    resolving.add(id)
    const components = record.components.map(resolveReference)
    const snapshot = composeSemordnilaps(components)
    const atomicComponents: AtomicSemordnilapReference[] = components.flatMap(
      (component) =>
        component.kind === 'atomic'
          ? [
              {
                kind: 'atomic' as const,
                datasetId: component.datasetId,
                semordnilapId: component.id,
              },
            ]
          : component.atomicComponents,
    )
    const expectedId = createStableSemordnilapId(
      'composite',
      record.datasetId,
      atomicComponents.map(({ semordnilapId }) => semordnilapId),
    )
    if (
      !snapshot.isComposite ||
      !snapshot.isSemordnilap ||
      expectedId !== record.id ||
      record.components.some(
        (reference) => reference.datasetId !== record.datasetId,
      ) ||
      !sameIds(
        atomicComponents.map(({ semordnilapId }) => semordnilapId),
        record.atomicComponentIds,
      )
    ) {
      throw new InvalidSemordnilapError(
        `El composite ${id} no supera la comprobación de integridad.`,
      )
    }

    const first = components[0]
    if (!first) {
      throw new InvalidSemordnilapError('Un composite no puede estar vacío.')
    }
    const composite: CompositeSemordnilap = {
      kind: 'composite',
      id: record.id,
      datasetId: record.datasetId,
      components: record.components,
      atomicComponents,
      source: {
        language: first.source.language,
        text: snapshot.sourceText,
        normalized: snapshot.sourceNormalized,
      },
      target: {
        language: first.target.language,
        text: snapshot.targetText,
        normalized: snapshot.targetNormalized,
      },
      ...(record.title ? { title: record.title } : {}),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
    resolving.delete(id)
    resolved.set(id, composite)
    return composite
  }

  return records.map(({ id }) => resolveRecord(id))
}
