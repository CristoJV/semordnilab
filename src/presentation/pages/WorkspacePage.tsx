import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ApplicationDependencies } from '@/app/composition/create-application-dependencies'
import { AppFooter } from '@/presentation/components/AppFooter'
import { AppHeader } from '@/presentation/components/AppHeader'
import { AppMenuDialog } from '@/presentation/components/AppMenuDialog'
import { CompositeManagerDialog } from '@/presentation/components/CompositeManagerDialog'
import { CompositionWorkspace } from '@/presentation/components/CompositionWorkspace'
import { NotificationViewport } from '@/presentation/components/NotificationViewport'
import { PairedSemordnilapCatalog } from '@/presentation/components/PairedSemordnilapCatalog'
import { usePersistentCompositionWorkspace } from '@/presentation/hooks/usePersistentCompositionWorkspace'
import { useSemordnilapCatalog } from '@/presentation/hooks/useSemordnilapCatalog'
import { useSemordnilapStatuses } from '@/presentation/hooks/useSemordnilapStatuses'
import { useSemordnilapTags } from '@/presentation/hooks/useSemordnilapTags'
import { useTransientNotifications } from '@/presentation/hooks/useTransientNotifications'
import { useSavedCompositeSemordnilaps } from '@/presentation/hooks/useSavedCompositeSemordnilaps'
import { useWorkspacePreferences } from '@/presentation/hooks/useWorkspacePreferences'
import { useWordFilters } from '@/presentation/hooks/useWordFilters'
import { semordnilapMatchesWordFilters } from '@/application'
import type { CompositeSemordnilap } from '@/domain/semordnilap'
import { TagManagerDialog } from '@/presentation/components/TagManagerDialog'
import { tagsForSemordnilap } from '@/presentation/components/tag-view'
import { DatasetPickerDialog } from '@/presentation/components/DatasetPickerDialog'
import { useResponsiveLayout } from '@/presentation/responsive/useResponsiveLayout'
import {
  WordFilterPage,
  type WordFilterMode,
} from '@/presentation/pages/WordFilterPage'
import {
  parseWorkspaceHash,
  workspaceHashFor,
  type WorkspaceRoute,
} from '@/presentation/pages/workspace-route'

import styles from './WorkspacePage.module.css'

type WorkspacePageProps = {
  dependencies: ApplicationDependencies
}

const EMPTY_CATALOG_ITEMS = [] as const

type WorkspaceUtilityOverlay =
  'app-menu' | 'dataset-picker' | 'tag-manager' | null

