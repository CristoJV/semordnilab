import { useEffect, useRef } from 'react'

import styles from './TriStateCheckbox.module.css'

type TriStateCheckboxProps = {
  state: 'empty' | 'mixed' | 'checked'
  total: number
  onChange: () => void
}

export function TriStateCheckbox({
  state,
  total,
  onChange,
}: TriStateCheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = state === 'mixed'
  }, [state])

  const selecting = state !== 'checked'

  return (
    <label className={styles.control} data-state={state}>
      <input
        ref={inputRef}
        type="checkbox"
        checked={state === 'checked'}
        disabled={total === 0}
        aria-checked={state === 'mixed' ? 'mixed' : state === 'checked'}
        aria-label={
          selecting
            ? `Seleccionar los ${total} resultados`
            : `Deseleccionar los ${total} resultados`
        }
        onChange={onChange}
      />
      <span aria-hidden="true">
        {state === 'mixed' ? '−' : state === 'checked' ? '✓' : ''}
      </span>
    </label>
  )
}
