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
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Zm-8 9 8 4.5 8-4.5M4 16.5l8 4.5 8-4.5" />
          </svg>
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
        data-kind={discardedView ? 'restore' : 'discard'}
        disabled={disabled}
        onClick={discardedView ? onRestore : onDiscard}
        aria-label={`${discardedView ? 'Restaurar' : 'Descartar'}: ${text}`}
        title={discardedView ? 'Restaurar' : 'Descartar'}
      >
        {discardedView ? (
          <span aria-hidden="true">↩</span>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" />
          </svg>
        )}
      </button>
    </div>
  )
}
