import type { CatalogViewMode, SemordnilapTag, TagId } from '@/application'
import type { ResponsiveLayout } from '@/presentation/responsive/useResponsiveLayout'

import styles from './PairedSemordnilapCatalog.module.css'
import { CatalogViewSwitcher } from './CatalogViewSwitcher'
import { TagFilterMenu } from './TagControls'
import { CatalogQualityControl } from './CatalogQualityControl'
import type { CatalogQualityFilters } from './catalog-items-view'

type CatalogToolbarProps = {
  layout: ResponsiveLayout
  viewMode: CatalogViewMode
  viewCounts: Readonly<Record<CatalogViewMode, number>>
  tags: readonly SemordnilapTag[]
  selectedTagIds: ReadonlySet<TagId>
  discoveryActive: boolean
  discoveryCount: number
  discoveryTotal: number
  statusesReady: boolean
  visibleCount: number
  hasViewModifiers: boolean
  discardedCount: number
  onViewChange: (mode: CatalogViewMode) => void
  onApplyTagFilter: (tagIds: ReadonlySet<TagId>) => void
  onManageTags: () => void
  onDiscover: () => void
  onSelect: () => void
  onReset: () => void
  onRestoreAll: () => void
  wordFilterOptions: readonly {
    code: string
    label: string
    count: number
    active: boolean
  }[]
  onToggleWordFilter: (language: string) => void
  qualityFilters: CatalogQualityFilters
  sourceLanguage: string
  targetLanguage: string
  wordFilterHiddenCount: number
  onQualityFiltersChange: (filters: CatalogQualityFilters) => void
}

export function CatalogToolbar({
  layout,
  viewMode,
  viewCounts,
  tags,
  selectedTagIds,
  discoveryActive,
  discoveryCount,
  discoveryTotal,
  statusesReady,
  visibleCount,
  hasViewModifiers,
  discardedCount,
  onViewChange,
  onApplyTagFilter,
  onManageTags,
  onDiscover,
  onSelect,
  onReset,
  onRestoreAll,
  wordFilterOptions,
  onToggleWordFilter,
  qualityFilters,
  sourceLanguage,
  targetLanguage,
  wordFilterHiddenCount,
  onQualityFiltersChange,
}: CatalogToolbarProps) {
  return (
    <>
      <div className={styles.primaryControls}>
        <CatalogViewSwitcher
          current={viewMode}
          counts={viewCounts}
          onChange={onViewChange}
        />
        <TagFilterMenu
          key={layout}
          tags={tags}
          selectedTagIds={selectedTagIds}
          layout={layout}
          onApply={onApplyTagFilter}
          onManage={onManageTags}
        />
        <CatalogQualityControl
          filters={qualityFilters}
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          onChange={onQualityFiltersChange}
        />
        {wordFilterOptions.map(({ code, label, count, active }) => {
          const countText = `${count} ${count === 1 ? 'palabra' : 'palabras'}`
          return (
            <button
              key={code}
              className={styles.wordFilterToggle}
              type="button"
              data-active={active}
              aria-pressed={active}
              aria-label={`${active ? 'Desactivar' : 'Activar'} filtro ${label}, ${countText}`}
              disabled={count === 0 && !active}
              onClick={() => onToggleWordFilter(code)}
            >
              {label} · {count}
            </button>
          )
        })}
        {wordFilterHiddenCount > 0 && (
          <span className={styles.filterImpact} aria-live="polite">
            {wordFilterHiddenCount}{' '}
            {wordFilterHiddenCount === 1
              ? 'resultado oculto'
              : 'resultados ocultos'}
          </span>
        )}
        {layout === 'compact' && hasViewModifiers && (
          <button
            className={styles.compactReset}
            type="button"
            aria-label="Restablecer filtros y orden"
            title="Restablecer filtros y orden"
            onClick={onReset}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 12a8 8 0 1 0 2.35-5.65L4 8.7M4 4v4.7h4.7" />
            </svg>
          </button>
        )}
      </div>
      {layout === 'wide' && (
        <div className={styles.secondaryControls}>
          <button
            className={styles.discovery}
            type="button"
            data-active={discoveryActive}
            aria-pressed={discoveryActive}
            onClick={onDiscover}
          >
            {discoveryActive ? 'Otro grupo' : 'Descubrir'}
          </button>
          {discoveryActive && (
            <strong>
              {discoveryCount} de {discoveryTotal}
            </strong>
          )}
          <button
            type="button"
            disabled={!statusesReady || visibleCount === 0}
            onClick={onSelect}
          >
            Seleccionar
          </button>
          {hasViewModifiers && (
            <button
              className={styles.resetView}
              type="button"
              onClick={onReset}
            >
              Restablecer
            </button>
          )}
          {viewMode === 'discarded' && (
            <button
              type="button"
              disabled={discardedCount === 0}
              onClick={onRestoreAll}
            >
              Restaurar todos
            </button>
          )}
        </div>
      )}
    </>
  )
}
