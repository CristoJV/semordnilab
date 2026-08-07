import type { SemordnilapCatalogItem, SemordnilapTag } from '@/application'
import type { CatalogLongPressBindings } from '@/presentation/hooks/useCatalogLongPressSelection'

import { HighlightedText } from './HighlightedText'
import { TagDots } from './TagControls'
import styles from './SemordnilapOption.module.css'

type SemordnilapOptionProps = {
  item: SemordnilapCatalogItem
  side: 'source' | 'target'
  selectedCount: number
  selectionMode: boolean
  selected: boolean
  query: string
  tags: readonly SemordnilapTag[]
  longPressPending?: boolean
  longPressBindings?: CatalogLongPressBindings
  onAdd: (item: SemordnilapCatalogItem) => void
  onToggleSelection: () => void
}

export function SemordnilapOption({
  item,
  side,
  selectedCount,
  selectionMode,
  selected,
  query,
  tags,
  longPressPending = false,
  longPressBindings,
  onAdd,
  onToggleSelection,
}: SemordnilapOptionProps) {
  const expression = item.semordnilap[side]
  const frequency = item.metadata
    ? side === 'source'
      ? item.metadata.sourceFrequency
      : item.metadata.targetFrequency
    : null

  return (
    <button
      {...longPressBindings}
      className={styles.button}
      data-side={side}
      data-selected={selected}
      data-long-press-pending={longPressPending}
      type="button"
      onClick={() => (selectionMode ? onToggleSelection() : onAdd(item))}
      title={
        frequency === null
          ? `${expression.text}. Semordnilap compuesto guardado${tags.length > 0 ? `. Etiquetas: ${tags.map(({ name }) => name).join(', ')}` : ''}`
          : `${expression.text}. Frecuencia en el corpus: ${frequency.toLocaleString('es-ES')}${tags.length > 0 ? `. Etiquetas: ${tags.map(({ name }) => name).join(', ')}` : ''}`
      }
      aria-label={
        selectionMode
          ? `${selected ? 'Deseleccionar' : 'Seleccionar'} ${expression.text}`
          : `Añadir ${expression.text} a la composición`
      }
    >
      <span className={styles.text}>
        <HighlightedText text={expression.text} query={query} />
      </span>
      <TagDots tags={tags} />
      {selectedCount > 0 && (
        <span className={styles.count} aria-label={`${selectedCount} añadidos`}>
          {selectedCount}
        </span>
      )}
    </button>
  )
}
