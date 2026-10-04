import type { AvailableDataset } from '@/application'
import type { DatasetId } from '@/domain/semordnilap'
import type { CatalogStatus } from '@/presentation/hooks/useSemordnilapCatalog'
import type { ResponsiveLayout } from '@/presentation/responsive/useResponsiveLayout'

import { DatasetPicker } from './DatasetPicker'
import styles from './AppHeader.module.css'

type AppHeaderProps = {
  view: 'workspace' | 'word-filters'
  datasets: readonly AvailableDataset[]
  selectedDatasetId: DatasetId | ''
  status: CatalogStatus
  itemCount: number
  onDatasetChange: (datasetId: DatasetId | '') => void
  onOpenMenu: () => void
  onOpenDatasetPicker: () => void
  layout: ResponsiveLayout
  wordFilterTitle: string
  canOpenWordFilters: boolean
  onOpenWordFilters: () => void
  onBackToWorkspace: () => void
}

export function AppHeader({
  view,
  datasets,
  selectedDatasetId,
  status,
  itemCount,
  onDatasetChange,
  onOpenMenu,
  onOpenDatasetPicker,
  layout,
  wordFilterTitle,
  canOpenWordFilters,
  onOpenWordFilters,
  onBackToWorkspace,
}: AppHeaderProps) {
  const statusText =
    status === 'loading'
      ? 'Cargando…'
      : status === 'ready'
        ? `${itemCount.toLocaleString('es-ES')} semordnilaps`
        : status === 'error'
          ? 'Error de carga'
          : 'Sin conjunto seleccionado'

  return (
    <header className={styles.header}>
      <div className={styles.brand} aria-label="Semordnilab">
        <span className={styles.brandMark} aria-hidden="true">
          S
        </span>
        <span>Semordnilab</span>
      </div>

      {view === 'workspace' ? (
        <DatasetPicker
          datasets={datasets}
          selectedDatasetId={selectedDatasetId}
          layout={layout}
          onChange={onDatasetChange}
          onOpenCompact={onOpenDatasetPicker}
        />
      ) : (
        <div className={styles.pageTitle}>
          <span>Revisión léxica</span>
          <strong>{wordFilterTitle}</strong>
        </div>
      )}

      <div className={styles.trailing}>
        {view === 'workspace' ? (
          <>
            <p className={styles.status} aria-live="polite">
              {statusText}
            </p>
            <button
              className={styles.menuButton}
              type="button"
              disabled={!canOpenWordFilters}
              onClick={onOpenWordFilters}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 5h16M7 12h10m-7 7h4" />
              </svg>
              Filtrar <span className={styles.buttonQualifier}>palabras</span>
            </button>
            <button
              className={styles.menuButton}
              type="button"
              onClick={onOpenMenu}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Menú
            </button>
          </>
        ) : (
          <button
            className={styles.menuButton}
            type="button"
            onClick={onBackToWorkspace}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m14 5-7 7 7 7M7 12h13" />
            </svg>
            Volver <span className={styles.buttonQualifier}>a componer</span>
          </button>
        )}
      </div>
    </header>
  )
}
