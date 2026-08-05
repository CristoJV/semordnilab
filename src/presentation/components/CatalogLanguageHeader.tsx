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
  const sortLabel = (field: CatalogSortField) => {
    if (!sort || sort.field !== field || sort.side !== side) {
      return field === 'alphabetical' ? 'A/Z' : '1/9'
    }
    if (sort.direction === 'ascending') {
      return field === 'alphabetical' ? 'A→Z' : '1→9'
    }
    return field === 'alphabetical' ? 'Z→A' : '9→1'
  }

  const sortDescription = (field: CatalogSortField) => {
    const name = field === 'alphabetical' ? 'alfabético' : 'por longitud'
    if (!sort || sort.field !== field || sort.side !== side) {
      return `Activar orden ${name} ascendente en ${languageLabel}`
    }
    return sort.direction === 'ascending'
      ? `Cambiar orden ${name} a descendente en ${languageLabel}`
      : `Desactivar orden ${name} en ${languageLabel}`
  }

  return (
    <div className={styles.header} data-side={side}>
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>
            {side === 'source' ? 'Origen' : 'Destino'}
          </p>
          <h2>{languageLabel}</h2>
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
          <span aria-hidden="true">⌫</span>
          {discardedCount > 0 && <small>{discardedCount}</small>}
        </button>
      </div>

      <div className={styles.sorts} aria-label={`Ordenar ${languageLabel}`}>
        {(['alphabetical', 'length'] as const).map((field) => (
          <button
            key={field}
            type="button"
            data-active={sort?.field === field && sort.side === side}
            onClick={() => onCycleSort(field, side)}
            aria-label={sortDescription(field)}
          >
            {sortLabel(field)}
          </button>
        ))}
      </div>
    </div>
  )
}
