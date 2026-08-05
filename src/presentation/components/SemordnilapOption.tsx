import type { SemordnilapCatalogItem } from '@/application'

import styles from './SemordnilapOption.module.css'

type SemordnilapOptionProps = {
  item: SemordnilapCatalogItem
  side: 'source' | 'target'
  selectedCount: number
  onAdd: (item: SemordnilapCatalogItem) => void
}

export function SemordnilapOption({
  item,
  side,
  selectedCount,
  onAdd,
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
      type="button"
      onClick={() => onAdd(item)}
      title={`Frecuencia en el corpus: ${frequency.toLocaleString('es-ES')}`}
      aria-label={`Añadir ${expression.text} a la composición`}
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
