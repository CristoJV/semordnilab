import styles from './SemordnilapComponent.module.css'

type SemordnilapComponentProps = {
  text: string
  instanceId: number
  tone: 'source' | 'target'
  onRemove: (instanceId: number) => void
}

export function SemordnilapComponent({
  text,
  instanceId,
  tone,
  onRemove,
}: SemordnilapComponentProps) {
  return (
    <li className={styles.component} data-tone={tone}>
      <span>{text}</span>
      <button
        className={styles.remove}
        type="button"
        onClick={() => onRemove(instanceId)}
        aria-label={`Retirar ${text} de la composición`}
      >
        <span aria-hidden="true">×</span>
      </button>
    </li>
  )
}
