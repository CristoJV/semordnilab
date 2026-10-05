import type { CatalogViewMode } from '@/application'

import styles from './CatalogViewSwitcher.module.css'

type CatalogViewSwitcherProps = {
  current: CatalogViewMode
  counts: Readonly<Record<CatalogViewMode, number>>
  onChange: (mode: CatalogViewMode) => void
}

const VIEWS: readonly [
  CatalogViewMode,
  string,
  'all' | 'save' | 'star' | 'trash',
][] = [
  ['active', 'Todos', 'all'],
  ['saved', 'Guardados', 'save'],
  ['favorites', 'Favoritos', 'star'],
  ['discarded', 'Descartados', 'trash'],
]

function ViewIcon({ icon }: { icon: 'save' | 'star' | 'trash' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {icon === 'save' && (
        <path d="M5 4h12l2 2v14H5V4Zm3 0v6h8V4M8 20v-6h8v6" />
      )}
      {icon === 'star' && (
        <path d="m12 3 2.75 5.58 6.16.9-4.46 4.34 1.05 6.13L12 17.06l-5.5 2.89 1.05-6.13-4.46-4.34 6.16-.9L12 3Z" />
      )}
      {icon === 'trash' && (
        <path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" />
      )}
    </svg>
  )
}

export function CatalogViewSwitcher({
  current,
  counts,
  onChange,
}: CatalogViewSwitcherProps) {
  return (
    <nav className={styles.views} aria-label="Vistas del catálogo">
      {VIEWS.map(([mode, label, icon]) => (
        <button
          key={mode}
          type="button"
          data-active={current === mode}
          aria-pressed={current === mode}
          aria-label={`${label} ${counts[mode]}`}
          title={`${label} · ${counts[mode]}`}
          onClick={() => onChange(mode)}
        >
          {icon === 'all' ? (
            <span className={styles.allLabel}>Todos</span>
          ) : (
            <ViewIcon icon={icon} />
          )}
        </button>
      ))}
    </nav>
  )
}
