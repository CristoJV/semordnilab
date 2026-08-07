import { useRef } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useCompositionPointerInteraction } from '@/presentation/hooks/useCompositionPointerInteraction'

function InteractionHarness() {
  const laneRef = useRef<HTMLOListElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const interaction = useCompositionPointerInteraction({
    getLane: () => laneRef.current,
    getScrollContainer: () => scrollRef.current,
    onRemove: vi.fn(),
    onDrop: vi.fn(),
  })

  return (
    <div ref={scrollRef} data-testid="shared-scroll">
      <ol ref={laneRef} data-testid="lane">
        <li
          {...interaction.bind({
            instanceId: 1,
            canonicalIndex: 0,
            text: 'amor',
            side: 'source',
          })}
        >
          amor
        </li>
        <li data-composition-index="0" />
        <li data-composition-index="1" />
      </ol>
    </div>
  )
}

describe('interacción de puntero de la composición', () => {
  it('aplica el auto-scroll al contenedor compartido', () => {
    let animationFrame: FrameRequestCallback | undefined
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        animationFrame = callback
        return 1
      }),
    )
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    render(<InteractionHarness />)
    const scroller = screen.getByTestId('shared-scroll')
    const lane = screen.getByTestId('lane')
    const component = screen.getByText('amor')
    vi.spyOn(scroller, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      right: 100,
      width: 100,
    } as DOMRect)
    vi.spyOn(lane, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      bottom: 50,
    } as DOMRect)
    for (const [index, point] of [
      ...lane.querySelectorAll<HTMLElement>('[data-composition-index]'),
    ].entries()) {
      vi.spyOn(point, 'getBoundingClientRect').mockReturnValue({
        left: index * 80,
        width: 20,
      } as DOMRect)
    }

    fireEvent.pointerDown(component, {
      button: 0,
      pointerId: 7,
      pointerType: 'mouse',
      clientX: 50,
      clientY: 20,
    })
    fireEvent.pointerMove(component, {
      buttons: 1,
      pointerId: 7,
      pointerType: 'mouse',
      clientX: 96,
      clientY: 20,
    })
    expect(animationFrame).toBeDefined()

    act(() => animationFrame?.(16))

    expect(scroller.scrollLeft).toBeGreaterThan(0)
    expect(lane.scrollLeft).toBe(0)
  })
})
