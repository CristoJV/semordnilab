import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import type {
  AvailableDataset,
  SemordnilapCatalogItem,
  SemordnilapCatalogStatus,
  TagId,
  CatalogViewMode,
  DatasetCatalogViewPreference,
} from '@/application'
import type {
  CompositeSemordnilap,
  Semordnilap,
  SemordnilapId,
} from '@/domain/semordnilap'
import type { SemordnilapStatusMap } from '@/presentation/hooks/useSemordnilapStatuses'
import type { Notify } from '@/presentation/hooks/useTransientNotifications'
import type { SemordnilapTagState } from '@/presentation/hooks/useSemordnilapTags'
import { useVirtualCatalogRows } from '@/presentation/hooks/useVirtualCatalogRows'

import { CatalogLanguageHeader } from './CatalogLanguageHeader'
import { selectDiscoveryItems } from './catalog-discovery'
import {
  cycleCatalogSort,
  selectVisibleCatalogItems,
} from './catalog-items-view'
import { normalizeCatalogQuery } from './catalog-search'
import type { CatalogSide, CatalogSort, CatalogSortField } from './catalog-view'
import { SemordnilapOption } from './SemordnilapOption'
import { SemordnilapRowActions } from './SemordnilapRowActions'
import { TagAssignmentMenu, TagFilterMenu } from './TagControls'
import { tagsForSemordnilap } from './tag-view'
import styles from './PairedSemordnilapCatalog.module.css'

type PairedSemordnilapCatalogProps = {
  dataset: AvailableDataset
  items: readonly SemordnilapCatalogItem[]
  selectedCounts: ReadonlyMap<string, number>
  statuses: SemordnilapStatusMap
  statusesReady: boolean
  statusError: string | null
  tagState: SemordnilapTagState
  onAdd: (semordnilap: Semordnilap) => void
  onAddStatus: (
    semordnilapIds: readonly SemordnilapId[],
    status: SemordnilapCatalogStatus,
  ) => Promise<void>
  onRemoveStatus: (
    semordnilapIds: readonly SemordnilapId[],
    status: SemordnilapCatalogStatus,
  ) => Promise<void>
  onRemoveAllStatus: (status: SemordnilapCatalogStatus) => Promise<void>
  initialView?: DatasetCatalogViewPreference
  onViewChange: (view: DatasetCatalogViewPreference) => void
  onOpenComposite: (composite: CompositeSemordnilap) => void
  onManageTags: () => void
  onNotify: Notify
}

