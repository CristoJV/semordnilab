import { useMemo } from 'react'

import {
  expressionWords,
  type AvailableDataset,
  type VocabularyWord,
} from '@/application'
import type { CompositionSnapshot } from '@/domain/semordnilap'

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

  return (
    <details
      className={styles.inspector}
      role="group"
      aria-label="Inspector léxico de la composición"
    >
      <summary>Revisar palabras · {count}</summary>
      <div className={styles.sides}>
        {sides.map(({ language, words }) => (
          <section key={language.code} aria-label={language.label}>
            <h2>{language.label}</h2>
            <ul>
              {words.map((word) => (
                <li key={word.normalizedWord}>
                  <span>{word.displayWord}</span>
                  {dictionaryLinksForWord(language.code, word.displayWord).map(
                    (link) => (
                      <a
                        key={link.label}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Consultar ${word.displayWord} en ${link.label}`}
                      >
                        {link.label}
                      </a>
                    ),
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </details>
  )
}
