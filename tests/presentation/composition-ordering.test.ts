import { describe, expect, it } from 'vitest'

import { moveComponentToGap } from '@/presentation/hooks/useCompositionWorkspace'

import { createAtomicSemordnilap } from '../support/fixtures'

const semordnilap = createAtomicSemordnilap('one', 'a', 'a', 'a', 'a')
const components = [1, 2, 3, 4].map((instanceId) => ({
  instanceId,
  semordnilap,
}))

describe('orden canónico de la composición', () => {
  it('mueve una pieza hacia un espacio posterior compensando su retirada', () => {
    expect(
      moveComponentToGap(components, 1, 4).map(({ instanceId }) => instanceId),
    ).toEqual([2, 3, 4, 1])
  })

  it('mueve una pieza hacia un espacio anterior', () => {
    expect(
      moveComponentToGap(components, 4, 1).map(({ instanceId }) => instanceId),
    ).toEqual([1, 4, 2, 3])
  })

  it('no crea un cambio al soltar en cualquiera de sus espacios adyacentes', () => {
    expect(moveComponentToGap(components, 2, 1)).toBe(components)
    expect(moveComponentToGap(components, 2, 2)).toBe(components)
  })
})
