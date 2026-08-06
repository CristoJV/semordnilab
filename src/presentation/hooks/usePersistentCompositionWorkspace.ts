import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type {
  ClearCompositionDraft,
  LoadCompositionDraft,
  SaveCompositionDraft,
} from '@/application'
import {
  toSemordnilapReference,
  type DatasetId,
  type Semordnilap,
} from '@/domain/semordnilap'

import {
  useCompositionWorkspace,
  type CompositionWorkspaceState,
} from './useCompositionWorkspace'

type DraftUseCases = {
  loadCompositionDraft: LoadCompositionDraft
  saveCompositionDraft: SaveCompositionDraft
  clearCompositionDraft: ClearCompositionDraft
}

export type PersistentCompositionWorkspaceState = CompositionWorkspaceState & {
  ready: boolean
  persistenceError: string | null
  discardIncompatibleDraft: () => Promise<void>
}

export function usePersistentCompositionWorkspace(
  datasetId: DatasetId | '',
  availableSemordnilaps: readonly Semordnilap[],
  libraryReady: boolean,
  useCases: DraftUseCases,
): PersistentCompositionWorkspaceState {
  const workspace = useCompositionWorkspace()
  const restoreWorkspace = workspace.restore
  const [hydratedDatasetId, setHydratedDatasetId] = useState<DatasetId | ''>('')
  const [persistenceError, setPersistenceError] = useState<string | null>(null)
  const latestDraft = useRef({
    datasetId,
    components: workspace.components,
    insertionIndex: workspace.insertionIndex,
  })
  const semordnilapById = useMemo(
    () =>
      new Map(
        availableSemordnilaps.map((semordnilap) => [
          `${semordnilap.kind}:${semordnilap.id}`,
          semordnilap,
        ]),
      ),
    [availableSemordnilaps],
  )

  useEffect(() => {
    latestDraft.current = {
      datasetId: hydratedDatasetId,
      components: workspace.components,
      insertionIndex: workspace.insertionIndex,
    }
  }, [hydratedDatasetId, workspace.components, workspace.insertionIndex])

  useEffect(() => {
    if (!datasetId || !libraryReady || hydratedDatasetId === datasetId) return
    let active = true
    void useCases.loadCompositionDraft
      .execute(datasetId)
      .then((draft) => {
        if (!active) return
        const semordnilaps = (draft?.components ?? []).map((reference) => {
          const semordnilap = semordnilapById.get(
            `${reference.kind}:${reference.semordnilapId}`,
          )
          if (!semordnilap) {
            throw new Error(
              'El borrador contiene una referencia que ya no está disponible.',
            )
          }
          return semordnilap
        })
        restoreWorkspace(semordnilaps, draft?.insertionIndex ?? 0)
        setHydratedDatasetId(datasetId)
        setPersistenceError(null)
      })
      .catch((error: unknown) => {
        if (!active) return
        setPersistenceError(
          error instanceof Error
            ? error.message
            : 'No se ha podido recuperar el borrador.',
        )
      })
    return () => {
      active = false
    }
  }, [
    datasetId,
    hydratedDatasetId,
    libraryReady,
    semordnilapById,
    useCases.loadCompositionDraft,
    restoreWorkspace,
  ])

  const discardIncompatibleDraft = useCallback(async () => {
    if (!datasetId) return
    await useCases.clearCompositionDraft.execute(datasetId)
    restoreWorkspace([], 0)
    setHydratedDatasetId(datasetId)
    setPersistenceError(null)
  }, [datasetId, restoreWorkspace, useCases.clearCompositionDraft])

  useEffect(() => {
    if (!datasetId || hydratedDatasetId !== datasetId) return undefined
    return () => {
      const draft = latestDraft.current
      if (draft.datasetId !== datasetId) return
      const operation =
        draft.components.length === 0
          ? useCases.clearCompositionDraft.execute(datasetId)
          : useCases.saveCompositionDraft.execute({
              datasetId,
              components: draft.components.map(({ semordnilap }) =>
                toSemordnilapReference(semordnilap),
              ),
              insertionIndex: draft.insertionIndex,
              updatedAt: new Date().toISOString(),
            })
      void operation.catch(() => undefined)
    }
  }, [
    datasetId,
    hydratedDatasetId,
    useCases.clearCompositionDraft,
    useCases.saveCompositionDraft,
  ])

  useEffect(() => {
    if (!datasetId || hydratedDatasetId !== datasetId) return undefined
    const timeout = window.setTimeout(() => {
      const operation =
        workspace.components.length === 0
          ? useCases.clearCompositionDraft.execute(datasetId)
          : useCases.saveCompositionDraft.execute({
              datasetId,
              components: workspace.components.map(({ semordnilap }) =>
                toSemordnilapReference(semordnilap),
              ),
              insertionIndex: workspace.insertionIndex,
              updatedAt: new Date().toISOString(),
            })
      void operation
        .then(() => setPersistenceError(null))
        .catch((error: unknown) =>
          setPersistenceError(
            error instanceof Error
              ? error.message
              : 'No se ha podido conservar el borrador.',
          ),
        )
    }, 180)
    return () => window.clearTimeout(timeout)
  }, [
    datasetId,
    hydratedDatasetId,
    useCases.clearCompositionDraft,
    useCases.saveCompositionDraft,
    workspace.components,
    workspace.insertionIndex,
  ])

  return {
    ...workspace,
    ready: Boolean(datasetId && hydratedDatasetId === datasetId),
    persistenceError,
    discardIncompatibleDraft,
  }
}
