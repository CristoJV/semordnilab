import type { ResponsiveLayout } from '@/presentation/responsive/useResponsiveLayout'

import styles from './SemordnilapRowActions.module.css'

type SemordnilapRowActionsProps = {
  text: string
  favorite: boolean
  discardedView: boolean
  selectionMode: boolean
  selected: boolean
  disabled: boolean
  composite: boolean
  layout: ResponsiveLayout
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
  layout,
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

  if (layout === 'compact') {
    const action = !discardedView && composite ? onOpenComposite : null
    const label = action ? `Gestionar composite: ${text}` : undefined
    const content = (
      <>
        <span aria-hidden="true">‹</span>
        {!discardedView && composite ? <EditNoteIcon /> : null}
        {!discardedView && <span aria-hidden="true">›</span>}
      </>
    )

    return (
      <div className={styles.actions}>
        {action && label ? (
          <button
            type="button"
            className={styles.gesture}
            onClick={action}
            aria-label={label}
            title="Gestionar composite"
          >
            {content}
          </button>
        ) : (
          <div
            className={styles.gesture}
            data-discarded={discardedView}
            aria-hidden="true"
          >
            {content}
          </div>
        )}
      </div>
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
      {!discardedView && (
        <button
          type="button"
          className={styles.action}
          data-kind="favorite"
          data-mode={favorite ? 'remove' : 'add'}
          disabled={disabled}
          onClick={onToggleFavorite}
          aria-label={`${favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}: ${text}`}
          title={favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        >
          <FavoriteActionIcon remove={favorite} />
        </button>
      )}
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

function FavoriteActionIcon({ remove }: { remove: boolean }) {
  return (
    <svg className={styles.favoriteIcon} viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
      {remove && <path d="M9 12h6" />}
    </svg>
  )
}

function EditNoteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3h9l3 3v5M15 3v4h4M5 21l.8-3.2 9.7-9.7a1.4 1.4 0 0 1 2 0l.4.4a1.4 1.4 0 0 1 0 2l-9.7 9.7L5 21Z" />
      <path d="m14.5 9.1 2.4 2.4M6 8h5M6 12h4" />
    </svg>
  )
}
