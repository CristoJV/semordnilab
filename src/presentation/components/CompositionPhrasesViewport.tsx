import type { ReactNode, RefObject } from 'react'

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
        <div className={styles.phrases}>
          {sourcePhrase}
          {targetPhrase}
        </div>
      </div>
    </div>
  )
}
