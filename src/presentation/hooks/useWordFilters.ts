import { useCallback, useEffect, useMemo, useState } from 'react'

import type {
  AddWordFilter,
  ListWordFilters,
  RemoveWordFilter,
  WordFilterRecord,
} from '@/application'
import type { LanguageCode } from '@/domain/semordnilap'

type WordFilterUseCases = {
  listWordFilters: ListWordFilters
  addWordFilter: AddWordFilter
  removeWordFilter: RemoveWordFilter
}

export type WordFilterState = {
  records: readonly WordFilterRecord[]
  byLanguage: ReadonlyMap<LanguageCode, readonly WordFilterRecord[]>
  ready: boolean
  errorMessage: string | null
  add: (language: LanguageCode, displayWord: string) => Promise<void>
  remove: (language: LanguageCode, word: string) => Promise<void>
  refresh: () => void
}

export function useWordFilters(useCases: WordFilterUseCases): WordFilterState {
  const [records, setRecords] = useState<readonly WordFilterRecord[]>([])
  const [ready, setReady] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true
    void useCases.listWordFilters
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
  }, [revision, useCases.listWordFilters])

  const byLanguage = useMemo(() => {
    const grouped = new Map<LanguageCode, WordFilterRecord[]>()
    for (const record of records) {
      const group = grouped.get(record.language) ?? []
      group.push(record)
      grouped.set(record.language, group)
    }
    return grouped
  }, [records])

  const add = useCallback(
    async (language: LanguageCode, displayWord: string) => {
      await useCases.addWordFilter.execute(language, displayWord)
      setRecords(await useCases.listWordFilters.execute())
    },
    [useCases.addWordFilter, useCases.listWordFilters],
  )
  const remove = useCallback(
    async (language: LanguageCode, word: string) => {
      await useCases.removeWordFilter.execute(language, word)
      setRecords(await useCases.listWordFilters.execute())
    },
    [useCases.listWordFilters, useCases.removeWordFilter],
  )
  const refresh = useCallback(() => setRevision((current) => current + 1), [])

  return {
    records,
    byLanguage,
    ready,
    errorMessage,
    add,
    remove,
    refresh,
  }
}
