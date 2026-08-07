import { useCallback, useEffect, useMemo, useState } from 'react'

import type {
  ListSemordnilapStatuses,
  MigrateSemordnilapStatusReferences,
  NormalizeSemordnilapStatuses,
  RemoveAllSemordnilapStatuses,
  SemordnilapCatalogStatus,
  SemordnilapIdAlias,
  SemordnilapStatusRecord,
  SemordnilapStatusSelection,
  SetSemordnilapStatuses,
} from '@/application'
import { applySemordnilapStatusSelections } from '@/application/statuses/semordnilap-status-policy'
import type { DatasetId, SemordnilapId } from '@/domain/semordnilap'

type StatusUseCases = {
  listSemordnilapStatuses: ListSemordnilapStatuses
  setSemordnilapStatuses: SetSemordnilapStatuses
  normalizeSemordnilapStatuses: NormalizeSemordnilapStatuses
  removeAllSemordnilapStatuses: RemoveAllSemordnilapStatuses
  migrateSemordnilapStatusReferences: MigrateSemordnilapStatusReferences
}

type StatusSnapshot = {
  datasetId: DatasetId
  records: readonly SemordnilapStatusRecord[]
}

export type SemordnilapStatusMap = ReadonlyMap<
  SemordnilapId,
  ReadonlySet<SemordnilapCatalogStatus>
>

type SemordnilapStatusesState = {
  statuses: SemordnilapStatusMap
  ready: boolean
  errorMessage: string | null
  setStatuses: (
    selections: readonly SemordnilapStatusSelection[],
  ) => Promise<void>
  removeAllStatus: (status: SemordnilapCatalogStatus) => Promise<void>
}

export function useSemordnilapStatuses(
  datasetId: DatasetId | '',
  useCases: StatusUseCases,
  aliases: readonly SemordnilapIdAlias[] = [],
): SemordnilapStatusesState {
  const [snapshot, setSnapshot] = useState<StatusSnapshot | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!datasetId) {
      return undefined
    }

    let active = true
    void useCases.migrateSemordnilapStatusReferences
      .execute(datasetId, aliases)
      .then(() => useCases.normalizeSemordnilapStatuses.execute(datasetId))
      .then(() => useCases.listSemordnilapStatuses.execute(datasetId))
      .then((records) => {
        if (active) {
          setSnapshot({ datasetId, records })
          setErrorMessage(null)
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'No se han podido cargar los estados del catálogo.',
          )
        }
      })

    return () => {
      active = false
    }
  }, [
    aliases,
    datasetId,
    useCases.listSemordnilapStatuses,
    useCases.migrateSemordnilapStatusReferences,
    useCases.normalizeSemordnilapStatuses,
  ])

  const ready = Boolean(datasetId && snapshot?.datasetId === datasetId)

  const statuses = useMemo<SemordnilapStatusMap>(() => {
    if (!ready || !snapshot) {
      return new Map()
    }

    const result = new Map<SemordnilapId, Set<SemordnilapCatalogStatus>>()
    for (const record of snapshot.records) {
      const current = result.get(record.semordnilapId) ?? new Set()
      current.add(record.status)
      result.set(record.semordnilapId, current)
    }
    return result
  }, [ready, snapshot])

  const setStatuses = useCallback(
    async (selections: readonly SemordnilapStatusSelection[]) => {
      if (!datasetId || !ready) return
      setSnapshot((current) => {
        if (!current || current.datasetId !== datasetId) return current
        return {
          datasetId,
          records: applySemordnilapStatusSelections(
            current.records,
            datasetId,
            selections,
          ),
        }
      })

      try {
        await useCases.setSemordnilapStatuses.execute(datasetId, selections)
        setErrorMessage(null)
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'No se ha podido guardar el estado.',
        )
        const records =
          await useCases.listSemordnilapStatuses.execute(datasetId)
        setSnapshot({ datasetId, records })
      }
    },
    [datasetId, ready, useCases],
  )

  const removeAllStatus = useCallback(
    async (status: SemordnilapCatalogStatus) => {
      if (!datasetId || !ready) return

      setSnapshot((current) =>
        !current || current.datasetId !== datasetId
          ? current
          : {
              datasetId,
              records: current.records.filter(
                (record) => record.status !== status,
              ),
            },
      )

      try {
        await useCases.removeAllSemordnilapStatuses.execute(datasetId, status)
        setErrorMessage(null)
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'No se han podido restaurar los estados.',
        )
        const records =
          await useCases.listSemordnilapStatuses.execute(datasetId)
        setSnapshot({ datasetId, records })
      }
    },
    [datasetId, ready, useCases],
  )

  return {
    statuses,
    ready,
    errorMessage,
    setStatuses,
    removeAllStatus,
  }
}
