import { useDeferredValue, useMemo, useState } from 'react'

import type { SemordnilapCatalogItem } from '@/application'
import type { AtomicSemordnilap } from '@/domain/semordnilap'

import { SemordnilapList } from './SemordnilapList'
import styles from './LanguagePanel.module.css'

type LanguagePanelProps = {
  languageLabel: string
  items: readonly SemordnilapCatalogItem[]
  side: 'source' | 'target'
  selectedCounts: ReadonlyMap<string, number>
  onAdd: (semordnilap: AtomicSemordnilap) => void
}

function normalizeQuery(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLocaleLowerCase('es')
}

export function LanguagePanel({
  languageLabel,
  items,
  side,
  selectedCounts,
  onAdd,
}: LanguagePanelProps) {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const normalizedQuery = normalizeQuery(deferredQuery)
  const headingId = `${side}-language-title`

  const filteredItems = useMemo(() => {
    if (!normalizedQuery) {
      return items
    }

    const searchField =
      side === 'source' ? 'sourceSearchText' : 'targetSearchText'
    return items.filter((item) => item[searchField].includes(normalizedQuery))
  }, [items, normalizedQuery, side])

  return (
    <section
      className={styles.panel}
      data-side={side}
      aria-labelledby={headingId}
    >
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>
            {side === 'source' ? 'Origen' : 'Destino'}
          </p>
          <h2 id={headingId}>{languageLabel}</h2>
        </div>
        <span className={styles.results} aria-live="polite">
          {filteredItems.length.toLocaleString('es-ES')}
        </span>
      </div>

      <label className={styles.search}>
        <span className={styles.visuallyHidden}>Buscar en {languageLabel}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m21 21-4.35-4.35m2.35-5.15a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Buscar en ${languageLabel}`}
          autoComplete="off"
        />
      </label>

      <div className={styles.scroller}>
        <SemordnilapList
          items={filteredItems}
          side={side}
          selectedCounts={selectedCounts}
          onAdd={onAdd}
        />
      </div>
    </section>
  )
}
