import type { AvailableDataset } from '@/application'
import type { DatasetId } from '@/domain/semordnilap'
import type { ResponsiveLayout } from '@/presentation/responsive/useResponsiveLayout'

import { DatasetSelector } from './DatasetSelector'
import styles from './DatasetPicker.module.css'

type DatasetPickerProps = {
  datasets: readonly AvailableDataset[]
  selectedDatasetId: DatasetId | ''
  layout: ResponsiveLayout
  onChange: (datasetId: DatasetId | '') => void
  onOpenCompact: () => void
}

function compactLabel(dataset: AvailableDataset | undefined): string {
  if (!dataset) return 'Elegir conjunto'
  return `${dataset.sourceLanguage.code.toUpperCase()} ⇄ ${dataset.targetLanguage.code.toUpperCase()}`
}

export function DatasetPicker({
  datasets,
  selectedDatasetId,
  layout,
  onChange,
  onOpenCompact,
}: DatasetPickerProps) {
  if (layout === 'wide') {
    return (
      <DatasetSelector
        datasets={datasets}
        selectedDatasetId={selectedDatasetId}
        onChange={onChange}
      />
    )
  }

  const selected = datasets.find(({ id }) => id === selectedDatasetId)
  return (
    <button
      className={styles.compactButton}
      type="button"
      aria-label={
        selected
          ? `Cambiar conjunto lingüístico, actual ${selected.label}`
          : 'Elegir conjunto lingüístico'
      }
      onClick={onOpenCompact}
    >
      <span>{compactLabel(selected)}</span>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m8 10 4-4 4 4M16 14l-4 4-4-4" />
      </svg>
    </button>
  )
}
