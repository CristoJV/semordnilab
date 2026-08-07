import { useSyncExternalStore } from 'react'

export const COMPACT_LAYOUT_QUERY = '(max-width: 560px)'

export type ResponsiveLayout = 'compact' | 'wide'

function mediaQuery(): MediaQueryList | null {
  if (typeof window === 'undefined' || !window.matchMedia) return null
  return window.matchMedia(COMPACT_LAYOUT_QUERY)
}

function subscribe(onChange: () => void): () => void {
  const query = mediaQuery()
  if (!query) return () => undefined
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function compactSnapshot(): boolean {
  return mediaQuery()?.matches ?? false
}

export function useResponsiveLayout(): ResponsiveLayout {
  return useSyncExternalStore(subscribe, compactSnapshot, () => false)
    ? 'compact'
    : 'wide'
}
