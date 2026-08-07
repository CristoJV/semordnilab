import { ModalDialog } from './ModalDialog'
import styles from './RestoreAllDiscardedDialog.module.css'

type RestoreAllDiscardedDialogProps = {
  count: number
  onCancel: () => void
  onConfirm: () => void
}

export function RestoreAllDiscardedDialog({
  count,
  onCancel,
  onConfirm,
}: RestoreAllDiscardedDialogProps) {
  return (
    <ModalDialog title="Restaurar descartados" onClose={onCancel}>
      <div className={styles.content}>
        <p>
          Se restaurarán {count} semordnilaps y volverán a aparecer en el
          catálogo activo.
        </p>
        <div className={styles.actions}>
          <button type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" onClick={onConfirm}>
            Restaurar todos
          </button>
        </div>
      </div>
    </ModalDialog>
  )
}
