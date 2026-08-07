import type { AvailableDataset } from '@/application'
import type { DatasetId } from '@/domain/semordnilap'

import { ModalDialog } from './ModalDialog'
import styles from './DatasetPickerDialog.module.css'

type DatasetPickerDialogProps = {
  datasets: readonly AvailableDataset[]
  selectedDatasetId: DatasetId | ''
  onChange: (datasetId: DatasetId) => void
  onClose: () => void
}

export function DatasetPickerDialog({
  datasets,
  selectedDatasetId,
  onChange,
  onClose,
}: DatasetPickerDialogProps) {
  return (
    <ModalDialog title="Conjunto lingüístico" onClose={onClose}>
      <p className={styles.intro}>
        Elige las dos caras que quieres explorar y combinar.
      </p>
      <div className={styles.options} role="list">
        {datasets.map((dataset) => {
          const selected = dataset.id === selectedDatasetId
          return (
            <button
              key={dataset.id}
              type="button"
              data-selected={selected}
              aria-pressed={selected}
              onClick={() => {
                onChange(dataset.id)
                onClose()
              }}
            >
              <span className={styles.codes} aria-hidden="true">
                {dataset.sourceLanguage.code.toUpperCase()}
                <i>⇄</i>
                {dataset.targetLanguage.code.toUpperCase()}
              </span>
              <span className={styles.description}>
                <strong>{dataset.label}</strong>
                <small>
                  {dataset.sourceLanguage.label} y{' '}
                  {dataset.targetLanguage.label}
                </small>
              </span>
              <span className={styles.check} aria-hidden="true">
                {selected ? '✓' : ''}
              </span>
            </button>
          )
        })}
      </div>
    </ModalDialog>
  )
}
