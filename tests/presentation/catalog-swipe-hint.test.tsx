import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCatalogSwipeHint } from '@/presentation/hooks/useCatalogSwipeHint'

describe('aviso inicial de gestos del catálogo', () => {
  beforeEach(() => window.localStorage.clear())

  it('se muestra una sola vez cuando la interacción está disponible', () => {
    const notify = vi.fn()
    const first = renderHook(
      ({ enabled }) => useCatalogSwipeHint(enabled, notify),
      { initialProps: { enabled: false } },
    )

    expect(notify).not.toHaveBeenCalled()
    first.rerender({ enabled: true })
    first.rerender({ enabled: true })
    expect(notify).toHaveBeenCalledOnce()
    first.unmount()

    renderHook(() => useCatalogSwipeHint(true, notify))
    expect(notify).toHaveBeenCalledOnce()
  })
})
