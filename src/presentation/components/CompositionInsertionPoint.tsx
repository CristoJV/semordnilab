import styles from './CompositionInsertionPoint.module.css'

type CompositionInsertionPointProps = {
  index: number
  active: boolean
  onSelect: (index: number) => void
  languageLabel: string
}

export function CompositionInsertionPoint({
  index,
  active,
  onSelect,
  languageLabel,
}: CompositionInsertionPointProps) {
  return (
    <li className={styles.item} role="presentation">
      <button
        className={styles.button}
        data-active={active}
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
