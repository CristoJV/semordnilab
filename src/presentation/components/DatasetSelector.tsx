import type { ChangeEvent } from 'react'

import type { AvailableDataset } from '@/application'
import type { DatasetId } from '@/domain/semordnilap'

import styles from './DatasetSelector.module.css'

type DatasetSelectorProps = {
  datasets: readonly AvailableDataset[]
  selectedDatasetId: DatasetId | ''
  onChange: (datasetId: DatasetId | '') => void
  disabled?: boolean
}

export function DatasetSelector({
  datasets,
  selectedDatasetId,
  onChange,
  disabled = false,
}: DatasetSelectorProps) {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value)
  }

  return (
    <label className={styles.field}>
      <span className={styles.label}>Conjunto lingüístico</span>
      <select
        className={styles.select}
        value={selectedDatasetId}
        onChange={handleChange}
        disabled={disabled}
      >
        <option value="">Selecciona un conjunto</option>
        {datasets.map((dataset) => (
          <option key={dataset.id} value={dataset.id}>
            {dataset.label}
          </option>
        ))}
      </select>
    </label>
  )
}
