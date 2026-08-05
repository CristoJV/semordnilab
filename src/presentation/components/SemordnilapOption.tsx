import type { SemordnilapCatalogItem } from '@/application'

import styles from './SemordnilapOption.module.css'

type SemordnilapOptionProps = {
  item: SemordnilapCatalogItem
  side: 'source' | 'target'
  selectedCount: number
  selectionMode: boolean
  selected: boolean
  onAdd: (item: SemordnilapCatalogItem) => void
  onToggleSelection: () => void
}

export function SemordnilapOption({
  item,
  side,
  selectedCount,
  selectionMode,
  selected,
  onAdd,
  onToggleSelection,
}: SemordnilapOptionProps) {
  const expression = item.semordnilap[side]
  const frequency =
    side === 'source'
      ? item.metadata.sourceFrequency
      : item.metadata.targetFrequency

  return (
    <button
      className={styles.button}
      data-side={side}
      data-selected={selected}
      type="button"
      onClick={() => (selectionMode ? onToggleSelection() : onAdd(item))}
      title={`Frecuencia en el corpus: ${frequency.toLocaleString('es-ES')}`}
      aria-label={
        selectionMode
          ? `${selected ? 'Deseleccionar' : 'Seleccionar'} ${expression.text}`
          : `Añadir ${expression.text} a la composición`
      }
    >
      <span className={styles.text}>{expression.text}</span>
      {selectedCount > 0 && (
        <span className={styles.count} aria-label={`${selectedCount} añadidos`}>
          {selectedCount}
        </span>
      )}
    </button>
  )
}
