import { describe, expect, it, vi } from 'vitest'

import {
  calculateHorizontalAutoScroll,
  findNearestCompositionGap,
  isWithinVerticalDropZone,
} from '@/presentation/interactions/composition-drag-geometry'

describe('geometría del arrastre de composición', () => {
  it('activa el scroll hacia cada extremo y se detiene en el centro', () => {
    const rectangle = { left: 100, right: 500, width: 400 }
    expect(calculateHorizontalAutoScroll(rectangle, 105)).toBeLessThan(0)
    expect(calculateHorizontalAutoScroll(rectangle, 495)).toBeGreaterThan(0)
    expect(calculateHorizontalAutoScroll(rectangle, 300)).toBe(0)
  })

  it('encuentra el espacio visual más próximo', () => {
    const lane = document.createElement('ol')
    const first = document.createElement('button')
    first.dataset.compositionIndex = '0'
    vi.spyOn(first, 'getBoundingClientRect').mockReturnValue({
      left: 10,
      right: 20,
      width: 10,
    } as DOMRect)
    const second = document.createElement('button')
    second.dataset.compositionIndex = '3'
    vi.spyOn(second, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      right: 120,
      width: 20,
    } as DOMRect)
    lane.append(first, second)

    expect(findNearestCompositionGap(lane, 108)).toBe(3)
    expect(findNearestCompositionGap(lane, 14)).toBe(0)
  })

  it('acepta una tolerancia vertical y cancela una salida clara del lienzo', () => {
    const rectangle = { top: 100, bottom: 160 }

    expect(isWithinVerticalDropZone(rectangle, 75)).toBe(true)
    expect(isWithinVerticalDropZone(rectangle, 200)).toBe(true)
    expect(isWithinVerticalDropZone(rectangle, 59)).toBe(false)
    expect(isWithinVerticalDropZone(rectangle, 201)).toBe(false)
  })
})
