import { useCallback, useEffect, useMemo, useState } from 'react'

import type {
  AddSemordnilapTagAssignments,
  ApplySemordnilapTagChanges,
  CreateSemordnilapTag,
  DeleteSemordnilapTag,
  ListSemordnilapTags,
  RemoveSemordnilapTagAssignments,
  SemordnilapTag,
  SemordnilapTagChange,
  TagColor,
  TagIcon,
  TagId,
  UpdateSemordnilapTag,
} from '@/application'
import type { DatasetId, SemordnilapId } from '@/domain/semordnilap'

type TagUseCases = {
  listSemordnilapTags: ListSemordnilapTags
  createSemordnilapTag: CreateSemordnilapTag
  updateSemordnilapTag: UpdateSemordnilapTag
  deleteSemordnilapTag: DeleteSemordnilapTag
  addSemordnilapTagAssignments: AddSemordnilapTagAssignments
  applySemordnilapTagChanges: ApplySemordnilapTagChanges
  removeSemordnilapTagAssignments: RemoveSemordnilapTagAssignments
}

export type SemordnilapTagState = {
  tags: readonly SemordnilapTag[]
  assignments: ReadonlyMap<SemordnilapId, ReadonlySet<TagId>>
  ready: boolean
  errorMessage: string | null
  refresh: () => void
  create: (name: string, color: TagColor, icon: TagIcon) => Promise<void>
  update: (
    tag: SemordnilapTag,
    name: string,
    color: TagColor,
    icon: TagIcon,
  ) => Promise<void>
  remove: (tagId: TagId) => Promise<void>
  addTo: (
    semordnilapIds: readonly SemordnilapId[],
    tagId: TagId,
  ) => Promise<void>
  removeFrom: (
    semordnilapIds: readonly SemordnilapId[],
    tagId: TagId,
  ) => Promise<void>
  applyTo: (
    semordnilapIds: readonly SemordnilapId[],
    changes: readonly SemordnilapTagChange[],
  ) => Promise<void>
}

export function useSemordnilapTags(
  datasetId: DatasetId | '',
  useCases: TagUseCases,
): SemordnilapTagState {
  const [tags, setTags] = useState<readonly SemordnilapTag[]>([])
  const [rawAssignments, setRawAssignments] = useState<
    readonly { semordnilapId: SemordnilapId; tagId: TagId }[]
  >([])
  const [loadedDatasetId, setLoadedDatasetId] = useState<DatasetId | ''>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true
    void useCases.listSemordnilapTags
      .execute(datasetId)
      .then((collection) => {
        if (!active) return
        setTags(collection.tags)
        setRawAssignments(collection.assignments)
        setLoadedDatasetId(datasetId)
        setErrorMessage(null)
      })
      .catch((error: unknown) => {
        if (!active) return
        setTags([])
        setRawAssignments([])
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'No se han podido cargar las etiquetas.',
        )
        setLoadedDatasetId(datasetId)
      })
    return () => {
      active = false
    }
  }, [datasetId, revision, useCases.listSemordnilapTags])

  const assignments = useMemo(() => {
    const result = new Map<SemordnilapId, Set<TagId>>()
    for (const assignment of rawAssignments) {
      const ids = result.get(assignment.semordnilapId) ?? new Set<TagId>()
      ids.add(assignment.tagId)
      result.set(assignment.semordnilapId, ids)
    }
    return result
  }, [rawAssignments])

  const reload = useCallback(() => setRevision((current) => current + 1), [])
  const runAndReload = useCallback(
    async (operation: () => Promise<unknown>) => {
      try {
        await operation()
        setErrorMessage(null)
        reload()
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'No se ha podido actualizar la etiqueta.'
        setErrorMessage(message)
        throw error
      }
    },
    [reload],
  )

  return {
    tags,
    assignments,
    ready: loadedDatasetId === datasetId,
    errorMessage,
    refresh: reload,
    create: (name, color, icon) =>
      runAndReload(() =>
        useCases.createSemordnilapTag.execute({ name, color, icon }),
      ),
    update: (tag, name, color, icon) =>
      runAndReload(() =>
        useCases.updateSemordnilapTag.execute(tag, { name, color, icon }),
      ),
    remove: (tagId) =>
      runAndReload(() => useCases.deleteSemordnilapTag.execute(tagId)),
    addTo: (ids, tagId) => {
      if (!datasetId) return Promise.reject(new Error('No hay un dataset.'))
      return runAndReload(() =>
        useCases.addSemordnilapTagAssignments.execute(datasetId, ids, tagId),
      )
    },
    removeFrom: (ids, tagId) => {
      if (!datasetId) return Promise.reject(new Error('No hay un dataset.'))
      return runAndReload(() =>
        useCases.removeSemordnilapTagAssignments.execute(datasetId, ids, tagId),
      )
    },
    applyTo: (ids, changes) => {
      if (!datasetId) return Promise.reject(new Error('No hay un dataset.'))
      return runAndReload(() =>
        useCases.applySemordnilapTagChanges.execute(datasetId, ids, changes),
      )
    },
  }
}
