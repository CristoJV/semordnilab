import styles from './CompositionInsertionPoint.module.css'

type CompositionInsertionPointProps = {
  index: number
  tone: 'source' | 'target'
  active: boolean
  onSelect: (index: number) => void
  languageLabel: string
  dragging?: boolean
  dropTarget?: boolean
}

export function CompositionInsertionPoint({
  index,
  tone,
  active,
  onSelect,
  languageLabel,
  dragging = false,
  dropTarget = false,
}: CompositionInsertionPointProps) {
  return (
    <li
      className={styles.item}
      data-active={active}
      data-dragging={dragging}
      data-drop-target={dropTarget}
      data-tone={tone}
      data-composition-index={index}
      role="presentation"
    >
      <button
        className={styles.button}
        type="button"
        onClick={() => onSelect(index)}
        aria-label={`Insertar el próximo semordnilap en la posición ${index + 1} de ${languageLabel}`}
        aria-pressed={active}
      >
        <span aria-hidden="true">+</span>
      </button>
    </li>
  )
}
