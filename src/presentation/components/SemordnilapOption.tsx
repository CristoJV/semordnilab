import type { SemordnilapCatalogItem, SemordnilapTag } from '@/application'

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
      <span className={styles.metadata}>
        <TagDots tags={tags} />
        <span
          className={styles.count}
          data-visible={selectedCount > 0}
          aria-label={
            selectedCount > 0 ? `${selectedCount} añadidos` : undefined
          }
          aria-hidden={selectedCount === 0}
        >
          {selectedCount > 0 ? selectedCount : ''}
        </span>
      </span>
    </button>
  )
}
