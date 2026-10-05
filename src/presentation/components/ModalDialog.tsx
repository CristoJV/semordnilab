import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import styles from './ModalDialog.module.css'

type ModalDialogProps = {
  title: ReactNode
  onClose: () => void
  children: ReactNode
  accessibleLabel?: string
  wide?: boolean
  centered?: boolean
  drawer?: boolean
}

export function ModalDialog({
  title,
  onClose,
  children,
  accessibleLabel,
  wide = false,
  centered = false,
  drawer = false,
}: ModalDialogProps) {
  const titleId = useId()
  const closeButton = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    closeButton.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
      if (event.key !== 'Tab') return
      const focusable = dialog.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [])

  return createPortal(
    <div
      className={styles.backdrop}
      data-centered={centered}
      data-drawer={drawer}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCloseRef.current()
      }}
    >
      <section
        ref={dialog}
        className={styles.dialog}
        data-wide={wide}
        data-drawer={drawer}
        role="dialog"
        aria-modal="true"
        aria-label={accessibleLabel}
        aria-labelledby={accessibleLabel ? undefined : titleId}
      >
        <header className={styles.header}>
          <h2 id={titleId}>{title}</h2>
          <button
            ref={closeButton}
            type="button"
            onClick={() => onCloseRef.current()}
            aria-label="Cerrar diálogo"
          >
            ×
          </button>
        </header>
        <div className={styles.content}>{children}</div>
      </section>
    </div>,
    document.body,
  )
}
