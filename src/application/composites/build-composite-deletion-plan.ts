import type { CompositionDraftRecord } from '@/application/dto/composition-draft'
import type { SavedCompositeSemordnilapRecord } from '@/application/dto/saved-composite'
import type { CompositeDeletionPlan } from '@/application/ports/personal-data-repository'
import type { SemordnilapId } from '@/domain/semordnilap'

export function buildCompositeDeletionPlan(
  records: readonly SavedCompositeSemordnilapRecord[],
  drafts: readonly CompositionDraftRecord[],
  rootId: SemordnilapId,
): CompositeDeletionPlan {
  const root = records.find(({ id }) => id === rootId)
  if (!root) {
    return {
      found: false,
      rootId,
      directDependentIds: [],
      dependentIds: [],
      dependentDraftDatasetIds: [],
    }
  }

  const dependentsByComponent = new Map<SemordnilapId, SemordnilapId[]>()
  for (const record of records) {
    for (const reference of record.components) {
      if (reference.kind !== 'composite') continue
      const dependents =
        dependentsByComponent.get(reference.semordnilapId) ?? []
      if (!dependents.includes(record.id)) dependents.push(record.id)
      dependentsByComponent.set(reference.semordnilapId, dependents)
    }
  }

  const directDependentIds = dependentsByComponent.get(rootId) ?? []
  const affected = new Set<SemordnilapId>([rootId])
  const pending = [...directDependentIds]
  const dependentIds: SemordnilapId[] = []
  while (pending.length > 0) {
    const id = pending.shift()!
    if (affected.has(id)) continue
    affected.add(id)
    dependentIds.push(id)
    pending.push(...(dependentsByComponent.get(id) ?? []))
  }

  const dependentDraftDatasetIds = drafts
    .filter((draft) =>
      draft.components.some(
        (reference) =>
          reference.kind === 'composite' &&
          affected.has(reference.semordnilapId),
      ),
    )
    .map(({ datasetId }) => datasetId)

  return {
    found: true,
    rootId,
    directDependentIds,
    dependentIds,
    dependentDraftDatasetIds,
  }
}
