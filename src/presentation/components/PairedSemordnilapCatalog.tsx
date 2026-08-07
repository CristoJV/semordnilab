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
  SemordnilapStatusSelection,
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
import { useCatalogSwipeHint } from '@/presentation/hooks/useCatalogSwipeHint'
import type { Notify } from '@/presentation/hooks/useTransientNotifications'
import type { SemordnilapTagState } from '@/presentation/hooks/useSemordnilapTags'
import { useVirtualCatalogRows } from '@/presentation/hooks/useVirtualCatalogRows'
import type { CatalogSwipeDirection } from '@/presentation/interactions/catalog-row-pointer-machine'
import type { ResponsiveLayout } from '@/presentation/responsive/useResponsiveLayout'

import { CatalogLanguageHeader } from './CatalogLanguageHeader'
import { CatalogDiscoveryFab } from './CatalogDiscoveryFab'
import { CatalogSelectionToolbar } from './CatalogSelectionToolbar'
import { CatalogToolbar } from './CatalogToolbar'
import {
  advanceDiscoverySession,
  resolveDiscoveryItems,
  type CatalogDiscoverySession,
} from './catalog-discovery'
import { selectVisibleCatalogItems } from './catalog-items-view'
import { normalizeCatalogQuery } from './catalog-search'
import { cycleCatalogSort, setCatalogSort } from './catalog-sort'
import type { CatalogSide, CatalogSort, CatalogSortField } from './catalog-view'
import { RestoreAllDiscardedDialog } from './RestoreAllDiscardedDialog'
import { SemordnilapCatalogRow } from './SemordnilapCatalogRow'
import { tagsForSemordnilap } from './tag-view'
import styles from './PairedSemordnilapCatalog.module.css'

const RESTORE_CONFIRMATION_THRESHOLD = 10

