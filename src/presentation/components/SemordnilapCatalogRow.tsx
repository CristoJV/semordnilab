import type { SemordnilapCatalogItem, SemordnilapTag } from '@/application'
import type { SemordnilapId } from '@/domain/semordnilap'
import { useCatalogRowPointerInteraction } from '@/presentation/hooks/useCatalogRowPointerInteraction'
import type { CatalogSwipeDirection } from '@/presentation/interactions/catalog-row-pointer-machine'
import type { ResponsiveLayout } from '@/presentation/responsive/useResponsiveLayout'

import {
  CatalogSwipeFeedback,
  type CatalogSwipeAction,
} from './CatalogSwipeFeedback'
import { SemordnilapOption } from './SemordnilapOption'
import { SemordnilapRowActions } from './SemordnilapRowActions'
import { SemordnilapRowMetadata } from './SemordnilapRowMetadata'
import styles from './SemordnilapCatalogRow.module.css'

type SemordnilapCatalogRowProps = {
  item: SemordnilapCatalogItem
  position: number
  setSize: number
  sourceQuery: string
  targetQuery: string
  selectedCount: number
  favorite: boolean
  discardedView: boolean
  selectionMode: boolean
  selected: boolean
  statusesReady: boolean
  tags: readonly SemordnilapTag[]
  layout: ResponsiveLayout
  onAdd: (item: SemordnilapCatalogItem) => void
  onEnterSelection: (semordnilapId: SemordnilapId) => void
  onToggleSelection: () => void
  onToggleFavorite: () => void
  onDiscard: () => void
  onRestore: () => void
  onSwipe: (direction: CatalogSwipeDirection) => void
  onOpenComposite: () => void
}

export function SemordnilapCatalogRow({
  item,
  position,
  setSize,
  sourceQuery,
  targetQuery,
  selectedCount,
  favorite,
  discardedView,
  selectionMode,
  selected,
  statusesReady,
  tags,
  layout,
  onAdd,
  onEnterSelection,
  onToggleSelection,
  onToggleFavorite,
  onDiscard,
  onRestore,
  onSwipe,
  onOpenComposite,
}: SemordnilapCatalogRowProps) {
  const id = item.semordnilap.id
  const text = `${item.semordnilap.source.text} / ${item.semordnilap.target.text}`
  const interaction = useCatalogRowPointerInteraction({
    enabled: layout === 'compact' && statusesReady && !selectionMode,
    semordnilapId: id,
    onSelect: onEnterSelection,
    onSwipe: (_semordnilapId, direction) => onSwipe(direction),
  })
  const swiping =
    interaction.state.value === 'swiping' ? interaction.state : null
  const swipeAction: CatalogSwipeAction | null = swiping
    ? swiping.direction === 'right'
      ? favorite
        ? 'unfavorite'
        : 'favorite'
      : discardedView
        ? 'restore'
        : 'discard'
    : null

  return (
    <li
      className={styles.shell}
      aria-posinset={position}
      aria-setsize={setSize}
    >
      {layout === 'compact' && (
        <CatalogSwipeFeedback
          action={swipeAction}
          direction={swiping?.direction ?? null}
          ready={swiping?.ready ?? false}
        />
      )}
      <div
        {...interaction.bindings}
        className={styles.row}
        data-selected={selected}
        data-long-press-pending={interaction.state.value === 'pending'}
        data-swiping={Boolean(swiping)}
        style={{
          transform: `translate3d(${swiping?.offsetX ?? 0}px, 0, 0)`,
        }}
      >
        <SemordnilapOption
          item={item}
          side="source"
          selectionMode={selectionMode}
          selected={selected}
          query={sourceQuery}
          tags={tags}
          metadata={<SemordnilapRowMetadata kind="tags" tags={tags} />}
          onAdd={onAdd}
          onToggleSelection={onToggleSelection}
        />
        <SemordnilapRowActions
          text={text}
          favorite={favorite}
          discardedView={discardedView}
          selectionMode={selectionMode}
          selected={selected}
          disabled={!statusesReady}
          composite={item.semordnilap.kind === 'composite'}
          layout={layout}
          onToggleFavorite={onToggleFavorite}
          onDiscard={onDiscard}
          onRestore={onRestore}
          onToggleSelection={onToggleSelection}
          onOpenComposite={onOpenComposite}
        />
        <SemordnilapOption
          item={item}
          side="target"
          selectionMode={selectionMode}
          selected={selected}
          query={targetQuery}
          tags={tags}
          metadata={
            <SemordnilapRowMetadata kind="usage" count={selectedCount} />
          }
          onAdd={onAdd}
          onToggleSelection={onToggleSelection}
        />
      </div>
    </li>
  )
}
