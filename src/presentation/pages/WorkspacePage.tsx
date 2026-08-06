import { useCallback, useMemo } from 'react'

import type { ApplicationDependencies } from '@/app/composition/create-application-dependencies'
import { AppFooter } from '@/presentation/components/AppFooter'
import { AppHeader } from '@/presentation/components/AppHeader'
import { CompositionWorkspace } from '@/presentation/components/CompositionWorkspace'
import { PairedSemordnilapCatalog } from '@/presentation/components/PairedSemordnilapCatalog'
import { usePersistentCompositionWorkspace } from '@/presentation/hooks/usePersistentCompositionWorkspace'
import { useSemordnilapCatalog } from '@/presentation/hooks/useSemordnilapCatalog'
import { useSemordnilapStatuses } from '@/presentation/hooks/useSemordnilapStatuses'
import { useSavedCompositeSemordnilaps } from '@/presentation/hooks/useSavedCompositeSemordnilaps'

import styles from './WorkspacePage.module.css'

type WorkspacePageProps = {
  dependencies: ApplicationDependencies
}

const EMPTY_CATALOG_ITEMS = [] as const

export function WorkspacePage({ dependencies }: WorkspacePageProps) {
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
  const atomicItems = catalog.loadedDataset?.items ?? EMPTY_CATALOG_ITEMS
  const savedComposites = useSavedCompositeSemordnilaps(
    catalog.selectedDatasetId,
    atomicItems,
    dependencies,
  )
  const catalogItems = useMemo(
    () => [...savedComposites.items, ...atomicItems],
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
      />

      <main className={styles.main}>
        <CompositionWorkspace
          dataset={loadedDataset?.dataset ?? null}
          components={composition.components}
          snapshot={composition.snapshot}
          onRemove={removeComponent}
          onMove={composition.move}
          insertionIndex={composition.insertionIndex}
          onSelectInsertion={composition.selectInsertion}
          onClear={clearComposition}
          canUndo={composition.canUndo}
          canRedo={composition.canRedo}
          onUndo={composition.undo}
          onRedo={composition.redo}
          persistenceError={composition.persistenceError}
          onDiscardIncompatibleDraft={composition.discardIncompatibleDraft}
          onSave={(title) =>
            savedComposites.save(
              composition.components.map(({ semordnilap }) => semordnilap),
              title,
            )
          }
        />

        <div
          className={styles.catalog}
          aria-busy={catalog.status === 'loading'}
        >
          {catalog.status === 'ready' &&
          loadedDataset &&
          savedComposites.ready &&
          composition.ready ? (
            <PairedSemordnilapCatalog
              key={loadedDataset.dataset.id}
              dataset={loadedDataset.dataset}
              items={catalogItems}
              selectedCounts={selectedCounts}
              statuses={statusState.statuses}
              statusesReady={statusState.ready}
              statusError={
                statusState.errorMessage ?? savedComposites.errorMessage
              }
              onAdd={addComponent}
              onAddStatus={statusState.addStatus}
              onRemoveStatus={statusState.removeStatus}
              onRemoveAllStatus={statusState.removeAllStatus}
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
    </div>
  )
}