type PairedSemordnilapCatalogProps = {
  dataset: AvailableDataset
  items: readonly SemordnilapCatalogItem[]
  selectedCounts: ReadonlyMap<string, number>
  statuses: SemordnilapStatusMap
  statusesReady: boolean
  statusError: string | null
  tagState: SemordnilapTagState
  onAdd: (semordnilap: Semordnilap) => void
  onSetStatuses: (
    selections: readonly SemordnilapStatusSelection[],
  ) => Promise<void>
  onRemoveAllStatus: (status: SemordnilapCatalogStatus) => Promise<void>
  initialView?: DatasetCatalogViewPreference
  onViewChange: (view: DatasetCatalogViewPreference) => void
  onOpenComposite: (composite: CompositeSemordnilap) => void
  onManageTags: () => void
  onNotify: Notify
  layout: ResponsiveLayout
  overlayOpen: boolean
  selectionRequested: boolean
  onSelectionRequestHandled: () => void
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
  onSetStatuses,
  onRemoveAllStatus,
  initialView,
  onViewChange,
  onOpenComposite,
  onManageTags,
  onNotify,
  layout,
  overlayOpen,
  selectionRequested,
  onSelectionRequestHandled,
}: PairedSemordnilapCatalogProps) {
  const [sourceQuery, setSourceQuery] = useState(initialView?.sourceQuery ?? '')
  const [targetQuery, setTargetQuery] = useState(initialView?.targetQuery ?? '')
  const [viewMode, setViewMode] = useState<CatalogViewMode>(
    initialView?.viewMode ?? 'active',
  )
  const [sort, setSort] = useState<CatalogSort>(initialView?.sort ?? [])
  const [internalSelectionMode, setInternalSelectionMode] = useState(false)
  const [restoreAllConfirmation, setRestoreAllConfirmation] = useState(false)
  const [discoverySession, setDiscoverySession] =
    useState<CatalogDiscoverySession | null>(null)
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
  const selectionMode = selectionRequested || internalSelectionMode

  useCatalogSwipeHint(layout === 'compact' && statusesReady, onNotify)

  const effectiveSelectedTagIds = useMemo(() => {
    const available = new Set(tagState.tags.map(({ id }) => id))
    return new Set([...selectedTagIds].filter((id) => available.has(id)))
  }, [selectedTagIds, tagState.tags])
  const hasViewModifiers = Boolean(
    sourceQuery ||
    targetQuery ||
    sort.length > 0 ||
    effectiveSelectedTagIds.size > 0,
  )

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

  const discoveryEligibleItems = useMemo(() => {
    const activeAtomicItems = selectVisibleCatalogItems({
      items,
      viewMode: 'active',
      sourceQuery: '',
      targetQuery: '',
      sort: [],
      sourceLanguageCode: dataset.sourceLanguage.code,
      targetLanguageCode: dataset.targetLanguage.code,
      hasStatus,
    }).filter(({ semordnilap }) => semordnilap.kind === 'atomic')
    if (effectiveSelectedTagIds.size === 0) return activeAtomicItems
    return activeAtomicItems.filter((item) => {
      const assigned = tagState.assignments.get(item.semordnilap.id)
      return [...effectiveSelectedTagIds].some((tagId) => assigned?.has(tagId))
    })
  }, [
    dataset.sourceLanguage.code,
    dataset.targetLanguage.code,
    effectiveSelectedTagIds,
    hasStatus,
    items,
    tagState.assignments,
  ])

  const displayedItems = useMemo(
    () =>
      discoverySession === null
        ? visibleItems
        : resolveDiscoveryItems(discoveryEligibleItems, discoverySession),
    [discoveryEligibleItems, discoverySession, visibleItems],
  )
  const virtualRows = useVirtualCatalogRows(displayedItems.length, scrollerRef)
  const renderedItems = displayedItems.slice(virtualRows.start, virtualRows.end)

  const changeQuery = (side: CatalogSide, query: string) => {
    setDiscoverySession(null)
    if (side === 'source') setSourceQuery(query)
    else setTargetQuery(query)
    virtualRows.reset()
  }

  const changeSort = (field: CatalogSortField, side: CatalogSide) => {
    setDiscoverySession(null)
    setSort((current) => cycleCatalogSort(current, field, side))
    virtualRows.reset()
  }

  const changeSortDirection = (
    field: CatalogSortField,
    side: CatalogSide,
    direction: CatalogSortDirection | null,
  ) => {
    setDiscoverySession(null)
    setSort((current) => setCatalogSort(current, field, side, direction))
    virtualRows.reset()
  }

  const resetView = () => {
    setSourceQuery('')
    setTargetQuery('')
    setSort([])
    setDiscoverySession(null)
    setSelectedTagIds(new Set())
    virtualRows.reset()
  }

  const discover = () => {
    setSourceQuery('')
    setTargetQuery('')
    setSort([])
    setViewMode('active')
    setDiscoverySession((current) =>
      advanceDiscoverySession(discoveryEligibleItems, current),
    )
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
    setInternalSelectionMode(false)
    setSelectedIds(new Set())
    if (selectionRequested) onSelectionRequestHandled()
  }

  const applySelectedStatus = (status: SemordnilapCatalogStatus) => {
    const ids = [...selectedIds]
    if (status === 'discarded') discard(ids)
    else
      void onSetStatuses(
        ids.map((semordnilapId) => ({ semordnilapId, status })),
      )
    leaveSelectionMode()
  }

  const removeSelectedStatus = (status: SemordnilapCatalogStatus) => {
    if (status === 'discarded') restore([...selectedIds])
    else
      void onSetStatuses(
        [...selectedIds].map((semordnilapId) => ({
          semordnilapId,
          status: null,
        })),
      )
    leaveSelectionMode()
  }

  const discard = (ids: readonly SemordnilapId[]) => {
    const previousStatuses = ids.map((semordnilapId) => ({
      semordnilapId,
      status: hasStatus(semordnilapId, 'favorite')
        ? ('favorite' as const)
        : null,
    }))
    const removedFavorites = previousStatuses.filter(
      ({ status }) => status === 'favorite',
    ).length
    void onSetStatuses(
      ids.map((semordnilapId) => ({
        semordnilapId,
        status: 'discarded',
      })),
    )
    onNotify({
      tone: 'warning',
      message:
        ids.length === 1
          ? removedFavorites > 0
            ? 'Semordnilap descartado y retirado de favoritos.'
            : 'Semordnilap descartado.'
          : `${ids.length} semordnilaps descartados${removedFavorites > 0 ? ` (${removedFavorites} retirados de favoritos)` : ''}.`,
      action: {
        label: 'Deshacer descarte',
        run: () => void onSetStatuses(previousStatuses),
      },
      lifetime: 4200,
    })
  }

  const restore = (ids: readonly SemordnilapId[]) => {
    void onSetStatuses(
      ids.map((semordnilapId) => ({ semordnilapId, status: null })),
    )
    onNotify({
      tone: 'success',
      message:
        ids.length === 1
          ? 'Semordnilap restaurado.'
          : `${ids.length} semordnilaps restaurados.`,
      action: {
        label: 'Deshacer restauración',
        run: () =>
          void onSetStatuses(
            ids.map((semordnilapId) => ({
              semordnilapId,
              status: 'discarded',
            })),
          ),
      },
      lifetime: 4200,
    })
  }

  const toggleFavorite = (semordnilapId: SemordnilapId, favorite: boolean) => {
    void onSetStatuses([
      { semordnilapId, status: favorite ? null : 'favorite' },
    ])
    onNotify({
      tone: 'success',
      message: favorite
        ? 'Semordnilap retirado de favoritos.'
        : 'Semordnilap añadido a favoritos.',
      action: {
        label: 'Deshacer favorito',
        run: () =>
          void onSetStatuses([
            { semordnilapId, status: favorite ? 'favorite' : null },
          ]),
      },
      lifetime: 4200,
    })
  }

  const restoreAll = () => {
    const ids = items
      .filter((item) => hasStatus(item.semordnilap.id, 'discarded'))
      .map((item) => item.semordnilap.id)
    setRestoreAllConfirmation(false)
    void onRemoveAllStatus('discarded')
    onNotify({
      tone: 'success',
      message: `${ids.length} semordnilaps restaurados.`,
      action: {
        label: 'Deshacer restauración',
        run: () =>
          void onSetStatuses(
            ids.map((semordnilapId) => ({
              semordnilapId,
              status: 'discarded',
            })),
          ),
      },
      lifetime: 5200,
    })
  }

  const requestRestoreAll = () => {
    if (discardedCount >= RESTORE_CONFIRMATION_THRESHOLD) {
      setRestoreAllConfirmation(true)
    } else {
      restoreAll()
    }
  }

  const applySwipe = (
    semordnilapId: SemordnilapId,
    favorite: boolean,
    direction: CatalogSwipeDirection,
  ) => {
    if (discardedView) {
      if (direction === 'left') restore([semordnilapId])
    } else if (direction === 'right') toggleFavorite(semordnilapId, favorite)
    else discard([semordnilapId])
  }

  const applyTagFilter = (tagIds: ReadonlySet<TagId>) => {
    setDiscoverySession(null)
    setSelectedTagIds(new Set(tagIds))
    virtualRows.reset()
  }

  const enterSelection = (semordnilapId: SemordnilapId) => {
    setDiscoverySession(null)
    setInternalSelectionMode(true)
    setSelectedIds(new Set([semordnilapId]))
  }

  const allDisplayedSelected =
    displayedItems.length > 0 &&
    displayedItems.every(({ semordnilap }) => selectedIds.has(semordnilap.id))
  const someDisplayedSelected = displayedItems.some(({ semordnilap }) =>
    selectedIds.has(semordnilap.id),
  )
  const selectionState = allDisplayedSelected
    ? 'checked'
    : someDisplayedSelected
      ? 'mixed'
      : 'empty'

  const toggleAllDisplayed = () => {
    setSelectedIds(
      allDisplayedSelected
        ? new Set()
        : new Set(displayedItems.map(({ semordnilap }) => semordnilap.id)),
    )
  }

  return (
    <section
      className={styles.catalog}
      data-has-error={Boolean(statusError || tagState.errorMessage)}
      aria-label="Catálogo bilingüe"
    >
      <div className={styles.toolbar}>
        {selectionMode ? (
          <CatalogSelectionToolbar
            state={selectionState}
            resultCount={displayedItems.length}
            selectedIds={[...selectedIds]}
            discardedView={discardedView}
            tags={tagState.tags}
            assignments={tagState.assignments}
            onToggleAll={toggleAllDisplayed}
            onFavorite={() => applySelectedStatus('favorite')}
            onDiscardOrRestore={() =>
              discardedView
                ? removeSelectedStatus('discarded')
                : applySelectedStatus('discarded')
            }
            onApplyTags={(changes) =>
              tagState.applyTo([...selectedIds], changes)
            }
            onManageTags={onManageTags}
            onClose={leaveSelectionMode}
          />
        ) : (
          <CatalogToolbar
            layout={layout}
            viewMode={viewMode}
            viewCounts={{
              active: items.length - discardedCount,
              saved: savedCount,
              favorites: favoriteCount,
              discarded: discardedCount,
            }}
            tags={tagState.tags}
            selectedTagIds={effectiveSelectedTagIds}
            discoveryActive={discoverySession !== null}
            discoveryCount={displayedItems.length}
            discoveryTotal={discoveryEligibleItems.length}
            statusesReady={statusesReady}
            visibleCount={visibleItems.length}
            hasViewModifiers={hasViewModifiers}
            discardedCount={discardedCount}
            onViewChange={(mode) => {
              setDiscoverySession(null)
              setViewMode(mode)
              leaveSelectionMode()
              virtualRows.reset()
            }}
            onApplyTagFilter={applyTagFilter}
            onManageTags={onManageTags}
            onDiscover={discover}
            onSelect={() => setInternalSelectionMode(true)}
            onReset={resetView}
            onRestoreAll={requestRestoreAll}
          />
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
              paddingBottom: `calc(0.3rem + ${virtualRows.paddingBottom}px${layout === 'compact' && !selectionMode ? ' + 4.75rem + env(safe-area-inset-bottom)' : ''})`,
            }}
          >
            {renderedItems.map((item, renderedIndex) => {
              const id = item.semordnilap.id
              const selectedCount = selectedCounts.get(id) ?? 0
              const selected = selectedIds.has(id)
              const favorite = hasStatus(id, 'favorite')
              const itemTags = tagsForSemordnilap(
                id,
                tagState.tags,
                tagState.assignments,
              )

              return (
                <SemordnilapCatalogRow
                  key={id}
                  item={item}
                  position={virtualRows.start + renderedIndex + 1}
                  setSize={displayedItems.length}
                  sourceQuery={sourceQuery}
                  targetQuery={targetQuery}
                  selectedCount={selectedCount}
                  favorite={favorite}
                  discardedView={discardedView}
                  selectionMode={selectionMode}
                  selected={selected}
                  statusesReady={statusesReady}
                  tags={itemTags}
                  layout={layout}
                  onAdd={({ semordnilap }) => onAdd(semordnilap)}
                  onEnterSelection={enterSelection}
                  onToggleSelection={() => toggleSelection(id)}
                  onToggleFavorite={() => toggleFavorite(id, favorite)}
                  onDiscard={() => discard([id])}
                  onRestore={() => restore([id])}
                  onSwipe={(direction) => applySwipe(id, favorite, direction)}
                  onOpenComposite={() => {
                    if (item.semordnilap.kind === 'composite') {
                      onOpenComposite(item.semordnilap)
                    }
                  }}
                />
              )
            })}
          </ol>
        )}
      </div>
      {layout === 'compact' && !selectionMode && !overlayOpen && (
        <CatalogDiscoveryFab
          active={discoverySession !== null}
          onClick={discover}
        />
      )}
      {restoreAllConfirmation && (
        <RestoreAllDiscardedDialog
          count={discardedCount}
          onCancel={() => setRestoreAllConfirmation(false)}
          onConfirm={restoreAll}
        />
      )}
    </section>
  )
}
