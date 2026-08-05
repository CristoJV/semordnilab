import type { AvailableDataset } from '@/application'
import type { DatasetId } from '@/domain/semordnilap'
import type { CatalogStatus } from '@/presentation/hooks/useSemordnilapCatalog'

import { DatasetSelector } from './DatasetSelector'
import styles from './AppHeader.module.css'

type AppHeaderProps = {
  datasets: readonly AvailableDataset[]
  selectedDatasetId: DatasetId | ''
  status: CatalogStatus
  itemCount: number
  onDatasetChange: (datasetId: DatasetId | '') => void
}

export function AppHeader({
  datasets,
  selectedDatasetId,
  status,
  itemCount,
  onDatasetChange,
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

      <DatasetSelector
        datasets={datasets}
        selectedDatasetId={selectedDatasetId}
        onChange={onDatasetChange}
      />

      <p className={styles.status} aria-live="polite">
        {statusText}
      </p>
    </header>
  )
}
