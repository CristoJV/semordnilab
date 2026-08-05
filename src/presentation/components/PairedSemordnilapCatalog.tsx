import { useCallback, useDeferredValue, useMemo, useState } from 'react'

import type {
  AvailableDataset,
  SemordnilapCatalogItem,
  SemordnilapCatalogStatus,
} from '@/application'
import type { AtomicSemordnilap, SemordnilapId } from '@/domain/semordnilap'
import type { SemordnilapStatusMap } from '@/presentation/hooks/useSemordnilapStatuses'

import { CatalogLanguageHeader } from './CatalogLanguageHeader'
import type { CatalogSide, CatalogSort, CatalogSortField } from './catalog-view'
import { SemordnilapOption } from './SemordnilapOption'
import { SemordnilapRowActions } from './SemordnilapRowActions'
import styles from './PairedSemordnilapCatalog.module.css'

type PairedSemordnilapCatalogProps = {
  dataset: AvailableDataset
  items: readonly SemordnilapCatalogItem[]
  selectedCounts: ReadonlyMap<string, number>
  statuses: SemordnilapStatusMap
  statusesReady: boolean
  statusError: string | null
  onAdd: (semordnilap: AtomicSemordnilap) => void
  onAddStatus: (
    semordnilapIds: readonly SemordnilapId[],
    status: SemordnilapCatalogStatus,
  ) => Promise<void>
  onRemoveStatus: (
    semordnilapIds: readonly SemordnilapId[],
    status: SemordnilapCatalogStatus,
  ) => Promise<void>
  onRemoveAllStatus: (status: SemordnilapCatalogStatus) => Promise<void>
}

type ViewMode = 'active' | 'discarded'

function normalizeQuery(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLocaleLowerCase('es')
}

function cycleSort(
  current: CatalogSort,
  field: CatalogSortField,
  side: CatalogSide,
): CatalogSort {
  if (!current || current.field !== field || current.side !== side) {
    return { field, side, direction: 'ascending' }
  }
  if (current.direction === 'ascending') {
    return { field, side, direction: 'descending' }
  }
  return null
}

