import { describe, expect, it } from 'vitest'

import { calculateVirtualCatalogRange } from '@/presentation/hooks/useVirtualCatalogRows'

describe('ventana virtual del catálogo', () => {
  it('renderiza la ventana visible con margen y conserva la altura total', () => {
    const range = calculateVirtualCatalogRange(1_000, 5_600, 560, 56, 2)

    expect(range).toEqual({
      start: 98,
      end: 112,
      paddingTop: 5_488,
      paddingBottom: 49_728,
    })
    expect(
      range.paddingTop + (range.end - range.start) * 56 + range.paddingBottom,
    ).toBe(56_000)
  })

  it('acota el inicio y el final de conjuntos pequeños', () => {
    expect(calculateVirtualCatalogRange(3, 0, 0)).toMatchObject({
      start: 0,
      end: 3,
      paddingTop: 0,
      paddingBottom: 0,
    })
    expect(calculateVirtualCatalogRange(3, 50_000, 560)).toMatchObject({
      start: 0,
      end: 3,
    })
  })
})
