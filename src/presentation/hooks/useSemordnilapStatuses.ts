import { useCallback, useEffect, useMemo, useState } from 'react'

import type {
  AddSemordnilapStatus,
  ListSemordnilapStatuses,
  RemoveAllSemordnilapStatuses,
  RemoveSemordnilapStatus,
  SemordnilapCatalogStatus,
  SemordnilapStatusRecord,
} from '@/application'
import type { DatasetId, SemordnilapId } from '@/domain/semordnilap'

type StatusUseCases = {
  listSemordnilapStatuses: ListSemordnilapStatuses
  addSemordnilapStatus: AddSemordnilapStatus
  removeSemordnilapStatus: RemoveSemordnilapStatus
  removeAllSemordnilapStatuses: RemoveAllSemordnilapStatuses
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
  addStatus: (
    semordnilapIds: readonly SemordnilapId[],
    status: SemordnilapCatalogStatus,
  ) => Promise<void>
  removeStatus: (
    semordnilapIds: readonly SemordnilapId[],
    status: SemordnilapCatalogStatus,
  ) => Promise<void>
  removeAllStatus: (status: SemordnilapCatalogStatus) => Promise<void>
}

export function useSemordnilapStatuses(
  datasetId: DatasetId | '',
  useCases: StatusUseCases,
): SemordnilapStatusesState {
  const [snapshot, setSnapshot] = useState<StatusSnapshot | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!datasetId) {
      return undefined
    }

    let active = true
    void useCases.listSemordnilapStatuses
      .execute(datasetId)
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
  }, [datasetId, useCases.listSemordnilapStatuses])

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

  const addStatus = useCallback(
    async (
      semordnilapIds: readonly SemordnilapId[],
      status: SemordnilapCatalogStatus,
    ) => {
      if (!datasetId || !ready) return

      const additions = semordnilapIds.map((semordnilapId) => ({
        datasetId,
        semordnilapId,
        status,
      }))
      setSnapshot((current) => {
        if (!current || current.datasetId !== datasetId) return current
        const keys = new Set(
          current.records.map(
            (record) => `${record.semordnilapId}:${record.status}`,
          ),
        )
        return {
          datasetId,
          records: [
            ...current.records,
            ...additions.filter(
              (record) => !keys.has(`${record.semordnilapId}:${record.status}`),
            ),
          ],
        }
      })

      try {
        await Promise.all(
          additions.map((record) =>
            useCases.addSemordnilapStatus.execute(record),
          ),
        )
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

  const removeStatus = useCallback(
    async (
      semordnilapIds: readonly SemordnilapId[],
      status: SemordnilapCatalogStatus,
    ) => {
      if (!datasetId || !ready) return

      const ids = new Set(semordnilapIds)
      setSnapshot((current) =>
        !current || current.datasetId !== datasetId
          ? current
          : {
              datasetId,
              records: current.records.filter(
                (record) =>
                  record.status !== status || !ids.has(record.semordnilapId),
              ),
            },
      )

      try {
        await Promise.all(
          semordnilapIds.map((semordnilapId) =>
            useCases.removeSemordnilapStatus.execute({
              datasetId,
              semordnilapId,
              status,
            }),
          ),
        )
        setErrorMessage(null)
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'No se ha podido actualizar el estado.',
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
    addStatus,
    removeStatus,
    removeAllStatus,
  }
}