export function PairedSemordnilapCatalog({
  dataset,
  items,
  selectedCounts,
  statuses,
  statusesReady,
  statusError,
  onAdd,
  onAddStatus,
  onRemoveStatus,
  onRemoveAllStatus,
}: PairedSemordnilapCatalogProps) {
  const [sourceQuery, setSourceQuery] = useState('')
  const [targetQuery, setTargetQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('active')
  const [sort, setSort] = useState<CatalogSort>(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<SemordnilapId>>(
    new Set(),
  )
  const deferredSourceQuery = normalizeQuery(useDeferredValue(sourceQuery))
  const deferredTargetQuery = normalizeQuery(useDeferredValue(targetQuery))
  const discardedView = viewMode === 'discarded'

  const hasStatus = useCallback(
    (semordnilapId: SemordnilapId, status: SemordnilapCatalogStatus) =>
      statuses.get(semordnilapId)?.has(status) ?? false,
    [statuses],
  )

  const discardedCount = useMemo(
    () =>
      items.reduce(
        (count, item) =>
          count + (hasStatus(item.semordnilap.id, 'discarded') ? 1 : 0),
        0,
      ),
    [hasStatus, items],
  )

  const visibleItems = useMemo(() => {
    const collator = new Intl.Collator(
      sort?.side === 'target'
        ? dataset.targetLanguage.code
        : dataset.sourceLanguage.code,
      { sensitivity: 'base', numeric: true },
    )
    const originalPositions = new Map(
      items.map((item, index) => [item.semordnilap.id, index]),
    )
    const filtered = items.filter((item) => {
      const discarded = hasStatus(item.semordnilap.id, 'discarded')
      return (
        discarded === discardedView &&
        item.sourceSearchText.includes(deferredSourceQuery) &&
        item.targetSearchText.includes(deferredTargetQuery)
      )
    })

    return filtered.toSorted((first, second) => {
      const firstFavorite = hasStatus(first.semordnilap.id, 'favorite')
      const secondFavorite = hasStatus(second.semordnilap.id, 'favorite')
      if (firstFavorite !== secondFavorite) return firstFavorite ? -1 : 1

      let comparison = 0
      if (sort) {
        const firstExpression = first.semordnilap[sort.side]
        const secondExpression = second.semordnilap[sort.side]
        comparison =
          sort.field === 'alphabetical'
            ? collator.compare(firstExpression.text, secondExpression.text)
            : Array.from(firstExpression.normalized).length -
              Array.from(secondExpression.normalized).length
        if (sort.direction === 'descending') comparison *= -1
      }

      return (
        comparison ||
        (originalPositions.get(first.semordnilap.id) ?? 0) -
          (originalPositions.get(second.semordnilap.id) ?? 0)
      )
    })
  }, [
    dataset.sourceLanguage.code,
    dataset.targetLanguage.code,
    deferredSourceQuery,
    deferredTargetQuery,
    discardedView,
    items,
    sort,
    hasStatus,
  ])

  const toggleSelection = (semordnilapId: SemordnilapId) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(semordnilapId)) next.delete(semordnilapId)
      else next.add(semordnilapId)
      return next
    })
  }

  const leaveSelectionMode = () => {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }

  const toggleDiscardedView = () => {
    setViewMode((current) => (current === 'active' ? 'discarded' : 'active'))
    setSourceQuery('')
    setTargetQuery('')
    leaveSelectionMode()
  }

  const applySelectedStatus = (status: SemordnilapCatalogStatus) => {
    void onAddStatus([...selectedIds], status)
    leaveSelectionMode()
  }

  const removeSelectedStatus = (status: SemordnilapCatalogStatus) => {
    void onRemoveStatus([...selectedIds], status)
    leaveSelectionMode()
  }

  return (
    <section
      className={styles.catalog}
      data-has-error={Boolean(statusError)}
      aria-label="Catálogo bilingüe"
    >
      <div className={styles.toolbar}>
        <div className={styles.toolbarMain}>
          {selectionMode ? (
            <>
              <strong>{selectedIds.size} seleccionados</strong>
              <button
                type="button"
                disabled={selectedIds.size === 0}
                onClick={() => applySelectedStatus('favorite')}
              >
                Añadir a favoritos
              </button>
              <button
                type="button"
                disabled={selectedIds.size === 0}
                onClick={() =>
                  discardedView
                    ? removeSelectedStatus('discarded')
                    : applySelectedStatus('discarded')
                }
              >
                {discardedView ? 'Restaurar' : 'Descartar'}
              </button>
              <button type="button" onClick={leaveSelectionMode}>
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={!statusesReady || visibleItems.length === 0}
                onClick={() => setSelectionMode(true)}
              >
                Seleccionar varios
              </button>
              {discardedView && (
                <>
                  <strong>Viendo descartados</strong>
                  <button type="button" onClick={toggleDiscardedView}>
                    Volver al catálogo
                  </button>
                  <button
                    type="button"
                    disabled={discardedCount === 0}
                    onClick={() => void onRemoveAllStatus('discarded')}
                  >
                    Restaurar todos
                  </button>
                </>
              )}
            </>
          )}
        </div>
        {(sourceQuery || targetQuery || sort) && !selectionMode && (
          <button
            className={styles.resetView}
            type="button"
            onClick={() => {
              setSourceQuery('')
              setTargetQuery('')
              setSort(null)
            }}
          >
            Restablecer filtros
          </button>
        )}
      </div>

      {statusError && (
        <p className={styles.statusError} role="alert">
          {statusError}
        </p>
      )}

      <div className={styles.headers}>
        <CatalogLanguageHeader
          languageLabel={dataset.sourceLanguage.label}
          query={sourceQuery}
          resultCount={visibleItems.length}
          side="source"
          sort={sort}
          discardedView={discardedView}
          discardedCount={discardedCount}
          statusesReady={statusesReady}
          onQueryChange={setSourceQuery}
          onCycleSort={(field, side) =>
            setSort((current) => cycleSort(current, field, side))
          }
          onToggleDiscardedView={toggleDiscardedView}
        />
        <div className={styles.headerGutter} aria-hidden="true" />
        <CatalogLanguageHeader
          languageLabel={dataset.targetLanguage.label}
          query={targetQuery}
          resultCount={visibleItems.length}
          side="target"
          sort={sort}
          discardedView={discardedView}
          discardedCount={discardedCount}
          statusesReady={statusesReady}
          onQueryChange={setTargetQuery}
          onCycleSort={(field, side) =>
            setSort((current) => cycleSort(current, field, side))
          }
          onToggleDiscardedView={toggleDiscardedView}
        />
      </div>

      <div className={styles.scroller}>
        {visibleItems.length === 0 ? (
          <p className={styles.empty}>
            {discardedView
              ? 'No hay semordnilaps descartados que coincidan con ambas búsquedas.'
              : 'No hay semordnilaps que coincidan con ambas búsquedas.'}
          </p>
        ) : (
          <ol className={styles.rows} aria-label="Semordnilaps filtrados">
            {visibleItems.map((item) => {
              const id = item.semordnilap.id
              const selectedCount = selectedCounts.get(id) ?? 0
              const selected = selectedIds.has(id)
              const text = `${item.semordnilap.source.text} / ${item.semordnilap.target.text}`
              const favorite = hasStatus(id, 'favorite')

              return (
                <li className={styles.row} key={id}>
                  <SemordnilapOption
                    item={item}
                    side="source"
                    selectedCount={selectedCount}
                    selectionMode={selectionMode}
                    selected={selected}
                    onAdd={({ semordnilap }) => onAdd(semordnilap)}
                    onToggleSelection={() => toggleSelection(id)}
                  />
                  <SemordnilapRowActions
                    text={text}
                    favorite={favorite}
                    discardedView={discardedView}
                    selectionMode={selectionMode}
                    selected={selected}
                    disabled={!statusesReady}
                    onToggleFavorite={() =>
                      void (favorite
                        ? onRemoveStatus([id], 'favorite')
                        : onAddStatus([id], 'favorite'))
                    }
                    onDiscard={() => void onAddStatus([id], 'discarded')}
                    onRestore={() => void onRemoveStatus([id], 'discarded')}
                    onToggleSelection={() => toggleSelection(id)}
                  />
                  <SemordnilapOption
                    item={item}
                    side="target"
                    selectedCount={selectedCount}
                    selectionMode={selectionMode}
                    selected={selected}
                    onAdd={({ semordnilap }) => onAdd(semordnilap)}
                    onToggleSelection={() => toggleSelection(id)}
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
