import { useState } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  CATALOG_LONG_PRESS_DELAY,
  useCatalogLongPressSelection,
} from '@/presentation/hooks/useCatalogLongPressSelection'

function InteractionHarness() {
  const [selected, setSelected] = useState('')
  const [clickCount, setClickCount] = useState(0)
  const interaction = useCatalogLongPressSelection({
    enabled: true,
    onSelect: setSelected,
  })

  return (
    <>
      <button
        {...interaction.bind('amor-roma')}
        data-pending={interaction.pendingSemordnilapId === 'amor-roma'}
        type="button"
        onClick={() => setClickCount((current) => current + 1)}
      >
        amor
      </button>
      <output aria-label="seleccionado">{selected}</output>
      <output aria-label="toques">{clickCount}</output>
    </>
  )
}

function touch(target: HTMLElement, type: 'down' | 'move' | 'up') {
  const event = {
    button: 0,
    pointerId: 12,
    pointerType: 'touch',
    clientX: 20,
    clientY: type === 'move' ? 31 : 20,
  }
  if (type === 'down') fireEvent.pointerDown(target, event)
  else if (type === 'move') fireEvent.pointerMove(target, event)
  else fireEvent.pointerUp(target, event)
}

describe('selección prolongada del catálogo', () => {
  afterEach(() => vi.useRealTimers())

  it('selecciona una sola vez y suprime el clic posterior', () => {
    vi.useFakeTimers()
    render(<InteractionHarness />)
    const option = screen.getByRole('button', { name: 'amor' })

    touch(option, 'down')
    expect(option).toHaveAttribute('data-pending', 'true')
    act(() => vi.advanceTimersByTime(CATALOG_LONG_PRESS_DELAY))
    touch(option, 'up')
    fireEvent.click(option)

    expect(screen.getByLabelText('seleccionado')).toHaveTextContent('amor-roma')
    expect(screen.getByLabelText('toques')).toHaveTextContent('0')
  })

  it('mantiene el toque breve como acción normal', () => {
    vi.useFakeTimers()
    render(<InteractionHarness />)
    const option = screen.getByRole('button', { name: 'amor' })

    touch(option, 'down')
    touch(option, 'up')
    fireEvent.click(option)

    expect(screen.getByLabelText('seleccionado')).toBeEmptyDOMElement()
    expect(screen.getByLabelText('toques')).toHaveTextContent('1')
  })

  it('cancela al iniciar scroll y evita una activación accidental', () => {
    vi.useFakeTimers()
    render(<InteractionHarness />)
    const option = screen.getByRole('button', { name: 'amor' })

    touch(option, 'down')
    touch(option, 'move')
    act(() => vi.advanceTimersByTime(CATALOG_LONG_PRESS_DELAY))
    touch(option, 'up')
    fireEvent.click(option)

    expect(screen.getByLabelText('seleccionado')).toBeEmptyDOMElement()
    expect(screen.getByLabelText('toques')).toHaveTextContent('0')
  })
})
