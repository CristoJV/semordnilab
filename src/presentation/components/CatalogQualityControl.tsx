import {
  EMPTY_CATALOG_QUALITY_FILTERS,
  type CatalogQualityFilters,
} from './catalog-items-view'

import styles from './CatalogQualityControl.module.css'

type CatalogQualityControlProps = {
  filters: CatalogQualityFilters
  sourceLanguage: string
  targetLanguage: string
  onChange: (filters: CatalogQualityFilters) => void
}

type NumericFilter = Exclude<keyof CatalogQualityFilters, never>

export function CatalogQualityControl({
  filters,
  sourceLanguage,
  targetLanguage,
  onChange,
}: CatalogQualityControlProps) {
  const activeCount = Object.values(filters).filter(
    (value) => value !== null,
  ).length
  const change = (key: NumericFilter, rawValue: string) => {
    const parsed = rawValue === '' ? null : Number(rawValue)
    if (parsed !== null && (!Number.isFinite(parsed) || parsed < 0)) return
    onChange({ ...filters, [key]: parsed })
  }

  const field = (key: NumericFilter, label: string, step: string = '1') => (
    <label>
      <span>{label}</span>
      <input
        type="number"
        min="0"
        step={step}
        value={filters[key] ?? ''}
        onChange={(event) => change(key, event.target.value)}
      />
    </label>
  )

  return (
    <details className={styles.quality}>
      <summary>Calidad{activeCount > 0 ? ` · ${activeCount}` : ''}</summary>
      <div
        className={styles.panel}
        role="group"
        aria-label="Filtros de calidad"
      >
        {field('sourceMinFrequency', `Frecuencia mínima · ${sourceLanguage}`)}
        {field('targetMinFrequency', `Frecuencia mínima · ${targetLanguage}`)}
        {field('sourceMaxWordCount', `Máximo de palabras · ${sourceLanguage}`)}
        {field('targetMaxWordCount', `Máximo de palabras · ${targetLanguage}`)}
        {field('minPairScore', 'Puntuación mínima de pareja', 'any')}
        <button
          type="button"
          disabled={activeCount === 0}
          onClick={() => onChange(EMPTY_CATALOG_QUALITY_FILTERS)}
        >
          Restablecer calidad
        </button>
      </div>
    </details>
  )
}
