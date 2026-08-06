import type { KeyboardEvent } from 'react'

import type { CompositionPointerBindings } from '@/presentation/hooks/useCompositionPointerInteraction'

import styles from './SemordnilapComponent.module.css'

type SemordnilapComponentProps = {
  text: string
  tone: 'source' | 'target'
  dragging: boolean
  pointerBindings: CompositionPointerBindings
  onRemove: () => void
  canMoveLeft: boolean
  canMoveRight: boolean
  onMoveLeft: () => void
  onMoveRight: () => void
}

export function SemordnilapComponent({
  text,
  tone,
  dragging,
  pointerBindings,
  onRemove,
  canMoveLeft,
  canMoveRight,
  onMoveLeft,
  onMoveRight,
}: SemordnilapComponentProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLLIElement>) => {
    if (
      event.key === 'Delete' ||
      event.key === 'Backspace' ||
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault()
      onRemove()
      return
    }
    if (!event.shiftKey) return
    if (event.key === 'ArrowLeft' && canMoveLeft) {
      event.preventDefault()
      onMoveLeft()
    }
    if (event.key === 'ArrowRight' && canMoveRight) {
      event.preventDefault()
      onMoveRight()
    }
  }

  return (
    <li
      className={styles.component}
      data-tone={tone}
      data-dragging={dragging}
      tabIndex={0}
      aria-label={`${text}. Pulsa Intro para retirar, arrastra para mover.`}
      aria-keyshortcuts="Enter Space Delete Backspace Shift+ArrowLeft Shift+ArrowRight"
      title="Pulsa para retirar. Arrastra para mover."
      onKeyDown={handleKeyDown}
      onContextMenu={(event) => event.preventDefault()}
      {...pointerBindings}
    >
      {text}
    </li>
  )
}
