import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type {
  AddWordFilter,
  ClearWordReview,
  ListWordReviews,
  ListWordFilters,
  RemoveWordFilter,
  SetWordReview,
  WordFilterRecord,
  WordReviewStatus,
} from '@/application'
import type { LanguageCode } from '@/domain/semordnilap'

type WordFilterUseCases = {
  listWordFilters: ListWordFilters
  addWordFilter: AddWordFilter
  removeWordFilter: RemoveWordFilter
  listWordReviews: ListWordReviews
  setWordReview: SetWordReview
  clearWordReview: ClearWordReview
}

export type WordFilterState = {
  records: readonly WordFilterRecord[]
  byLanguage: ReadonlyMap<LanguageCode, readonly WordFilterRecord[]>
  verifiedByLanguage: ReadonlyMap<LanguageCode, readonly WordFilterRecord[]>
  reviewsByLanguage: ReadonlyMap<LanguageCode, readonly WordFilterRecord[]>
  ready: boolean
  errorMessage: string | null
  add: (language: LanguageCode, displayWord: string) => Promise<void>
  remove: (language: LanguageCode, word: string) => Promise<void>
  setStatus: (
    language: LanguageCode,
    displayWord: string,
    status: WordReviewStatus,
  ) => Promise<void>
  clear: (language: LanguageCode, word: string) => Promise<void>
  refresh: () => void
}

export function useWordFilters(useCases: WordFilterUseCases): WordFilterState {
  const [records, setRecords] = useState<readonly WordFilterRecord[]>([])
  const [ready, setReady] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)
  const mutationQueue = useRef<Promise<void>>(Promise.resolve())
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const enqueue = useCallback((operation: () => Promise<void>) => {
    const result = mutationQueue.current.then(operation, operation)
    mutationQueue.current = result.catch(() => undefined)
    return result
  }, [])

  useEffect(() => {
    let active = true
    void useCases.listWordReviews
      .execute()
      .then((next) => {
        if (!active) return
        setRecords(next)
        setErrorMessage(null)
        setReady(true)
      })
      .catch((error: unknown) => {
        if (!active) return
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'No se han podido cargar los filtros de palabras.',
        )
        setReady(true)
      })
    return () => {
      active = false
    }
  }, [revision, useCases.listWordReviews])

  const reviewsByLanguage = useMemo(() => {
    const grouped = new Map<LanguageCode, WordFilterRecord[]>()
    for (const record of records) {
      const group = grouped.get(record.language) ?? []
      group.push(record)
      grouped.set(record.language, group)
    }
    return grouped
  }, [records])
  const byLanguage = useMemo(() => {
    const grouped = new Map<LanguageCode, WordFilterRecord[]>()
    for (const record of records) {
      if ((record.status ?? 'excluded') !== 'excluded') continue
      const group = grouped.get(record.language) ?? []
      group.push(record)
      grouped.set(record.language, group)
    }
    return grouped
  }, [records])
  const verifiedByLanguage = useMemo(() => {
    const grouped = new Map<LanguageCode, WordFilterRecord[]>()
    for (const record of records) {
      if (record.status !== 'verified') continue
      const group = grouped.get(record.language) ?? []
      group.push(record)
      grouped.set(record.language, group)
    }
    return grouped
  }, [records])

  const reload = useCallback(async () => {
    const next = await useCases.listWordReviews.execute()
    if (mounted.current) setRecords(next)
  }, [useCases.listWordReviews])

  const setStatus = useCallback(
    (language: LanguageCode, displayWord: string, status: WordReviewStatus) =>
      enqueue(async () => {
        await useCases.setWordReview.execute(language, displayWord, status)
        await reload()
      }),
    [enqueue, reload, useCases.setWordReview],
  )
  const clear = useCallback(
    (language: LanguageCode, word: string) =>
      enqueue(async () => {
        await useCases.clearWordReview.execute(language, word)
        await reload()
      }),
    [enqueue, reload, useCases.clearWordReview],
  )

  const add = useCallback(
    (language: LanguageCode, displayWord: string) =>
      enqueue(async () => {
        await useCases.addWordFilter.execute(language, displayWord)
        await reload()
      }),
    [enqueue, reload, useCases.addWordFilter],
  )
  const remove = useCallback(
    (language: LanguageCode, word: string) =>
      enqueue(async () => {
        await useCases.removeWordFilter.execute(language, word)
        await reload()
      }),
    [enqueue, reload, useCases.removeWordFilter],
  )
  const refresh = useCallback(() => setRevision((current) => current + 1), [])

  return {
    records,
    byLanguage,
    verifiedByLanguage,
    reviewsByLanguage,
    ready,
    errorMessage,
    add,
    remove,
    setStatus,
    clear,
    refresh,
  }
}
