import { useState } from 'react'

import type { ResponsiveLayout } from '@/presentation/responsive/useResponsiveLayout'

import { ModalDialog } from './ModalDialog'
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
  const [actionsOpen, setActionsOpen] = useState(false)

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

  const runAndClose = (action: () => void) => {
    setActionsOpen(false)
    action()
  }

  if (layout === 'compact') {
    return (
      <>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.gesture}
            data-favorite={favorite}
            data-discarded={discardedView}
            onClick={() => setActionsOpen(true)}
            aria-label={`Abrir acciones para ${text}`}
            title="Desliza o abre las acciones"
          >
            <span aria-hidden="true">‹</span>
            {composite ? (
              <EditNoteIcon />
            ) : (
              <span className={styles.gestureSpacer} aria-hidden="true" />
            )}
            <span aria-hidden="true">›</span>
          </button>
        </div>
        {actionsOpen && (
          <ModalDialog
            title="Acciones del semordnilap"
            onClose={() => setActionsOpen(false)}
          >
            <div className={styles.actionSheet}>
              <p>
                Desliza a la derecha para favoritos y a la izquierda para{' '}
                {discardedView ? 'restaurar' : 'descartar'}.
              </p>
              {composite && (
                <button
                  type="button"
                  onClick={() => runAndClose(onOpenComposite)}
                >
                  <EditNoteIcon />
                  <span>Gestionar composite</span>
                </button>
              )}
              <button
                type="button"
                disabled={disabled}
                onClick={() => runAndClose(onToggleFavorite)}
              >
                <span className={styles.sheetGlyph} aria-hidden="true">
                  {favorite ? '☆' : '★'}
                </span>
                <span>
                  {favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                </span>
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() =>
                  runAndClose(discardedView ? onRestore : onDiscard)
                }
              >
                <span className={styles.sheetGlyph} aria-hidden="true">
                  {discardedView ? '↩' : '⌫'}
                </span>
                <span>{discardedView ? 'Restaurar' : 'Descartar'}</span>
              </button>
            </div>
          </ModalDialog>
        )}
      </>
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

function EditNoteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3h9l3 3v5M15 3v4h4M5 21l.8-3.2 9.7-9.7a1.4 1.4 0 0 1 2 0l.4.4a1.4 1.4 0 0 1 0 2l-9.7 9.7L5 21Z" />
      <path d="m14.5 9.1 2.4 2.4M6 8h5M6 12h4" />
    </svg>
  )
}
