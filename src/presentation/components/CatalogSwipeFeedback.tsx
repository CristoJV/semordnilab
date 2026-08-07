import type { CatalogSwipeDirection } from '@/presentation/interactions/catalog-row-pointer-machine'

import styles from './CatalogSwipeFeedback.module.css'

export type CatalogSwipeAction =
  'favorite' | 'unfavorite' | 'discard' | 'restore'

type CatalogSwipeFeedbackProps = {
  action: CatalogSwipeAction | null
  direction: CatalogSwipeDirection | null
  ready: boolean
}

const labels: Record<CatalogSwipeAction, string> = {
  favorite: 'Favorito',
  unfavorite: 'Quitar favorito',
  discard: 'Descartar',
  restore: 'Restaurar',
}

export function CatalogSwipeFeedback({
  action,
  direction,
  ready,
}: CatalogSwipeFeedbackProps) {
  if (!action || !direction) return null

  return (
    <div
      className={styles.feedback}
      data-action={action}
      data-direction={direction}
      data-ready={ready}
      aria-hidden="true"
    >
      <span className={styles.content}>
        <span className={styles.icon}>
          {action === 'favorite' && '★'}
          {action === 'unfavorite' && (
            <svg viewBox="0 0 24 24">
              <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
              <path d="M9 12h6" />
            </svg>
          )}
          {action === 'discard' && (
            <svg viewBox="0 0 24 24">
              <path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" />
            </svg>
          )}
          {action === 'restore' && '↩'}
        </span>
        <span>{labels[action]}</span>
      </span>
    </div>
  )
}
