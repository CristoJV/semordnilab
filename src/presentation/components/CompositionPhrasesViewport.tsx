import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react'

import styles from './CompositionPhrasesViewport.module.css'

type CompositionPhrasesViewportProps = {
  sourceLanguageLabel: string
  targetLanguageLabel: string
  viewportRef: RefObject<HTMLDivElement | null>
  sourcePhrase: ReactNode
  targetPhrase: ReactNode
}

export function CompositionPhrasesViewport({
  sourceLanguageLabel,
  targetLanguageLabel,
  viewportRef,
  sourcePhrase,
  targetPhrase,
}: CompositionPhrasesViewportProps) {
  const phrasesRef = useRef<HTMLDivElement>(null)
  const [scrollState, setScrollState] = useState({
    left: 0,
    maximum: 0,
  })

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const phrases = phrasesRef.current
    if (!viewport || !phrases) return undefined

    const measure = () => {
      const maximum = Math.max(0, viewport.scrollWidth - viewport.clientWidth)
      if (viewport.scrollLeft > maximum) viewport.scrollLeft = maximum
      setScrollState((current) =>
        current.left === viewport.scrollLeft && current.maximum === maximum
          ? current
          : { left: viewport.scrollLeft, maximum },
      )
    }
    const trackScroll = () =>
      setScrollState((current) =>
        current.left === viewport.scrollLeft
          ? current
          : { ...current, left: viewport.scrollLeft },
      )
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)

    observer?.observe(viewport)
    observer?.observe(phrases)
    viewport.addEventListener('scroll', trackScroll, { passive: true })
    window.addEventListener('resize', measure)
    measure()

    return () => {
      observer?.disconnect()
      viewport.removeEventListener('scroll', trackScroll)
      window.removeEventListener('resize', measure)
    }
  }, [viewportRef])

  const progress =
    scrollState.maximum === 0
      ? 0
      : (scrollState.left / scrollState.maximum) * 100

  return (
    <div className={styles.frame}>
      <div className={styles.labels} aria-hidden="true">
        <span className={styles.label} data-tone="source">
          {sourceLanguageLabel}
        </span>
        <span className={styles.label} data-tone="target">
          {targetLanguageLabel}
        </span>
      </div>
      <div
        ref={viewportRef}
        className={styles.viewport}
        data-composition-scroll="shared"
        role="region"
        aria-label="Desplazar ambas composiciones"
        tabIndex={0}
      >
        <div ref={phrasesRef} className={styles.phrases}>
          {sourcePhrase}
          {targetPhrase}
        </div>
      </div>
      {scrollState.maximum > 1 && (
        <div className={styles.scrubber}>
          <input
            type="range"
            min="0"
            max={scrollState.maximum}
            step="1"
            value={Math.min(scrollState.left, scrollState.maximum)}
            aria-label="Mover ambas composiciones horizontalmente"
            style={{ '--scroll-progress': `${progress}%` } as CSSProperties}
            onInput={(event) => {
              const next = Number(event.currentTarget.value)
              if (viewportRef.current) viewportRef.current.scrollLeft = next
              setScrollState((current) => ({ ...current, left: next }))
            }}
          />
        </div>
      )}
    </div>
  )
}
