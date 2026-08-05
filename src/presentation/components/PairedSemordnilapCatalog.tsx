import { useDeferredValue, useMemo, useState } from 'react'

import type { AvailableDataset, SemordnilapCatalogItem } from '@/application'
import type { AtomicSemordnilap } from '@/domain/semordnilap'

import { CatalogLanguageHeader } from './CatalogLanguageHeader'
import { SemordnilapOption } from './SemordnilapOption'
import styles from './PairedSemordnilapCatalog.module.css'

type PairedSemordnilapCatalogProps = {
  dataset: AvailableDataset
  items: readonly SemordnilapCatalogItem[]
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

export function PairedSemordnilapCatalog({
  dataset,
  items,
  selectedCounts,
  onAdd,
}: PairedSemordnilapCatalogProps) {
  const [sourceQuery, setSourceQuery] = useState('')
  const [targetQuery, setTargetQuery] = useState('')
  const deferredSourceQuery = normalizeQuery(useDeferredValue(sourceQuery))
  const deferredTargetQuery = normalizeQuery(useDeferredValue(targetQuery))

  const filteredItems = useMemo(
    () =>
      items.filter(
        (item) =>
          item.sourceSearchText.includes(deferredSourceQuery) &&
          item.targetSearchText.includes(deferredTargetQuery),
      ),
    [deferredSourceQuery, deferredTargetQuery, items],
  )

  return (
    <section className={styles.catalog} aria-label="Catálogo bilingüe">
      <div className={styles.headers}>
        <CatalogLanguageHeader
          languageLabel={dataset.sourceLanguage.label}
          query={sourceQuery}
          resultCount={filteredItems.length}
          side="source"
          onQueryChange={setSourceQuery}
        />
        <CatalogLanguageHeader
          languageLabel={dataset.targetLanguage.label}
          query={targetQuery}
          resultCount={filteredItems.length}
          side="target"
          onQueryChange={setTargetQuery}
        />
      </div>

      <div className={styles.scroller}>
        {filteredItems.length === 0 ? (
          <p className={styles.empty}>
            No hay semordnilaps que coincidan con ambas búsquedas.
          </p>
        ) : (
          <ol className={styles.rows} aria-label="Semordnilaps filtrados">
            {filteredItems.map((item) => {
              const selectedCount = selectedCounts.get(item.semordnilap.id) ?? 0

              return (
                <li className={styles.row} key={item.semordnilap.id}>
                  <SemordnilapOption
                    item={item}
                    side="source"
                    selectedCount={selectedCount}
                    onAdd={({ semordnilap }) => onAdd(semordnilap)}
                  />
                  <SemordnilapOption
                    item={item}
                    side="target"
                    selectedCount={selectedCount}
                    onAdd={({ semordnilap }) => onAdd(semordnilap)}
                  />
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </section>
  )
}
