import styles from './SemordnilapComponent.module.css'

type SemordnilapComponentProps = {
  text: string
  instanceId: number
  tone: 'source' | 'target'
  onRemove: (instanceId: number) => void
  canMoveLeft: boolean
  canMoveRight: boolean
  onMoveLeft: () => void
  onMoveRight: () => void
}

export function SemordnilapComponent({
  text,
  instanceId,
  tone,
  onRemove,
  canMoveLeft,
  canMoveRight,
  onMoveLeft,
  onMoveRight,
}: SemordnilapComponentProps) {
  return (
    <li className={styles.component} data-tone={tone}>
      <span>{text}</span>
      <div className={styles.controls}>
        <button
          type="button"
          disabled={!canMoveLeft}
          onClick={onMoveLeft}
          aria-label={`Mover ${text} a la izquierda`}
        >
          <span aria-hidden="true">‹</span>
        </button>
        <button
          type="button"
          disabled={!canMoveRight}
          onClick={onMoveRight}
          aria-label={`Mover ${text} a la derecha`}
        >
          <span aria-hidden="true">›</span>
        </button>
        <button
          className={styles.remove}
          type="button"
          onClick={() => onRemove(instanceId)}
          aria-label={`Retirar ${text} de la composición`}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </li>
  )
}
