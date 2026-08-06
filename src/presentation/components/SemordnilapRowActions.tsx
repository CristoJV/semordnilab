import styles from './SemordnilapRowActions.module.css'

type SemordnilapRowActionsProps = {
  text: string
  favorite: boolean
  discardedView: boolean
  selectionMode: boolean
  selected: boolean
  disabled: boolean
  composite: boolean
  onToggleFavorite: () => void
  onDiscard: () => void
  onRestore: () => void
  onToggleSelection: () => void
  onOpenComposite: () => void
}

export function SemordnilapRowActions({
  text,
  favorite,
  discardedView,
  selectionMode,
  selected,
  disabled,
  composite,
  onToggleFavorite,
  onDiscard,
  onRestore,
  onToggleSelection,
  onOpenComposite,
}: SemordnilapRowActionsProps) {
  if (selectionMode) {
    return (
      <label className={styles.selection}>
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelection}
          aria-label={`${selected ? 'Deseleccionar' : 'Seleccionar'} ${text}`}
        />
      </label>
    )
  }

  return (
    <div className={styles.actions}>
      {composite && (
        <button
          type="button"
          className={styles.composite}
          onClick={onOpenComposite}
          aria-label={`Gestionar composite: ${text}`}
          title="Gestionar composite guardado"
        >
          C
        </button>
      )}
      <button
        type="button"
        className={styles.action}
        data-active={favorite}
        disabled={disabled}
        onClick={onToggleFavorite}
        aria-label={`${favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}: ${text}`}
        title={favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
      >
        <span aria-hidden="true">{favorite ? '★' : '☆'}</span>
      </button>
      <button
        type="button"
        className={styles.action}
        disabled={disabled}
        onClick={discardedView ? onRestore : onDiscard}
        aria-label={`${discardedView ? 'Restaurar' : 'Descartar'}: ${text}`}
        title={discardedView ? 'Restaurar' : 'Descartar'}
      >
        <span aria-hidden="true">{discardedView ? '↩' : '×'}</span>
      </button>
    </div>
  )
}
