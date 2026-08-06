import {
  useCallback,
  useEffect,
  useState,
  type RefObject,
  type UIEvent,
} from 'react'

export const CATALOG_ROW_HEIGHT = 56
const CATALOG_ROW_OVERSCAN = 6
const FALLBACK_VIEWPORT_HEIGHT = CATALOG_ROW_HEIGHT * 16

export type VirtualCatalogRange = {
  start: number
  end: number
  paddingTop: number
  paddingBottom: number
}

export function calculateVirtualCatalogRange(
  itemCount: number,
  scrollTop: number,
  viewportHeight: number,
  rowHeight: number = CATALOG_ROW_HEIGHT,
  overscan: number = CATALOG_ROW_OVERSCAN,
): VirtualCatalogRange {
  const safeCount = Math.max(0, itemCount)
  const safeScroll = Math.max(0, scrollTop)
  const safeHeight =
    viewportHeight > 0 ? viewportHeight : FALLBACK_VIEWPORT_HEIGHT
  const visibleCount = Math.ceil(safeHeight / rowHeight)
  const firstVisible = Math.min(
    Math.floor(safeScroll / rowHeight),
    Math.max(0, safeCount - visibleCount),
  )
  const start = Math.max(0, firstVisible - overscan)
  const end = Math.min(safeCount, firstVisible + visibleCount + overscan)
  return {
    start,
    end,
    paddingTop: start * rowHeight,
    paddingBottom: Math.max(0, (safeCount - end) * rowHeight),
  }
}

export function useVirtualCatalogRows(
  itemCount: number,
  scrollerRef: RefObject<HTMLElement | null>,
) {
  const [metrics, setMetrics] = useState({
    scrollTop: 0,
    viewportHeight: 0,
  })

  const measure = useCallback(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    setMetrics({
      scrollTop: scroller.scrollTop,
      viewportHeight: scroller.clientHeight,
    })
  }, [scrollerRef])

  useEffect(() => {
    measure()
    const scroller = scrollerRef.current
    if (!scroller || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(measure)
    observer.observe(scroller)
    return () => observer.disconnect()
  }, [measure, scrollerRef])

  const onScroll = (event: UIEvent<HTMLElement>) => {
    setMetrics({
      scrollTop: event.currentTarget.scrollTop,
      viewportHeight: event.currentTarget.clientHeight,
    })
  }

  const reset = useCallback(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0
    setMetrics((current) => ({ ...current, scrollTop: 0 }))
  }, [scrollerRef])

  return {
    ...calculateVirtualCatalogRange(
      itemCount,
      metrics.scrollTop,
      metrics.viewportHeight,
    ),
    onScroll,
    reset,
  }
}
