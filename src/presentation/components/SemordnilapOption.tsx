import type { SemordnilapCatalogItem } from '@/application'

import { HighlightedText } from './HighlightedText'
import styles from './SemordnilapOption.module.css'

type SemordnilapOptionProps = {
  item: SemordnilapCatalogItem
  side: 'source' | 'target'
  selectedCount: number
  selectionMode: boolean
  selected: boolean
  query: string
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
      className={styles.button}
      data-side={side}
      data-selected={selected}
      type="button"
      onClick={() => (selectionMode ? onToggleSelection() : onAdd(item))}
      title={
        frequency === null
          ? `${expression.text}. Semordnilap compuesto guardado`
          : `${expression.text}. Frecuencia en el corpus: ${frequency.toLocaleString('es-ES')}`
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
      {selectedCount > 0 && (
        <span className={styles.count} aria-label={`${selectedCount} añadidos`}>
          {selectedCount}
        </span>
      )}
    </button>
  )
}
