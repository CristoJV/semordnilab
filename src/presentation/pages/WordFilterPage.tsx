import { useDeferredValue, useMemo, useState } from 'react'

import {
  extractLanguageVocabulary,
  type LanguageDescriptor,
  type SemordnilapCatalogItem,
  type VocabularyWord,
} from '@/application'
import type { LanguageCode } from '@/domain/semordnilap'
import type { ApplicationDependencies } from '@/app/composition/create-application-dependencies'
import type { WordFilterState } from '@/presentation/hooks/useWordFilters'
import { searchVocabulary } from '@/presentation/components/word-filter-search'

import styles from './WordFilterPage.module.css'

export type WordFilterMode = 'filter' | 'restore'

const WORD_BATCH_SIZE = 600

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
}

export function WordFilterPage({
  items,
  languages,
  state,
  mode,
  onModeChange,
  dependencies,
}: WordFilterPageProps) {
  const [language, setLanguage] = useState<LanguageCode>(
    languages[0]?.code ?? '',
  )
  const [query, setQuery] = useState('')
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set())
  const [actionError, setActionError] = useState<string | null>(null)
  const [visibleLimit, setVisibleLimit] = useState(WORD_BATCH_SIZE)
  const deferredQuery = useDeferredValue(query)

  const selectedLanguage = languages.some(({ code }) => code === language)
    ? language
    : (languages[0]?.code ?? '')

  const vocabulary = useMemo(
    () => extractLanguageVocabulary(items, selectedLanguage),
    [items, selectedLanguage],
  )
  const filteredRecords = useMemo(
    () => state.byLanguage.get(selectedLanguage) ?? [],
    [selectedLanguage, state.byLanguage],
  )
  const filteredKeys = useMemo(
    () => new Set(filteredRecords.map(({ normalizedWord }) => normalizedWord)),
    [filteredRecords],
  )
  const availableWords = useMemo<readonly VocabularyWord[]>(
    () =>
      mode === 'filter'
        ? vocabulary.filter(
            ({ normalizedWord }) => !filteredKeys.has(normalizedWord),
          )
        : filteredRecords.map(({ displayWord, normalizedWord }) => ({
            displayWord,
            normalizedWord,
          })),
    [filteredKeys, filteredRecords, mode, vocabulary],
  )
  const filterableCount = useMemo(
    () =>
      vocabulary.filter(
        ({ normalizedWord }) => !filteredKeys.has(normalizedWord),
      ).length,
    [filteredKeys, vocabulary],
  )
  const visibleWords = useMemo(
    () => searchVocabulary(availableWords, deferredQuery),
    [availableWords, deferredQuery],
  )
  const renderedWords = visibleWords.slice(0, visibleLimit)

  const apply = (word: VocabularyWord) => {
    const key = word.normalizedWord
    if (pending.has(key)) return
    setPending((current) => new Set(current).add(key))
    setActionError(null)
    window.setTimeout(() => {
      const operation =
        mode === 'filter'
          ? state.add(selectedLanguage, word.displayWord)
          : state.remove(selectedLanguage, word.normalizedWord)
      void operation
        .catch((error: unknown) =>
          setActionError(
            error instanceof Error
              ? error.message
              : 'No se ha podido actualizar la lista.',
          ),
        )
        .finally(() =>
          setPending((current) => {
            const next = new Set(current)
            next.delete(key)
            return next
          }),
        )
    }, 180)
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

  const title = mode === 'filter' ? 'Filtrar palabras' : 'Recuperar palabras'
  const empty = query
    ? 'No hay palabras que coincidan con la búsqueda.'
    : mode === 'filter'
      ? 'Todas las palabras de este idioma ya están filtradas.'
      : 'Todavía no hay palabras filtradas en este idioma.'

  return (
    <main className={styles.page}>
      <section className={styles.controls} aria-labelledby="word-filter-title">
        <div className={styles.introduction}>
          <p>Lista personal por idioma</p>
          <h1 id="word-filter-title">{title}</h1>
          <span>
            {mode === 'filter'
              ? 'Toca una palabra para excluir los semordnilaps que la contengan.'
              : 'Toca una palabra para devolverla al vocabulario disponible.'}
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
            aria-label="Acción sobre palabras"
          >
            <button
              type="button"
              data-active={mode === 'filter'}
              aria-pressed={mode === 'filter'}
              onClick={() => {
                setQuery('')
                setVisibleLimit(WORD_BATCH_SIZE)
                onModeChange('filter')
              }}
            >
              Filtrar {filterableCount}
            </button>
            <button
              type="button"
              data-active={mode === 'restore'}
              aria-pressed={mode === 'restore'}
              onClick={() => {
                setQuery('')
                setVisibleLimit(WORD_BATCH_SIZE)
                onModeChange('restore')
              }}
            >
              Recuperar {filteredRecords.length}
            </button>
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
              const transitioning = pending.has(word.normalizedWord)
              return (
                <li key={word.normalizedWord}>
                  <button
                    type="button"
                    aria-label={`${mode === 'filter' ? 'Filtrar' : 'Recuperar'} ${word.displayWord}`}
                    data-transition={
                      transitioning
                        ? mode === 'filter'
                          ? 'filter'
                          : 'restore'
                        : undefined
                    }
                    disabled={transitioning}
                    onClick={() => apply(word)}
                  >
                    {word.displayWord}
                  </button>
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
