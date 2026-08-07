import { useState } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  CATALOG_ROW_LONG_PRESS_DELAY,
  useCatalogRowPointerInteraction,
} from '@/presentation/hooks/useCatalogRowPointerInteraction'
import type { CatalogSwipeDirection } from '@/presentation/interactions/catalog-row-pointer-machine'

function InteractionHarness() {
  const [selected, setSelected] = useState('')
  const [swipe, setSwipe] = useState<CatalogSwipeDirection | ''>('')
  const [clickCount, setClickCount] = useState(0)
  const interaction = useCatalogRowPointerInteraction({
    enabled: true,
    semordnilapId: 'amor-roma',
    onSelect: setSelected,
    onSwipe: (_id, direction) => setSwipe(direction),
  })

  return (
    <div {...interaction.bindings} data-state={interaction.state.value}>
      <button
        type="button"
        onClick={() => setClickCount((current) => current + 1)}
      >
        amor
      </button>
      <output aria-label="seleccionado">{selected}</output>
      <output aria-label="gesto">{swipe}</output>
      <output aria-label="toques">{clickCount}</output>
    </div>
  )
}

function pointer(
  target: HTMLElement,
  type: 'down' | 'move' | 'up',
  clientX = 100,
  clientY = 20,
) {
  const event = {
    button: 0,
    pointerId: 12,
    pointerType: 'touch',
    clientX,
    clientY,
  }
  if (type === 'down') fireEvent.pointerDown(target, event)
  else if (type === 'move') fireEvent.pointerMove(target, event)
  else fireEvent.pointerUp(target, event)
}

describe('interacción táctil de una fila del catálogo', () => {
  afterEach(() => vi.useRealTimers())

  it('selecciona una sola vez y suprime el clic posterior', () => {
    vi.useFakeTimers()
    render(<InteractionHarness />)
    const option = screen.getByRole('button', { name: 'amor' })

    pointer(option, 'down')
    act(() => vi.advanceTimersByTime(CATALOG_ROW_LONG_PRESS_DELAY))
    pointer(option, 'up')
    fireEvent.click(option)

    expect(screen.getByLabelText('seleccionado')).toHaveTextContent('amor-roma')
    expect(screen.getByLabelText('toques')).toHaveTextContent('0')
  })

  it('mantiene el toque breve como acción normal', () => {
    vi.useFakeTimers()
    render(<InteractionHarness />)
    const option = screen.getByRole('button', { name: 'amor' })

    pointer(option, 'down')
    pointer(option, 'up')
    fireEvent.click(option)

    expect(screen.getByLabelText('seleccionado')).toBeEmptyDOMElement()
    expect(screen.getByLabelText('toques')).toHaveTextContent('1')
  })

  it('permite scroll vertical sin activar el toque', () => {
    vi.useFakeTimers()
    render(<InteractionHarness />)
    const option = screen.getByRole('button', { name: 'amor' })

    pointer(option, 'down')
    pointer(option, 'move', 102, 35)
    pointer(option, 'up', 102, 35)
    fireEvent.click(option)

    expect(screen.getByLabelText('seleccionado')).toBeEmptyDOMElement()
    expect(screen.getByLabelText('toques')).toHaveTextContent('0')
  })

  it('confirma el gesto horizontal sin ejecutar además el toque', () => {
    vi.useFakeTimers()
    render(<InteractionHarness />)
    const option = screen.getByRole('button', { name: 'amor' })

    pointer(option, 'down')
    pointer(option, 'move', 180, 21)
    expect(option.parentElement).toHaveAttribute('data-state', 'swiping')
    pointer(option, 'up', 180, 21)
    fireEvent.click(option)

    expect(screen.getByLabelText('gesto')).toHaveTextContent('right')
    expect(screen.getByLabelText('toques')).toHaveTextContent('0')
  })
})
