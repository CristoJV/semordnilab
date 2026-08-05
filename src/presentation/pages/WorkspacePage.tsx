import { useCallback, useMemo } from 'react'

import type { ApplicationDependencies } from '@/app/composition/create-application-dependencies'
import { AppFooter } from '@/presentation/components/AppFooter'
import { AppHeader } from '@/presentation/components/AppHeader'
import { CompositionWorkspace } from '@/presentation/components/CompositionWorkspace'
import { PairedSemordnilapCatalog } from '@/presentation/components/PairedSemordnilapCatalog'
import { useCompositionWorkspace } from '@/presentation/hooks/useCompositionWorkspace'
import { useSemordnilapCatalog } from '@/presentation/hooks/useSemordnilapCatalog'

import styles from './WorkspacePage.module.css'

type WorkspacePageProps = {
  dependencies: ApplicationDependencies
}

export function WorkspacePage({ dependencies }: WorkspacePageProps) {
  const catalog = useSemordnilapCatalog(dependencies)
  const composition = useCompositionWorkspace()
  const selectDataset = catalog.selectDataset
  const clearComposition = composition.clear
  const removeComponent = composition.remove
  const addComponent = composition.add

  const handleDatasetChange = useCallback(
    (datasetId: string) => {
      clearComposition()
      selectDataset(datasetId)
    },
    [clearComposition, selectDataset],
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
        itemCount={loadedDataset?.items.length ?? 0}
        onDatasetChange={handleDatasetChange}
      />

      <main className={styles.main}>
        <CompositionWorkspace
          dataset={loadedDataset?.dataset ?? null}
          components={composition.components}
          snapshot={composition.snapshot}
          onRemove={removeComponent}
          onClear={clearComposition}
        />

        <div
          className={styles.catalog}
          aria-busy={catalog.status === 'loading'}
        >
          {catalog.status === 'ready' && loadedDataset ? (
            <PairedSemordnilapCatalog
              key={loadedDataset.dataset.id}
              dataset={loadedDataset.dataset}
              items={loadedDataset.items}
              selectedCounts={selectedCounts}
              onAdd={addComponent}
            />
          ) : (
            <div className={styles.catalogState}>
              {catalog.status === 'loading' && (
                <>
                  <span className={styles.loader} aria-hidden="true" />
                  <p>Cargando y validando semordnilaps…</p>
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
