import { createRef } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CompositionPhrasesViewport } from '@/presentation/components/CompositionPhrasesViewport'

describe('CompositionPhrasesViewport', () => {
  it('muestra un deslizador sólo cuando las frases desbordan y mueve ambas', () => {
    const viewportRef = createRef<HTMLDivElement>()
    render(
      <CompositionPhrasesViewport
        sourceLanguageLabel="Español"
        targetLanguageLabel="Gallego"
        viewportRef={viewportRef}
        sourcePhrase={<div>una composición muy larga</div>}
        targetPhrase={<div>unha composición moi longa</div>}
      />,
    )

    expect(
      screen.queryByRole('slider', {
        name: 'Mover ambas composiciones horizontalmente',
      }),
    ).not.toBeInTheDocument()

    Object.defineProperties(viewportRef.current!, {
      clientWidth: { configurable: true, value: 240 },
      scrollWidth: { configurable: true, value: 640 },
    })
    fireEvent(window, new Event('resize'))

    const slider = screen.getByRole('slider', {
      name: 'Mover ambas composiciones horizontalmente',
    })
    expect(slider).toHaveAttribute('max', '400')

    fireEvent.input(slider, { target: { value: '175' } })
    expect(viewportRef.current?.scrollLeft).toBe(175)
  })
})
