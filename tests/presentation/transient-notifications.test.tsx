import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useTransientNotifications } from '@/presentation/hooks/useTransientNotifications'

describe('avisos transitorios', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('desaparece al terminar su tiempo de vida', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useTransientNotifications())

    act(() => {
      result.current.notify({
        message: 'Composite guardado.',
        tone: 'success',
        lifetime: 100,
      })
    })
    expect(result.current.notifications).toHaveLength(1)

    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(result.current.notifications).toHaveLength(0)
  })

  it('conserva como máximo los tres avisos más recientes', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useTransientNotifications())

    act(() => {
      for (const message of ['uno', 'dos', 'tres', 'cuatro']) {
        result.current.notify({ message, tone: 'info' })
      }
    })

    expect(result.current.notifications.map(({ message }) => message)).toEqual([
      'dos',
      'tres',
      'cuatro',
    ])
  })
})
