import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type {
  DatasetCatalogViewPreference,
  LoadWorkspacePreferences,
  SaveWorkspacePreferences,
  WorkspacePreferencesRecord,
} from '@/application'
import { DEFAULT_WORKSPACE_PREFERENCES } from '@/application'
import type { DatasetId } from '@/domain/semordnilap'

type PreferenceUseCases = {
  loadWorkspacePreferences: LoadWorkspacePreferences
  saveWorkspacePreferences: SaveWorkspacePreferences
}

export type WorkspacePreferencesState = {
  ready: boolean
  viewRevision: number
  preferences: WorkspacePreferencesRecord
  errorMessage: string | null
  catalogView: (
    datasetId: DatasetId,
  ) => DatasetCatalogViewPreference | undefined
  saveCatalogView: (view: DatasetCatalogViewPreference) => void
  activeWordFilterLanguages: (datasetId: DatasetId) => ReadonlySet<string>
  setActiveWordFilterLanguages: (
    datasetId: DatasetId,
    languages: ReadonlySet<string>,
  ) => void
  setCompositionCollapsed: (collapsed: boolean) => void
  setRememberCatalogView: (remember: boolean) => void
  setRememberCompositionCollapsed: (remember: boolean) => void
  resetViewPreferences: () => void
}

export function useWorkspacePreferences(
  useCases: PreferenceUseCases,
): WorkspacePreferencesState {
  const [preferences, setPreferences] = useState(DEFAULT_WORKSPACE_PREFERENCES)
  const [ready, setReady] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [viewRevision, setViewRevision] = useState(0)
  const skipNextSave = useRef(true)

  useEffect(() => {
    let active = true
    void useCases.loadWorkspacePreferences
      .execute()
      .then((record) => {
        if (!active) return
        skipNextSave.current = true
        setPreferences(record)
        setErrorMessage(null)
        setReady(true)
      })
      .catch((error: unknown) => {
        if (!active) return
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'No se han podido cargar las preferencias.',
        )
        setReady(true)
      })
    return () => {
      active = false
    }
  }, [useCases.loadWorkspacePreferences])

  useEffect(() => {
    if (!ready) return undefined
    if (skipNextSave.current) {
      skipNextSave.current = false
      return undefined
    }
    const timeout = window.setTimeout(() => {
      void useCases.saveWorkspacePreferences
        .execute({ ...preferences, updatedAt: new Date().toISOString() })
        .then(() => setErrorMessage(null))
        .catch((error: unknown) =>
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'No se han podido guardar las preferencias.',
          ),
        )
    }, 180)
    return () => window.clearTimeout(timeout)
  }, [preferences, ready, useCases.saveWorkspacePreferences])

  const catalogViews = useMemo(
    () =>
      new Map(preferences.catalogViews.map((view) => [view.datasetId, view])),
    [preferences.catalogViews],
  )
  const catalogView = useCallback(
    (datasetId: DatasetId) => catalogViews.get(datasetId),
    [catalogViews],
  )
  const activeWordFilterLanguages = useCallback(
    (datasetId: DatasetId) =>
      new Set(
        preferences.activeWordFilterLanguages?.find(
          (entry) => entry.datasetId === datasetId,
        )?.languages ?? [],
      ),
    [preferences.activeWordFilterLanguages],
  )
  const setActiveWordFilterLanguages = useCallback(
    (datasetId: DatasetId, languages: ReadonlySet<string>) => {
      setPreferences((current) => ({
        ...current,
        activeWordFilterLanguages: [
          ...(current.activeWordFilterLanguages ?? []).filter(
            (entry) => entry.datasetId !== datasetId,
          ),
          { datasetId, languages: [...languages].sort() },
        ],
      }))
    },
    [],
  )
  const saveCatalogView = useCallback((view: DatasetCatalogViewPreference) => {
    setPreferences((current) => {
      if (!current.rememberCatalogView) return current
      const catalogViews = current.catalogViews.filter(
        ({ datasetId }) => datasetId !== view.datasetId,
      )
      return { ...current, catalogViews: [...catalogViews, view] }
    })
  }, [])
  const setCompositionCollapsed = useCallback((collapsed: boolean) => {
    setPreferences((current) =>
      current.rememberCompositionCollapsed
        ? { ...current, compositionCollapsed: collapsed }
        : current,
    )
  }, [])
  const setRememberCatalogView = useCallback((remember: boolean) => {
    setPreferences((current) => ({
      ...current,
      rememberCatalogView: remember,
      catalogViews: remember ? current.catalogViews : [],
    }))
  }, [])
  const setRememberCompositionCollapsed = useCallback((remember: boolean) => {
    setPreferences((current) => ({
      ...current,
      rememberCompositionCollapsed: remember,
      compositionCollapsed: remember ? current.compositionCollapsed : false,
    }))
  }, [])
  const resetViewPreferences = useCallback(() => {
    setPreferences((current) => ({
      ...current,
      catalogViews: [],
      compositionCollapsed: false,
    }))
    setViewRevision((current) => current + 1)
  }, [])

  return {
    ready,
    viewRevision,
    preferences,
    errorMessage,
    catalogView,
    saveCatalogView,
    activeWordFilterLanguages,
    setActiveWordFilterLanguages,
    setCompositionCollapsed,
    setRememberCatalogView,
    setRememberCompositionCollapsed,
    resetViewPreferences,
  }
}