export function WorkspacePage({ dependencies }: WorkspacePageProps) {
  const initialRoute = useMemo(
    () => parseWorkspaceHash(window.location.hash),
    [],
  )
  const [pageView, setPageView] = useState<'workspace' | 'word-filters'>(
    initialRoute.view,
  )
  const [wordFilterMode, setWordFilterMode] = useState<WordFilterMode>(
    initialRoute.view === 'word-filters' ? initialRoute.mode : 'pending',
  )
  const reviewHistoryEntry = useRef(false)
  const [utilityOverlay, setUtilityOverlay] =
    useState<WorkspaceUtilityOverlay>(null)
  const [selectedComposite, setSelectedComposite] =
    useState<CompositeSemordnilap | null>(null)
  const [catalogSelectionRequested, setCatalogSelectionRequested] =
    useState(false)
  const { notifications, notify, dismiss } = useTransientNotifications()
  const layout = useResponsiveLayout()
  const preferences = useWorkspacePreferences(dependencies)
  const wordFilters = useWordFilters(dependencies)
  const catalog = useSemordnilapCatalog(dependencies)
  const getActiveWordFilterLanguages = preferences.activeWordFilterLanguages
  const activeWordFilterLanguages = useMemo(
    () =>
      catalog.selectedDatasetId
        ? getActiveWordFilterLanguages(catalog.selectedDatasetId)
        : new Set<string>(),
    [catalog.selectedDatasetId, getActiveWordFilterLanguages],
  )
  const statusAliases = useMemo(
    () =>
      (catalog.loadedDataset?.items ?? []).flatMap((item) =>
        item.legacyIds.map((previousId) => ({
          previousId,
          currentId: item.semordnilap.id,
        })),
      ),
    [catalog.loadedDataset],
  )
  const statusState = useSemordnilapStatuses(
    catalog.selectedDatasetId,
    dependencies,
    statusAliases,
  )
  const tagState = useSemordnilapTags(catalog.selectedDatasetId, dependencies)
  const atomicItems = catalog.loadedDataset?.items ?? EMPTY_CATALOG_ITEMS
  const savedComposites = useSavedCompositeSemordnilaps(
    catalog.selectedDatasetId,
    atomicItems,
    dependencies,
  )
  const catalogItems = useMemo(
    () => [...atomicItems, ...savedComposites.items],
    [atomicItems, savedComposites.items],
  )
  const wordFilterOptions = useMemo(() => {
    if (!catalog.loadedDataset) return []
    const byCode = new Map(
      [
        catalog.loadedDataset.dataset.sourceLanguage,
        catalog.loadedDataset.dataset.targetLanguage,
      ].map((language) => [language.code, language]),
    )
    return [...byCode.values()].map((language) => ({
      ...language,
      count: wordFilters.byLanguage.get(language.code)?.length ?? 0,
      active: activeWordFilterLanguages.has(language.code),
    }))
  }, [activeWordFilterLanguages, catalog.loadedDataset, wordFilters.byLanguage])
  const activeWordFilters = useMemo(() => {
    const filters = new Map<string, ReadonlySet<string>>()
    for (const language of activeWordFilterLanguages) {
      filters.set(
        language,
        new Set(
          (wordFilters.byLanguage.get(language) ?? []).map(
            ({ normalizedWord }) => normalizedWord,
          ),
        ),
      )
    }
    return filters
  }, [activeWordFilterLanguages, wordFilters.byLanguage])
  const filteredCatalogItems = useMemo(
    () =>
      activeWordFilters.size === 0
        ? catalogItems
        : catalogItems.filter(
            ({ semordnilap }) =>
              !semordnilapMatchesWordFilters(semordnilap, activeWordFilters),
          ),
    [activeWordFilters, catalogItems],
  )
  const library = useMemo(
    () => catalogItems.map(({ semordnilap }) => semordnilap),
    [catalogItems],
  )
  const composition = usePersistentCompositionWorkspace(
    catalog.selectedDatasetId,
    library,
    catalog.status === 'ready' && savedComposites.ready,
    dependencies,
  )
  const selectDataset = catalog.selectDataset
  const clearComposition = composition.clear
  const removeComponent = composition.remove
  const addComponent = composition.add

  const handleDatasetChange = useCallback(
    (datasetId: string) => selectDataset(datasetId),
    [selectDataset],
  )
  const startCatalogSelection = useCallback(
    () => setCatalogSelectionRequested(true),
    [],
  )
  const acknowledgeCatalogSelection = useCallback(
    () => setCatalogSelectionRequested(false),
    [],
  )

  const applyRoute = useCallback((route: WorkspaceRoute) => {
    setPageView(route.view)
    if (route.view === 'word-filters') setWordFilterMode(route.mode)
  }, [])

  useEffect(() => {
    const syncFromHistory = () => {
      const route = parseWorkspaceHash(window.location.hash)
      reviewHistoryEntry.current = route.view === 'word-filters'
      applyRoute(route)
    }
    window.addEventListener('popstate', syncFromHistory)
    window.addEventListener('hashchange', syncFromHistory)
    return () => {
      window.removeEventListener('popstate', syncFromHistory)
      window.removeEventListener('hashchange', syncFromHistory)
    }
  }, [applyRoute])

  const openWordFilters = useCallback(() => {
    const route: WorkspaceRoute = { view: 'word-filters', mode: 'pending' }
    window.history.pushState(null, '', workspaceHashFor(route))
    reviewHistoryEntry.current = true
    setUtilityOverlay(null)
    applyRoute(route)
  }, [applyRoute])

  const changeWordFilterMode = useCallback(
    (mode: WordFilterMode) => {
      const route: WorkspaceRoute = { view: 'word-filters', mode }
      window.history.replaceState(null, '', workspaceHashFor(route))
      applyRoute(route)
    },
    [applyRoute],
  )

  const backToWorkspace = useCallback(() => {
    if (reviewHistoryEntry.current) {
      reviewHistoryEntry.current = false
      window.history.back()
      applyRoute({ view: 'workspace' })
      return
    }
    const route: WorkspaceRoute = { view: 'workspace' }
    window.history.replaceState(null, '', workspaceHashFor(route))
    applyRoute(route)
  }, [applyRoute])

  const selectedCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const { semordnilap } of composition.components) {
      counts.set(semordnilap.id, (counts.get(semordnilap.id) ?? 0) + 1)
    }
    return counts
  }, [composition.components])

  const loadedDataset = catalog.loadedDataset
  const wordFilterLanguages = useMemo(() => {
    if (!loadedDataset) return []
    return [
      ...new Map(
        [
          loadedDataset.dataset.sourceLanguage,
          loadedDataset.dataset.targetLanguage,
        ].map((language) => [language.code, language]),
      ).values(),
    ]
  }, [loadedDataset])

  return (
    <div className={styles.page}>
      <AppHeader
        view={pageView}
        datasets={catalog.datasets}
        selectedDatasetId={catalog.selectedDatasetId}
        status={catalog.status}
        itemCount={catalogItems.length}
        onDatasetChange={handleDatasetChange}
        onOpenMenu={() => setUtilityOverlay('app-menu')}
        onOpenDatasetPicker={() => setUtilityOverlay('dataset-picker')}
        layout={layout}
        wordFilterTitle={
          wordFilterMode === 'pending'
            ? 'Palabras pendientes'
            : wordFilterMode === 'verified'
              ? 'Palabras verificadas'
              : 'Palabras excluidas'
        }
        canOpenWordFilters={Boolean(loadedDataset && wordFilters.ready)}
        onOpenWordFilters={openWordFilters}
        onBackToWorkspace={backToWorkspace}
      />

      {pageView === 'word-filters' && loadedDataset ? (
        <WordFilterPage
          items={atomicItems}
          languages={wordFilterLanguages}
          state={wordFilters}
          mode={wordFilterMode}
          onModeChange={changeWordFilterMode}
          dependencies={dependencies}
          onNotify={notify}
        />
      ) : (
        <main className={styles.main}>
          <CompositionWorkspace
            key={`composition:${preferences.viewRevision}`}
            dataset={loadedDataset?.dataset ?? null}
            components={composition.components}
            snapshot={composition.snapshot}
            onRemove={removeComponent}
            onMove={composition.move}
            onMoveTo={composition.moveTo}
            onRestoreRemoved={composition.restoreRemoved}
            canRestoreRemoved={(semordnilapId) =>
              library.some(({ id }) => id === semordnilapId)
            }
            insertionIndex={composition.insertionIndex}
            onSelectInsertion={composition.selectInsertion}
            onClear={clearComposition}
            canUndo={composition.canUndo}
            canRedo={composition.canRedo}
            onUndo={composition.undo}
            onRedo={composition.redo}
            persistenceError={composition.persistenceError}
            persistenceStatus={composition.persistenceStatus}
            initialCollapsed={
              preferences.preferences.rememberCompositionCollapsed &&
              preferences.preferences.compositionCollapsed
            }
            onCollapsedChange={preferences.setCompositionCollapsed}
            onDiscardIncompatibleDraft={composition.discardIncompatibleDraft}
            onSave={(title) =>
              savedComposites.save(
                composition.components.map(({ semordnilap }) => semordnilap),
                title,
              )
            }
            onNotify={notify}
          />

          <div
            className={styles.catalog}
            aria-busy={catalog.status === 'loading'}
          >
            {catalog.status === 'ready' &&
            loadedDataset &&
            savedComposites.ready &&
            composition.ready &&
            preferences.ready &&
            tagState.ready &&
            wordFilters.ready ? (
              <PairedSemordnilapCatalog
                key={`${loadedDataset.dataset.id}:${preferences.viewRevision}`}
                dataset={loadedDataset.dataset}
                items={filteredCatalogItems}
                selectedCounts={selectedCounts}
                statuses={statusState.statuses}
                statusesReady={statusState.ready}
                statusError={
                  statusState.errorMessage ??
                  savedComposites.errorMessage ??
                  wordFilters.errorMessage
                }
                tagState={tagState}
                onAdd={addComponent}
                onSetStatuses={statusState.setStatuses}
                initialView={preferences.catalogView(loadedDataset.dataset.id)}
                onViewChange={preferences.saveCatalogView}
                onOpenComposite={setSelectedComposite}
                onManageTags={() => setUtilityOverlay('tag-manager')}
                onNotify={notify}
                layout={layout}
                overlayOpen={
                  utilityOverlay !== null || selectedComposite !== null
                }
                selectionRequested={catalogSelectionRequested}
                onSelectionRequestHandled={acknowledgeCatalogSelection}
                wordFilterOptions={wordFilterOptions.map(
                  ({ code, label, count, active }) => ({
                    code,
                    label,
                    count,
                    active,
                  }),
                )}
                onToggleWordFilter={(language) => {
                  const next = new Set(activeWordFilterLanguages)
                  if (next.has(language)) next.delete(language)
                  else next.add(language)
                  preferences.setActiveWordFilterLanguages(
                    loadedDataset.dataset.id,
                    next,
                  )
                }}
                wordFilterHiddenCount={
                  catalogItems.length - filteredCatalogItems.length
                }
              />
            ) : (
              <div className={styles.catalogState}>
                {catalog.status === 'loading' && (
                  <>
                    <span className={styles.loader} aria-hidden="true" />
                    <p>Cargando y validando semordnilaps…</p>
                  </>
                )}
                {catalog.status === 'ready' && !composition.ready && (
                  <>
                    <span className={styles.loader} aria-hidden="true" />
                    <p>Recuperando tu espacio de trabajo...</p>
                  </>
                )}
                {catalog.status === 'ready' &&
                  composition.ready &&
                  (!preferences.ready ||
                    !tagState.ready ||
                    !wordFilters.ready) && (
                    <>
                      <span className={styles.loader} aria-hidden="true" />
                      <p>Recuperando tus preferencias...</p>
                    </>
                  )}
                {catalog.status === 'idle' && (
                  <>
                    <span className={styles.stateMark} aria-hidden="true">
                      Aa
                    </span>
                    <p>Selecciona un conjunto lingüístico para explorar.</p>
                  </>
                )}
                {catalog.status === 'error' && (
                  <div role="alert" className={styles.error}>
                    <strong>No se ha podido abrir el conjunto.</strong>
                    <p>{catalog.errorMessage}</p>
                    <button type="button" onClick={catalog.retry}>
                      Reintentar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      )}

      <AppFooter />
      <NotificationViewport notifications={notifications} onDismiss={dismiss} />

      {utilityOverlay === 'app-menu' && (
        <AppMenuDialog
          useCases={dependencies}
          preferences={preferences}
          onClose={() => setUtilityOverlay(null)}
          onImported={() => window.location.reload()}
          onManageTags={() => setUtilityOverlay('tag-manager')}
          onStartSelection={
            layout === 'compact' ? startCatalogSelection : undefined
          }
        />
      )}

      {selectedComposite && (
        <CompositeManagerDialog
          composite={selectedComposite}
          library={library}
          sourceLanguageLabel={
            catalog.loadedDataset?.dataset.sourceLanguage.label ?? 'Origen'
          }
          targetLanguageLabel={
            catalog.loadedDataset?.dataset.targetLanguage.label ?? 'Destino'
          }
          tags={tagsForSemordnilap(
            selectedComposite.id,
            tagState.tags,
            tagState.assignments,
          )}
          favorite={
            statusState.statuses.get(selectedComposite.id)?.has('favorite') ??
            false
          }
          hasCurrentDraft={composition.components.length > 0}
          usedInCurrentDraft={composition.components.some(
            ({ semordnilap }) => semordnilap.id === selectedComposite.id,
          )}
          onClose={() => setSelectedComposite(null)}
          onInsert={() => {
            composition.add(selectedComposite)
            setSelectedComposite(null)
          }}
          onOpenAsDraft={() => {
            const byId = new Map(library.map((item) => [item.id, item]))
            const components = selectedComposite.components.map((reference) => {
              const component = byId.get(reference.semordnilapId)
              if (!component) {
                throw new Error('El composite contiene una referencia ausente.')
              }
              return component
            })
            composition.restore(components, components.length)
            setSelectedComposite(null)
          }}
          onRename={async (title) => {
            await savedComposites.rename(selectedComposite.id, title)
            setSelectedComposite((current) =>
              current
                ? {
                    ...current,
                    ...(title.trim()
                      ? { title: title.trim() }
                      : { title: undefined }),
                  }
                : null,
            )
          }}
          onInspectDeletion={() =>
            savedComposites.inspectDeletion(selectedComposite.id)
          }
          onDelete={async (plan) => {
            await savedComposites.remove(plan)
            tagState.refresh()
          }}
          onExportBackup={async () => {
            const result = await dependencies.exportPersonalData.execute()
            dependencies.personalDataFileGateway.downloadText(
              result.filename,
              result.content,
            )
          }}
        />
      )}

      {utilityOverlay === 'tag-manager' && (
        <TagManagerDialog
          state={tagState}
          onClose={() => setUtilityOverlay(null)}
        />
      )}

      {utilityOverlay === 'dataset-picker' && (
        <DatasetPickerDialog
          datasets={catalog.datasets}
          selectedDatasetId={catalog.selectedDatasetId}
          onChange={handleDatasetChange}
          onClose={() => setUtilityOverlay(null)}
        />
      )}
    </div>
  )
}
