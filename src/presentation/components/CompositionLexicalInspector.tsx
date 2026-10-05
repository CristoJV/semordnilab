import { useMemo, useRef, useState } from 'react'

import {
  expressionWords,
  type AvailableDataset,
  type VocabularyWord,
} from '@/application'
import type { CompositionSnapshot } from '@/domain/semordnilap'

import { AnchoredPopover } from './AnchoredPopover'
import { dictionaryLinksForWord } from './dictionary-links'
import styles from './CompositionLexicalInspector.module.css'

type CompositionLexicalInspectorProps = {
  dataset: AvailableDataset
  snapshot: CompositionSnapshot
}

function uniqueWords(words: readonly VocabularyWord[]) {
  return [...new Map(words.map((word) => [word.normalizedWord, word])).values()]
}

export function CompositionLexicalInspector({
  dataset,
  snapshot,
}: CompositionLexicalInspectorProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const sides = useMemo(
    () =>
      (
        [
          {
            language: dataset.sourceLanguage,
            text: snapshot.sourceText,
            normalized: snapshot.sourceNormalized,
          },
          {
            language: dataset.targetLanguage,
            text: snapshot.targetText,
            normalized: snapshot.targetNormalized,
          },
        ] as const
      ).map(({ language, text, normalized }) => ({
        language,
        words: uniqueWords(
          expressionWords({ language: language.code, text, normalized }),
        ),
      })),
    [dataset, snapshot],
  )
  const count = sides.reduce((total, side) => total + side.words.length, 0)

  if (count === 0) return null

  const close = () => {
    setOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <div className={styles.inspector}>
      <button
        ref={triggerRef}
        className={styles.trigger}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
      >
        Revisar palabras · {count}
      </button>
      {open && (
        <AnchoredPopover
          anchorRef={triggerRef}
          ariaLabel="Inspector léxico de la composición"
          className={styles.panel}
          preferredWidth={720}
          onClose={() => setOpen(false)}
        >
          <div className={styles.panelHeader}>
            <strong>Palabras de la composición</strong>
            <button type="button" aria-label="Cerrar revisión" onClick={close}>
              ×
            </button>
          </div>
          <div className={styles.sides}>
            {sides.map(({ language, words }) => (
              <section key={language.code} aria-label={language.label}>
                <h2>{language.label}</h2>
                <ul aria-label={`Palabras en ${language.label}`}>
                  {words.map((word) => (
                    <li key={word.normalizedWord}>
                      <span>{word.displayWord}</span>
                      {dictionaryLinksForWord(
                        language.code,
                        word.displayWord,
                      ).map((link) => (
                        <a
                          key={link.label}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Consultar ${word.displayWord} en ${link.label}`}
                        >
                          {link.label}
                        </a>
                      ))}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </AnchoredPopover>
      )}
    </div>
  )
}
