import { useCallback, useMemo, useState } from 'react'

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
import type { CompositeSemordnilap } from '@/domain/semordnilap'
import { TagManagerDialog } from '@/presentation/components/TagManagerDialog'
import { DatasetPickerDialog } from '@/presentation/components/DatasetPickerDialog'
import { useResponsiveLayout } from '@/presentation/responsive/useResponsiveLayout'

import styles from './WorkspacePage.module.css'

type WorkspacePageProps = {
  dependencies: ApplicationDependencies
}

const EMPTY_CATALOG_ITEMS = [] as const

type WorkspaceUtilityOverlay =
  'app-menu' | 'dataset-picker' | 'tag-manager' | null

export function WorkspacePage({ dependencies }: WorkspacePageProps) {
  const [utilityOverlay, setUtilityOverlay] =
    useState<WorkspaceUtilityOverlay>(null)
  const [selectedComposite, setSelectedComposite] =
    useState<CompositeSemordnilap | null>(null)
  const { notifications, notify, dismiss } = useTransientNotifications()
  const layout = useResponsiveLayout()
  const preferences = useWorkspacePreferences(dependencies)
  const catalog = useSemordnilapCatalog(dependencies)
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

  const selectedCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const { semordnilap } of composition.components) {
      counts.set(semordnilap.id, (counts.get(semordnilap.id) ?? 0) + 1)
    }
    return counts
  }, [composition.components])

  const loadedDataset = catalog.loadedDataset

  return (
    <div className={styles.page}>
      <AppHeader
        datasets={catalog.datasets}
        selectedDatasetId={catalog.selectedDatasetId}
        status={catalog.status}
        itemCount={catalogItems.length}
        onDatasetChange={handleDatasetChange}
        onOpenMenu={() => setUtilityOverlay('app-menu')}
        onOpenDatasetPicker={() => setUtilityOverlay('dataset-picker')}
        layout={layout}
      />

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
          tagState.ready ? (
            <PairedSemordnilapCatalog
              key={`${loadedDataset.dataset.id}:${preferences.viewRevision}`}
              dataset={loadedDataset.dataset}
              items={catalogItems}
              selectedCounts={selectedCounts}
              statuses={statusState.statuses}
              statusesReady={statusState.ready}
              statusError={
                statusState.errorMessage ?? savedComposites.errorMessage
              }
              tagState={tagState}
              onAdd={addComponent}
              onAddStatus={statusState.addStatus}
              onRemoveStatus={statusState.removeStatus}
              onRemoveAllStatus={statusState.removeAllStatus}
              initialView={preferences.catalogView(loadedDataset.dataset.id)}
              onViewChange={preferences.saveCatalogView}
              onOpenComposite={setSelectedComposite}
              onManageTags={() => setUtilityOverlay('tag-manager')}
              onNotify={notify}
              layout={layout}
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
                (!preferences.ready || !tagState.ready) && (
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

      <AppFooter />
      <NotificationViewport notifications={notifications} onDismiss={dismiss} />

      {utilityOverlay === 'app-menu' && (
        <AppMenuDialog
          useCases={dependencies}
          preferences={preferences}
          onClose={() => setUtilityOverlay(null)}
          onImported={() => window.location.reload()}
          onManageTags={() => setUtilityOverlay('tag-manager')}
        />
      )}

      {selectedComposite && (
        <CompositeManagerDialog
          composite={selectedComposite}
          library={library}
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
