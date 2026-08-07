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
  CatalogSortDirection,
} from '@/application'
import type {
  CompositeSemordnilap,
  Semordnilap,
  SemordnilapId,
} from '@/domain/semordnilap'
import type { SemordnilapStatusMap } from '@/presentation/hooks/useSemordnilapStatuses'
import { useCatalogLongPressSelection } from '@/presentation/hooks/useCatalogLongPressSelection'
import type { Notify } from '@/presentation/hooks/useTransientNotifications'
import type { SemordnilapTagState } from '@/presentation/hooks/useSemordnilapTags'
import { useVirtualCatalogRows } from '@/presentation/hooks/useVirtualCatalogRows'
import type { ResponsiveLayout } from '@/presentation/responsive/useResponsiveLayout'

import { CatalogLanguageHeader } from './CatalogLanguageHeader'
import { CatalogViewSwitcher } from './CatalogViewSwitcher'
import { selectDiscoveryItems } from './catalog-discovery'
import { selectVisibleCatalogItems } from './catalog-items-view'
import { normalizeCatalogQuery } from './catalog-search'
import { cycleCatalogSort, setCatalogSort } from './catalog-sort'
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
  layout: ResponsiveLayout
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
  layout,
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

  const changeSortDirection = (
    field: CatalogSortField,
    side: CatalogSide,
    direction: CatalogSortDirection | null,
  ) => {
    setDiscoverySeed(null)
    setSort((current) => setCatalogSort(current, field, side, direction))
    virtualRows.reset()
  }

  const resetView = () => {
    setSourceQuery('')
    setTargetQuery('')
    setSort([])
    setDiscoverySeed(null)
    setSelectedTagIds(new Set())
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

  const applyTagFilter = (tagIds: ReadonlySet<TagId>) => {
    setDiscoverySeed(null)
    setSelectedTagIds(new Set(tagIds))
    virtualRows.reset()
  }

  const longPressSelection = useCatalogLongPressSelection({
    enabled: layout === 'compact' && statusesReady && !selectionMode,
    onSelect: (semordnilapId) => {
      setDiscoverySeed(null)
      setSelectionMode(true)
      setSelectedIds(new Set([semordnilapId]))
    },
  })

  return (
    <section
      className={styles.catalog}
      data-has-error={Boolean(statusError || tagState.errorMessage)}
      aria-label="Catálogo bilingüe"
    >
      <div className={styles.toolbar}>
        {selectionMode ? (
          <div className={styles.selectionControls}>
            <strong>
              {selectedIds.size}{' '}
              {selectedIds.size === 1 ? 'seleccionado' : 'seleccionados'}
            </strong>
            <div
              className={styles.selectionActions}
              aria-label="Acciones para la selección"
            >
              <button
                className={styles.selectionAction}
                type="button"
                aria-label="Añadir a favoritos"
                title="Añadir a favoritos"
                disabled={selectedIds.size === 0}
                onClick={() => applySelectedStatus('favorite')}
              >
                <span className={styles.selectionActionIcon} aria-hidden="true">
                  ★
                </span>
                <span className={styles.selectionActionLabel}>
                  Añadir a favoritos
                </span>
              </button>
              <button
                className={styles.selectionAction}
                data-kind={discardedView ? 'restore' : 'discard'}
                type="button"
                aria-label={discardedView ? 'Restaurar' : 'Descartar'}
                title={discardedView ? 'Restaurar' : 'Descartar'}
                disabled={selectedIds.size === 0}
                onClick={() =>
                  discardedView
                    ? removeSelectedStatus('discarded')
                    : applySelectedStatus('discarded')
                }
              >
                <span className={styles.selectionActionIcon} aria-hidden="true">
                  {discardedView ? (
                    '↩'
                  ) : (
                    <svg viewBox="0 0 24 24">
                      <path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" />
                    </svg>
                  )}
                </span>
                <span className={styles.selectionActionLabel}>
                  {discardedView ? 'Restaurar' : 'Descartar'}
                </span>
              </button>
              <TagAssignmentMenu
                tags={tagState.tags}
                selectedIds={[...selectedIds]}
                assignments={tagState.assignments}
                onApply={(changes) =>
                  tagState.applyTo([...selectedIds], changes)
                }
                onManage={onManageTags}
              />
            </div>
            <button
              className={styles.closeSelection}
              type="button"
              aria-label="Cerrar selección"
              title="Cerrar selección"
              onClick={leaveSelectionMode}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
        ) : (
          <>
            <div className={styles.primaryControls}>
              <CatalogViewSwitcher
                current={viewMode}
                counts={{
                  active: items.length - discardedCount,
                  saved: savedCount,
                  favorites: favoriteCount,
                  discarded: discardedCount,
                }}
                onChange={(mode) => {
                  setDiscoverySeed(null)
                  setViewMode(mode)
                  leaveSelectionMode()
                  virtualRows.reset()
                }}
              />
              <TagFilterMenu
                key={layout}
                tags={tagState.tags}
                selectedTagIds={effectiveSelectedTagIds}
                layout={layout}
                onApply={applyTagFilter}
                onManage={onManageTags}
              />
            </div>
            <div className={styles.secondaryControls}>
              <button
                type="button"
                disabled={!statusesReady || visibleItems.length === 0}
                onClick={() => setSelectionMode(true)}
              >
                Seleccionar varios
              </button>
              {(sourceQuery ||
                targetQuery ||
                sort.length > 0 ||
                effectiveSelectedTagIds.size > 0) && (
                <button
                  className={styles.resetView}
                  type="button"
                  onClick={resetView}
                >
                  Restablecer
                </button>
              )}
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
            </div>
          </>
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
          layout={layout}
          side="source"
          sort={sort}
          onQueryChange={(query) => changeQuery('source', query)}
          onCycleSort={changeSort}
          onSetSort={changeSortDirection}
        />
        <div className={styles.headerGutter} aria-hidden="true" />
        <CatalogLanguageHeader
          languageLabel={dataset.targetLanguage.label}
          query={targetQuery}
          resultCount={displayedItems.length}
          layout={layout}
          side="target"
          sort={sort}
          onQueryChange={(query) => changeQuery('target', query)}
          onCycleSort={changeSort}
          onSetSort={changeSortDirection}
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
                    longPressPending={
                      longPressSelection.pendingSemordnilapId === id
                    }
                    longPressBindings={longPressSelection.bind(id)}
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
                    longPressPending={
                      longPressSelection.pendingSemordnilapId === id
                    }
                    longPressBindings={longPressSelection.bind(id)}
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
