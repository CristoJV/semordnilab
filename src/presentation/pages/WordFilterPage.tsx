import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'

import {
  buildLanguageWordImpact,
  extractLanguageVocabulary,
  type LanguageDescriptor,
  type SemordnilapCatalogItem,
  type VocabularyWord,
  type WordReviewStatus,
} from '@/application'
import type { ApplicationDependencies } from '@/app/composition/create-application-dependencies'
import type { LanguageCode } from '@/domain/semordnilap'
import { dictionaryLinksForWord } from '@/presentation/components/dictionary-links'
import { searchVocabulary } from '@/presentation/components/word-filter-search'
import type { Notify } from '@/presentation/hooks/useTransientNotifications'
import type { WordFilterState } from '@/presentation/hooks/useWordFilters'

import styles from './WordFilterPage.module.css'

export type WordFilterMode = 'pending' | 'verified' | 'excluded'

const WORD_BATCH_SIZE = 600

type PendingWord = {
  word: VocabularyWord
  language: LanguageCode
  mode: WordFilterMode
  transition: 'filter' | 'restore'
}

type WordFilterPageProps = {
  items: readonly SemordnilapCatalogItem[]
  languages: readonly LanguageDescriptor[]
  state: WordFilterState
  mode: WordFilterMode
  onModeChange: (mode: WordFilterMode) => void
  dependencies: Pick<
    ApplicationDependencies,
    'exportPersonalData' | 'personalDataFileGateway'
  >
  onNotify: Notify
}

