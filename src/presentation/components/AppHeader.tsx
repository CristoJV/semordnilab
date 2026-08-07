import type { AvailableDataset } from '@/application'
import type { DatasetId } from '@/domain/semordnilap'
import type { CatalogStatus } from '@/presentation/hooks/useSemordnilapCatalog'
import type { ResponsiveLayout } from '@/presentation/responsive/useResponsiveLayout'

import { DatasetPicker } from './DatasetPicker'
import styles from './AppHeader.module.css'

type AppHeaderProps = {
  datasets: readonly AvailableDataset[]
  selectedDatasetId: DatasetId | ''
  status: CatalogStatus
  itemCount: number
  onDatasetChange: (datasetId: DatasetId | '') => void
  onOpenMenu: () => void
  onOpenDatasetPicker: () => void
  layout: ResponsiveLayout
}

export function AppHeader({
  datasets,
  selectedDatasetId,
  status,
  itemCount,
  onDatasetChange,
  onOpenMenu,
  onOpenDatasetPicker,
  layout,
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

      <DatasetPicker
        datasets={datasets}
        selectedDatasetId={selectedDatasetId}
        layout={layout}
        onChange={onDatasetChange}
        onOpenCompact={onOpenDatasetPicker}
      />

      <div className={styles.trailing}>
        <p className={styles.status} aria-live="polite">
          {statusText}
        </p>
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
      </div>
    </header>
  )
}
