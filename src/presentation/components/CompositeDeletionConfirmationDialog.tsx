import { useState } from 'react'

import type { CompositeSemordnilap } from '@/domain/semordnilap'

import { ModalDialog } from './ModalDialog'
import styles from './CompositeDeletionConfirmationDialog.module.css'

type CompositeDeletionConfirmationDialogProps = {
  composite: CompositeSemordnilap
  sourceLanguageLabel: string
  targetLanguageLabel: string
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function CompositeDeletionConfirmationDialog({
  composite,
  sourceLanguageLabel,
  targetLanguageLabel,
  onClose,
  onConfirm,
}: CompositeDeletionConfirmationDialogProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirm = async () => {
    setBusy(true)
    setError(null)
    try {
      await onConfirm()
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'No se ha podido eliminar el composite.',
      )
      setBusy(false)
    }
  }

  const close = () => {
    if (!busy) onClose()
  }

  return (
    <ModalDialog title="Eliminar composite" onClose={close} centered>
      <div className={styles.content}>
        <p>¿Seguro que quieres eliminar este composite?</p>
        <dl className={styles.summary}>
          <div>
            <dt>{sourceLanguageLabel}</dt>
            <dd>{composite.source.text}</dd>
          </div>
          <div>
            <dt>{targetLanguageLabel}</dt>
            <dd>{composite.target.text}</dd>
          </div>
        </dl>
        <p className={styles.warning}>
          También se eliminarán sus favoritos, descartes y etiquetas.
        </p>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.actions}>
          <button type="button" disabled={busy} onClick={close}>
            Volver
          </button>
          <button type="button" disabled={busy} onClick={() => void confirm()}>
            {busy ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </ModalDialog>
  )
}