export function WordFilterPage({
  items,
  languages,
  state,
  mode,
  onModeChange,
  dependencies,
  onNotify,
}: WordFilterPageProps) {
  const [language, setLanguage] = useState<LanguageCode>(
    languages[0]?.code ?? '',
  )
  const [query, setQuery] = useState('')
  const [pending, setPending] = useState<ReadonlyMap<string, PendingWord>>(
    new Map(),
  )
  const animationTimers = useRef<Set<number>>(new Set())
  const mounted = useRef(true)
  const [actionError, setActionError] = useState<string | null>(null)
  const [visibleLimit, setVisibleLimit] = useState(WORD_BATCH_SIZE)
  const [focusWordKey, setFocusWordKey] = useState<string | null>(null)
  const actionButtons = useRef(new Map<string, HTMLButtonElement>())
  const deferredQuery = useDeferredValue(query)

  useEffect(() => {
    mounted.current = true
    const timers = animationTimers.current
    return () => {
      mounted.current = false
      for (const timer of timers) window.clearTimeout(timer)
      timers.clear()
    }
  }, [])

  const selectedLanguage = languages.some(({ code }) => code === language)
    ? language
    : (languages[0]?.code ?? '')
  const vocabulary = useMemo(
    () => extractLanguageVocabulary(items, selectedLanguage),
    [items, selectedLanguage],
  )
  const excludedRecords = useMemo(
    () => state.byLanguage.get(selectedLanguage) ?? [],
    [selectedLanguage, state.byLanguage],
  )
  const verifiedRecords = useMemo(
    () => state.verifiedByLanguage.get(selectedLanguage) ?? [],
    [selectedLanguage, state.verifiedByLanguage],
  )
  const reviewedKeys = useMemo(
    () =>
      new Set(
        (state.reviewsByLanguage.get(selectedLanguage) ?? []).map(
          ({ normalizedWord }) => normalizedWord,
        ),
      ),
    [selectedLanguage, state.reviewsByLanguage],
  )
  const impactByWord = useMemo(
    () => buildLanguageWordImpact(items, selectedLanguage),
    [items, selectedLanguage],
  )
  const availableWords = useMemo<readonly VocabularyWord[]>(() => {
    const available =
      mode === 'pending'
        ? vocabulary.filter(
            ({ normalizedWord }) => !reviewedKeys.has(normalizedWord),
          )
        : (mode === 'verified' ? verifiedRecords : excludedRecords).map(
            ({ displayWord, normalizedWord }) => ({
              displayWord,
              normalizedWord,
            }),
          )
    const keys = new Set(available.map(({ normalizedWord }) => normalizedWord))
    for (const entry of pending.values()) {
      if (
        entry.language === selectedLanguage &&
        entry.mode === mode &&
        !keys.has(entry.word.normalizedWord)
      ) {
        available.push(entry.word)
      }
    }
    return available
  }, [
    excludedRecords,
    mode,
    pending,
    reviewedKeys,
    selectedLanguage,
    verifiedRecords,
    vocabulary,
  ])
  const pendingCount = useMemo(
    () =>
      vocabulary.filter(
        ({ normalizedWord }) => !reviewedKeys.has(normalizedWord),
      ).length,
    [reviewedKeys, vocabulary],
  )
  const visibleWords = useMemo(
    () => searchVocabulary(availableWords, deferredQuery),
    [availableWords, deferredQuery],
  )
  const renderedWords = visibleWords.slice(0, visibleLimit)

  useEffect(() => {
    if (!focusWordKey) return
    const button = actionButtons.current.get(focusWordKey)
    if (!button) return
    button.focus()
    setFocusWordKey(null)
  }, [focusWordKey, renderedWords])

  const apply = (
    word: VocabularyWord,
    nextStatus: WordReviewStatus | null = mode === 'pending'
      ? 'excluded'
      : null,
  ) => {
    const key = `${selectedLanguage}\u001f${word.normalizedWord}`
    if (pending.has(key)) return
    const previousStatus: WordReviewStatus | null =
      mode === 'pending' ? null : mode === 'verified' ? 'verified' : 'excluded'
    const wordIndex = visibleWords.findIndex(
      ({ normalizedWord }) => normalizedWord === word.normalizedWord,
    )
    const nextFocusWord =
      visibleWords[wordIndex + 1] ?? visibleWords[wordIndex - 1]
    setPending((current) =>
      new Map(current).set(key, {
        word,
        language: selectedLanguage,
        mode,
        transition: nextStatus === 'excluded' ? 'filter' : 'restore',
      }),
    )
    setActionError(null)
    const operation = nextStatus
      ? state.setStatus(selectedLanguage, word.displayWord, nextStatus)
      : state.clear(selectedLanguage, word.normalizedWord)
    void operation
      .then(() => {
        const message =
          nextStatus === 'excluded'
            ? `${word.displayWord}: palabra excluida.`
            : nextStatus === 'verified'
              ? `${word.displayWord}: palabra verificada.`
              : `${word.displayWord}: devuelta a pendientes.`
        onNotify({
          tone: nextStatus === 'excluded' ? 'warning' : 'success',
          message,
          action: {
            label: 'Deshacer',
            run: () => {
              if (previousStatus) {
                void state.setStatus(
                  selectedLanguage,
                  word.displayWord,
                  previousStatus,
                )
              } else {
                void state.clear(selectedLanguage, word.normalizedWord)
              }
            },
          },
          lifetime: 4200,
        })
      })
      .catch((error: unknown) => {
        if (mounted.current) {
          setActionError(
            error instanceof Error
              ? error.message
              : 'No se ha podido actualizar la lista.',
          )
        }
      })
      .finally(() => {
        if (!mounted.current) return
        const timer = window.setTimeout(() => {
          animationTimers.current.delete(timer)
          setPending((current) => {
            const next = new Map(current)
            next.delete(key)
            return next
          })
          setFocusWordKey(nextFocusWord?.normalizedWord ?? null)
        }, 180)
        animationTimers.current.add(timer)
      })
  }

  const exportBackup = async () => {
    setActionError(null)
    try {
      const result = await dependencies.exportPersonalData.execute()
      dependencies.personalDataFileGateway.downloadText(
        result.filename,
        result.content,
      )
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'No se ha podido exportar la copia.',
      )
    }
  }

  const title =
    mode === 'pending'
      ? 'Palabras pendientes'
      : mode === 'verified'
        ? 'Palabras verificadas'
        : 'Palabras excluidas'
  const empty = query
    ? 'No hay palabras que coincidan con la búsqueda.'
    : mode === 'pending'
      ? 'Todas las palabras de este idioma ya están revisadas.'
      : mode === 'verified'
        ? 'Todavía no hay palabras verificadas en este idioma.'
        : 'Todavía no hay palabras excluidas en este idioma.'

  return (
    <main className={styles.page}>
      <section className={styles.controls} aria-labelledby="word-filter-title">
        <div className={styles.introduction}>
          <p>Revisión léxica por idioma</p>
          <h1 id="word-filter-title">{title}</h1>
          <span>
            {mode === 'pending'
              ? 'Excluye una palabra o márcala como válida. Puedes consultar antes su impacto y diccionario.'
              : 'Toca una palabra para devolverla a la cola de pendientes.'}
          </span>
        </div>

        <div className={styles.fields}>
          <label>
            <span>Idioma</span>
            <select
              aria-label="Idioma de las palabras"
              value={selectedLanguage}
              onChange={(event) => {
                setLanguage(event.target.value)
                setQuery('')
                setVisibleLimit(WORD_BATCH_SIZE)
              }}
            >
              {languages.map(({ code, label }) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.search}>
            <span>Buscar</span>
            <input
              type="search"
              value={query}
              aria-label="Buscar palabras"
              placeholder="Escribe para filtrar…"
              autoComplete="off"
              onChange={(event) => {
                setQuery(event.target.value)
                setVisibleLimit(WORD_BATCH_SIZE)
              }}
            />
          </label>
        </div>

        <div className={styles.actions}>
          <div
            className={styles.modeSwitcher}
            aria-label="Estado de revisión"
            role="group"
          >
            {(
              [
                ['pending', 'Pendientes', pendingCount],
                ['verified', 'Verificadas', verifiedRecords.length],
                ['excluded', 'Excluidas', excludedRecords.length],
              ] as const
            ).map(([nextMode, label, count]) => (
              <button
                key={nextMode}
                type="button"
                data-active={mode === nextMode}
                aria-pressed={mode === nextMode}
                onClick={() => {
                  setQuery('')
                  setVisibleLimit(WORD_BATCH_SIZE)
                  onModeChange(nextMode)
                }}
              >
                {label} {count}
              </button>
            ))}
          </div>
          <button
            className={styles.exportButton}
            type="button"
            onClick={() => void exportBackup()}
          >
            Exportar backup
          </button>
        </div>
      </section>

      {(state.errorMessage || actionError) && (
        <p className={styles.error} role="alert">
          {actionError ?? state.errorMessage}
        </p>
      )}

      <section className={styles.results} aria-label={title}>
        <p className={styles.resultCount} aria-live="polite">
          {visibleWords.length.toLocaleString('es-ES')}{' '}
          {visibleWords.length === 1 ? 'palabra' : 'palabras'}
        </p>
        {visibleWords.length === 0 ? (
          <p className={styles.empty}>{empty}</p>
        ) : (
          <ul className={styles.grid}>
            {renderedWords.map((word) => {
              const key = `${selectedLanguage}\u001f${word.normalizedWord}`
              const pendingEntry = pending.get(key)
              const impact = impactByWord.get(word.normalizedWord)
              const dictionaryLinks = dictionaryLinksForWord(
                selectedLanguage,
                word.displayWord,
              )
              return (
                <li className={styles.wordCard} key={word.normalizedWord}>
                  <button
                    className={styles.wordAction}
                    ref={(element) => {
                      if (element)
                        actionButtons.current.set(word.normalizedWord, element)
                      else actionButtons.current.delete(word.normalizedWord)
                    }}
                    type="button"
                    aria-label={
                      mode === 'pending'
                        ? `Excluir ${word.displayWord}`
                        : `Devolver ${word.displayWord} a pendientes`
                    }
                    data-transition={pendingEntry?.transition}
                    disabled={pendingEntry !== undefined}
                    onClick={() => apply(word)}
                  >
                    <strong>{word.displayWord}</strong>
                    <span>
                      {impact?.count ?? 0}{' '}
                      {(impact?.count ?? 0) === 1 ? 'resultado' : 'resultados'}
                    </span>
                  </button>
                  <div className={styles.wordTools}>
                    {mode === 'pending' && (
                      <button
                        type="button"
                        aria-label={`Verificar ${word.displayWord}`}
                        disabled={pendingEntry !== undefined}
                        onClick={() => apply(word, 'verified')}
                      >
                        ✓
                      </button>
                    )}
                    {dictionaryLinks.map((link) => (
                      <a
                        key={link.label}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Consultar ${word.displayWord} en ${link.label}`}
                        title={link.label}
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                  {(impact?.examples.length ?? 0) > 0 && (
                    <details className={styles.examples}>
                      <summary>Ver ejemplos</summary>
                      <ul>
                        {impact?.examples.map((example) => (
                          <li key={example}>{example}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        {renderedWords.length < visibleWords.length && (
          <button
            className={styles.showMore}
            type="button"
            onClick={() =>
              setVisibleLimit((current) => current + WORD_BATCH_SIZE)
            }
          >
            Mostrar más
          </button>
        )}
      </section>
    </main>
  )
}
