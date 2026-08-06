import styles from './CatalogLanguageHeader.module.css'
import type { CatalogSide, CatalogSort, CatalogSortField } from './catalog-view'

type CatalogLanguageHeaderProps = {
  languageLabel: string
  query: string
  resultCount: number
  side: CatalogSide
  sort: CatalogSort
  discardedView: boolean
  discardedCount: number
  statusesReady: boolean
  onQueryChange: (query: string) => void
  onCycleSort: (field: CatalogSortField, side: CatalogSide) => void
  onToggleDiscardedView: () => void
}

export function CatalogLanguageHeader({
  languageLabel,
  query,
  resultCount,
  side,
  sort,
  discardedView,
  discardedCount,
  statusesReady,
  onQueryChange,
  onCycleSort,
  onToggleDiscardedView,
}: CatalogLanguageHeaderProps) {
  const searchId = `${side}-catalog-search`
  const activeCriterion = (field: CatalogSortField) =>
    sort.find(
      (criterion) => criterion.field === field && criterion.side === side,
    )
  const criterionPriority = (field: CatalogSortField) =>
    sort.findIndex(
      (criterion) => criterion.field === field && criterion.side === side,
    ) + 1
  const sortLabel = (field: CatalogSortField) => {
    const active = activeCriterion(field)
    if (!active) {
      return field === 'alphabetical' ? 'A/Z' : '1/9'
    }
    const priority = criterionPriority(field)
    if (active.direction === 'ascending') {
      return `${priority} · ${field === 'alphabetical' ? 'A→Z' : '1→9'}`
    }
    return `${priority} · ${field === 'alphabetical' ? 'Z→A' : '9→1'}`
  }

  const sortDescription = (field: CatalogSortField) => {
    const name = field === 'alphabetical' ? 'alfabético' : 'por longitud'
    const active = activeCriterion(field)
    if (!active) {
      return `Activar orden ${name} ascendente en ${languageLabel}`
    }
    return active.direction === 'ascending'
      ? `Cambiar orden ${name} a descendente en ${languageLabel}`
      : `Desactivar orden ${name} en ${languageLabel}`
  }

  return (
    <div className={styles.header} data-side={side}>
      <div className={styles.heading}>
        <div className={styles.headingTitle}>
          <p className={styles.eyebrow}>
            {side === 'source' ? 'Origen' : 'Destino'}
          </p>
          <h2>{languageLabel}</h2>
        </div>
        <div className={styles.sorts} aria-label={`Ordenar ${languageLabel}`}>
          {(['alphabetical', 'length'] as const).map((field) => (
            <button
              key={field}
              type="button"
              data-active={Boolean(activeCriterion(field))}
              onClick={() => onCycleSort(field, side)}
              aria-label={sortDescription(field)}
            >
              {sortLabel(field)}
            </button>
          ))}
        </div>
        <span className={styles.results} aria-live="polite">
          {resultCount.toLocaleString('es-ES')}
        </span>
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
            placeholder={`Buscar en ${languageLabel}`}
            autoComplete="off"
          />
        </label>
        <button
          className={styles.trash}
          data-active={discardedView}
          type="button"
          disabled={!statusesReady}
          onClick={onToggleDiscardedView}
          aria-label={`${discardedView ? 'Volver al catálogo activo' : 'Ver descartados'} desde ${languageLabel}`}
          title={discardedView ? 'Volver al catálogo' : 'Ver descartados'}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" />
          </svg>
          {discardedCount > 0 && <small>{discardedCount}</small>}
        </button>
      </div>
    </div>
  )
}
