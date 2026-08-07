import type { ResponsiveLayout } from '@/presentation/responsive/useResponsiveLayout'

import { CatalogSortControl } from './CatalogSortControl'
import styles from './CatalogLanguageHeader.module.css'
import type {
  CatalogSide,
  CatalogSort,
  CatalogSortDirection,
  CatalogSortField,
} from './catalog-view'

type CatalogLanguageHeaderProps = {
  languageLabel: string
  query: string
  resultCount: number
  layout: ResponsiveLayout
  side: CatalogSide
  sort: CatalogSort
  onQueryChange: (query: string) => void
  onCycleSort: (field: CatalogSortField, side: CatalogSide) => void
  onSetSort: (
    field: CatalogSortField,
    side: CatalogSide,
    direction: CatalogSortDirection | null,
  ) => void
}

export function CatalogLanguageHeader({
  languageLabel,
  query,
  resultCount,
  layout,
  side,
  sort,
  onQueryChange,
  onCycleSort,
  onSetSort,
}: CatalogLanguageHeaderProps) {
  const searchId = `${side}-catalog-search`

  return (
    <div className={styles.header} data-side={side}>
      <div className={styles.heading}>
        <div className={styles.headingTitle}>
          <p className={styles.eyebrow}>
            {side === 'source' ? 'Origen' : 'Destino'}
          </p>
          <h2>{languageLabel}</h2>
        </div>
        <div className={styles.headingMeta}>
          <span className={styles.results} aria-live="polite">
            {resultCount.toLocaleString('es-ES')}
          </span>
          <CatalogSortControl
            key={layout}
            languageLabel={languageLabel}
            layout={layout}
            side={side}
            sort={sort}
            onCycle={onCycleSort}
            onSet={onSetSort}
          />
        </div>
      </div>

      <div className={styles.searchRow}>
        <label className={styles.search} htmlFor={searchId}>
          <span className={styles.visuallyHidden}>
            Buscar en {languageLabel}
          </span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m21 21-4.35-4.35m2.35-5.15a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />
          </svg>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={
              layout === 'compact' ? 'Buscar' : `Buscar en ${languageLabel}`
            }
            autoComplete="off"
          />
        </label>
      </div>
    </div>
  )
}
