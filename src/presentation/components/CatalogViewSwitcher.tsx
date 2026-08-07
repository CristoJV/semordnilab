import type { CatalogViewMode } from '@/application'

import styles from './CatalogViewSwitcher.module.css'

type CatalogViewSwitcherProps = {
  current: CatalogViewMode
  counts: Readonly<Record<CatalogViewMode, number>>
  onChange: (mode: CatalogViewMode) => void
}

const VIEWS: readonly [CatalogViewMode, string][] = [
  ['active', 'Todos'],
  ['saved', 'Guardados'],
  ['favorites', 'Favoritos'],
  ['discarded', 'Descartados'],
]

export function CatalogViewSwitcher({
  current,
  counts,
  onChange,
}: CatalogViewSwitcherProps) {
  return (
    <nav className={styles.views} aria-label="Vistas del catálogo">
      {VIEWS.map(([mode, label]) => (
        <button
          key={mode}
          type="button"
          data-active={current === mode}
          aria-pressed={current === mode}
          onClick={() => onChange(mode)}
        >
          {label} <span>{counts[mode]}</span>
        </button>
      ))}
    </nav>
  )
}