export function PairedSemordnilapCatalog({
  dataset,
  items,
  selectedCounts,
  statuses,
  statusesReady,
  statusError,
  tagState,
  onAdd,
  onAddStatus,
  onRemoveStatus,
  onRemoveAllStatus,
  initialView,
  onViewChange,
  onOpenComposite,
  onManageTags,
  onNotify,
}: PairedSemordnilapCatalogProps) {
  const [sourceQuery, setSourceQuery] = useState(initialView?.sourceQuery ?? '')
  const [targetQuery, setTargetQuery] = useState(initialView?.targetQuery ?? '')
  const [viewMode, setViewMode] = useState<CatalogViewMode>(
    initialView?.viewMode ?? 'active',
  )
  const [sort, setSort] = useState<CatalogSort>(initialView?.sort ?? [])
  const [selectionMode, setSelectionMode] = useState(false)
  const [discoverySeed, setDiscoverySeed] = useState<number | null>(null)
  const [selectedTagIds, setSelectedTagIds] = useState<ReadonlySet<TagId>>(
    new Set(),
  )
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<SemordnilapId>>(
    new Set(),
  )
  const deferredSourceQuery = normalizeCatalogQuery(
    useDeferredValue(sourceQuery),
  )
  const deferredTargetQuery = normalizeCatalogQuery(
    useDeferredValue(targetQuery),
  )
  const discardedView = viewMode === 'discarded'

  const effectiveSelectedTagIds = useMemo(() => {
    const available = new Set(tagState.tags.map(({ id }) => id))
    return new Set([...selectedTagIds].filter((id) => available.has(id)))
  }, [selectedTagIds, tagState.tags])

  useEffect(() => {
    onViewChange({
      datasetId: dataset.id,
      sourceQuery,
      targetQuery,
      viewMode,
      sort,
    })
  }, [dataset.id, onViewChange, sort, sourceQuery, targetQuery, viewMode])

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
  const savedCount = useMemo(
    () =>
      items.filter(
        (item) =>
          item.semordnilap.kind === 'composite' &&
          !hasStatus(item.semordnilap.id, 'discarded'),
      ).length,
    [hasStatus, items],
  )
  const favoriteCount = useMemo(
    () =>
      items.filter(
        (item) =>
          hasStatus(item.semordnilap.id, 'favorite') &&
          !hasStatus(item.semordnilap.id, 'discarded'),
      ).length,
    [hasStatus, items],
  )

  const visibleItems = useMemo(() => {
    const byCatalogState = selectVisibleCatalogItems({
      items,
      viewMode,
      sourceQuery: deferredSourceQuery,
      targetQuery: deferredTargetQuery,
      sort,
      sourceLanguageCode: dataset.sourceLanguage.code,
      targetLanguageCode: dataset.targetLanguage.code,
      hasStatus,
    })
    if (effectiveSelectedTagIds.size === 0) return byCatalogState
    return byCatalogState.filter((item) => {
      const assigned = tagState.assignments.get(item.semordnilap.id)
      return [...effectiveSelectedTagIds].some((tagId) => assigned?.has(tagId))
    })
  }, [
    dataset.sourceLanguage.code,
    dataset.targetLanguage.code,
    deferredSourceQuery,
    deferredTargetQuery,
    viewMode,
    items,
    sort,
    hasStatus,
    effectiveSelectedTagIds,
    tagState.assignments,
  ])

  const displayedItems = useMemo(
    () =>
      discoverySeed === null
        ? visibleItems
        : selectDiscoveryItems(visibleItems, discoverySeed),
    [discoverySeed, visibleItems],
  )
  const virtualRows = useVirtualCatalogRows(displayedItems.length, scrollerRef)
  const renderedItems = displayedItems.slice(virtualRows.start, virtualRows.end)

  const changeQuery = (side: CatalogSide, query: string) => {
    setDiscoverySeed(null)
    if (side === 'source') setSourceQuery(query)
    else setTargetQuery(query)
    virtualRows.reset()
  }

  const changeSort = (field: CatalogSortField, side: CatalogSide) => {
    setDiscoverySeed(null)
    setSort((current) => cycleCatalogSort(current, field, side))
    virtualRows.reset()
  }

  const discover = () => {
    setSourceQuery('')
    setTargetQuery('')
    setSort([])
    setViewMode('active')
    setDiscoverySeed((current) => (current ?? 0) + 1)
    leaveSelectionMode()
    virtualRows.reset()
  }

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

  const applySelectedStatus = (status: SemordnilapCatalogStatus) => {
    const ids = [...selectedIds]
    if (status === 'discarded') discard(ids)
    else void onAddStatus(ids, status)
    leaveSelectionMode()
  }

  const removeSelectedStatus = (status: SemordnilapCatalogStatus) => {
    void onRemoveStatus([...selectedIds], status)
    leaveSelectionMode()
  }

  const discard = (ids: readonly SemordnilapId[]) => {
    void onAddStatus(ids, 'discarded')
    onNotify({
      tone: 'warning',
      message:
        ids.length === 1
          ? 'Semordnilap descartado.'
          : `${ids.length} semordnilaps descartados.`,
      action: {
        label: 'Deshacer descarte',
        run: () => void onRemoveStatus(ids, 'discarded'),
      },
      lifetime: 4200,
    })
  }

  const toggleTagFilter = (tagId: TagId) => {
    setDiscoverySeed(null)
    setSelectedTagIds((current) => {
      const next = new Set(current)
      if (next.has(tagId)) next.delete(tagId)
      else next.add(tagId)
      return next
    })
    virtualRows.reset()
  }

  return (
    <section
      className={styles.catalog}
      data-has-error={Boolean(statusError || tagState.errorMessage)}
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
              <TagAssignmentMenu
                tags={tagState.tags}
                selectedIds={[...selectedIds]}
                assignments={tagState.assignments}
                onAdd={(tagId) => void tagState.addTo([...selectedIds], tagId)}
                onRemove={(tagId) =>
                  void tagState.removeFrom([...selectedIds], tagId)
                }
                onManage={onManageTags}
              />
              <button type="button" onClick={leaveSelectionMode}>
                Cancelar
              </button>
            </>
          ) : (
            <>
              <nav className={styles.viewTabs} aria-label="Vistas del catálogo">
                {(
                  [
                    ['active', 'Todos', items.length - discardedCount],
                    ['saved', 'Guardados', savedCount],
                    ['favorites', 'Favoritos', favoriteCount],
                    ['discarded', 'Descartados', discardedCount],
                  ] as const
                ).map(([mode, label, count]) => (
                  <button
                    key={mode}
                    type="button"
                    data-active={viewMode === mode}
                    aria-pressed={viewMode === mode}
                    onClick={() => {
                      setDiscoverySeed(null)
                      setViewMode(mode)
                      leaveSelectionMode()
                      virtualRows.reset()
                    }}
                  >
                    {label} <span>{count}</span>
                  </button>
                ))}
              </nav>
              <button
                className={styles.discovery}
                type="button"
                data-active={discoverySeed !== null}
                aria-pressed={discoverySeed !== null}
                onClick={discover}
              >
                {discoverySeed === null ? 'Descubrir' : 'Otro grupo'}
              </button>
              {discoverySeed !== null && (
                <strong>
                  {displayedItems.length} de {visibleItems.length}
                </strong>
              )}
              <button
                type="button"
                disabled={!statusesReady || visibleItems.length === 0}
                onClick={() => setSelectionMode(true)}
              >
                Seleccionar varios
              </button>
              <TagFilterMenu
                tags={tagState.tags}
                selectedTagIds={effectiveSelectedTagIds}
                onToggle={toggleTagFilter}
                onClear={() => {
                  setSelectedTagIds(new Set())
                  virtualRows.reset()
                }}
                onManage={onManageTags}
              />
              {discardedView && (
                <>
                  <strong>Viendo descartados</strong>
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
        {(sourceQuery ||
          targetQuery ||
          sort.length > 0 ||
          effectiveSelectedTagIds.size > 0) &&
          !selectionMode && (
            <button
              className={styles.resetView}
              type="button"
              onClick={() => {
                setSourceQuery('')
                setTargetQuery('')
                setSort([])
                setDiscoverySeed(null)
                setSelectedTagIds(new Set())
                virtualRows.reset()
              }}
            >
              Restablecer filtros
            </button>
          )}
      </div>

      {(statusError || tagState.errorMessage) && (
        <p className={styles.statusError} role="alert">
          {statusError ?? tagState.errorMessage}
        </p>
      )}

      <div className={styles.headers}>
        <CatalogLanguageHeader
          languageLabel={dataset.sourceLanguage.label}
          query={sourceQuery}
          resultCount={displayedItems.length}
          side="source"
          sort={sort}
          onQueryChange={(query) => changeQuery('source', query)}
          onCycleSort={changeSort}
        />
        <div className={styles.headerGutter} aria-hidden="true" />
        <CatalogLanguageHeader
          languageLabel={dataset.targetLanguage.label}
          query={targetQuery}
          resultCount={displayedItems.length}
          side="target"
          sort={sort}
          onQueryChange={(query) => changeQuery('target', query)}
          onCycleSort={changeSort}
        />
      </div>

      <div
        ref={scrollerRef}
        className={styles.scroller}
        onScroll={virtualRows.onScroll}
      >
        {displayedItems.length === 0 ? (
          <p className={styles.empty}>
            {discardedView
              ? 'No hay semordnilaps descartados que coincidan con ambas búsquedas.'
              : 'No hay semordnilaps que coincidan con ambas búsquedas.'}
          </p>
        ) : (
          <ol
            className={styles.rows}
            aria-label="Semordnilaps filtrados"
            style={{
              paddingTop: `calc(0.3rem + ${virtualRows.paddingTop}px)`,
              paddingBottom: `calc(0.3rem + ${virtualRows.paddingBottom}px)`,
            }}
          >
            {renderedItems.map((item, renderedIndex) => {
              const id = item.semordnilap.id
              const selectedCount = selectedCounts.get(id) ?? 0
              const selected = selectedIds.has(id)
              const text = `${item.semordnilap.source.text} / ${item.semordnilap.target.text}`
              const favorite = hasStatus(id, 'favorite')
              const itemTags = tagsForSemordnilap(
                id,
                tagState.tags,
                tagState.assignments,
              )

              return (
                <li
                  className={styles.row}
                  key={id}
                  aria-posinset={virtualRows.start + renderedIndex + 1}
                  aria-setsize={displayedItems.length}
                >
                  <SemordnilapOption
                    item={item}
                    side="source"
                    selectedCount={selectedCount}
                    selectionMode={selectionMode}
                    selected={selected}
                    query={sourceQuery}
                    tags={itemTags}
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
                    composite={item.semordnilap.kind === 'composite'}
                    onToggleFavorite={() =>
                      void (favorite
                        ? onRemoveStatus([id], 'favorite')
                        : onAddStatus([id], 'favorite'))
                    }
                    onDiscard={() => discard([id])}
                    onRestore={() => void onRemoveStatus([id], 'discarded')}
                    onToggleSelection={() => toggleSelection(id)}
                    onOpenComposite={() => {
                      if (item.semordnilap.kind === 'composite') {
                        onOpenComposite(item.semordnilap)
                      }
                    }}
                  />
                  <SemordnilapOption
                    item={item}
                    side="target"
                    selectedCount={selectedCount}
                    selectionMode={selectionMode}
                    selected={selected}
                    query={targetQuery}
                    tags={itemTags}
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
