import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  COMPACT_LAYOUT_QUERY,
  useResponsiveLayout,
} from '@/presentation/responsive/useResponsiveLayout'

afterEach(() => vi.unstubAllGlobals())

describe('useResponsiveLayout', () => {
  it('reacciona al cambio entre una disposición amplia y compacta', () => {
    let compact = false
    const listeners = new Set<() => void>()
    const matchMedia = vi.fn((query: string) => ({
      media: query,
      get matches() {
        return compact
      },
      addEventListener: (_type: string, listener: () => void) =>
        listeners.add(listener),
      removeEventListener: (_type: string, listener: () => void) =>
        listeners.delete(listener),
    }))
    vi.stubGlobal('matchMedia', matchMedia)

    const { result } = renderHook(() => useResponsiveLayout())
    expect(matchMedia).toHaveBeenCalledWith(COMPACT_LAYOUT_QUERY)
    expect(result.current).toBe('wide')

    act(() => {
      compact = true
      listeners.forEach((listener) => listener())
    })
    expect(result.current).toBe('compact')
  })
})
