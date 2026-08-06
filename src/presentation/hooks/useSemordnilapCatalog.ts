import { useCallback, useEffect, useMemo, useState } from 'react'

import type {
  AvailableDataset,
  ListAvailableDatasets,
  LoadedSemordnilapDataset,
  LoadAtomicSemordnilaps,
  LoadSelectedDataset,
  SaveSelectedDataset,
} from '@/application'
import type { DatasetId } from '@/domain/semordnilap'

export type CatalogStatus = 'idle' | 'loading' | 'ready' | 'error'

type CatalogUseCases = {
  listAvailableDatasets: ListAvailableDatasets
  loadAtomicSemordnilaps: LoadAtomicSemordnilaps
  loadSelectedDataset: LoadSelectedDataset
  saveSelectedDataset: SaveSelectedDataset
}

type SemordnilapCatalogState = {
  datasets: readonly AvailableDataset[]
  selectedDatasetId: DatasetId | ''
  loadedDataset: LoadedSemordnilapDataset | null
  status: CatalogStatus
  errorMessage: string | null
  selectDataset: (datasetId: DatasetId | '') => void
  retry: () => void
}

export function useSemordnilapCatalog(
  useCases: CatalogUseCases,
): SemordnilapCatalogState {
  const datasets = useMemo(
    () => useCases.listAvailableDatasets.execute(),
    [useCases.listAvailableDatasets],
  )
  const initialDatasetId = useMemo(() => {
    const saved = useCases.loadSelectedDataset.execute()
    return datasets.some(({ id }) => id === saved) ? saved : ''
  }, [datasets, useCases.loadSelectedDataset])
  const [selectedDatasetId, setSelectedDatasetId] = useState<DatasetId | ''>(
    initialDatasetId,
  )
  const [loadedDataset, setLoadedDataset] =
    useState<LoadedSemordnilapDataset | null>(null)
  const [status, setStatus] = useState<CatalogStatus>(
    initialDatasetId ? 'loading' : 'idle',
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    if (!selectedDatasetId) {
      return undefined
    }

    const controller = new AbortController()

    void useCases.loadAtomicSemordnilaps
      .execute(selectedDatasetId, controller.signal)
      .then((dataset) => {
        if (!controller.signal.aborted) {
          setLoadedDataset(dataset)
          setStatus('ready')
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setStatus('error')
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'No se ha podido cargar el dataset.',
          )
        }
      })

    return () => controller.abort()
  }, [selectedDatasetId, reloadToken, useCases.loadAtomicSemordnilaps])

  const selectDataset = useCallback(
    (datasetId: DatasetId | '') => {
      if (datasetId === selectedDatasetId) return
      useCases.saveSelectedDataset.execute(datasetId)
      setSelectedDatasetId(datasetId)
      setLoadedDataset(null)
      setErrorMessage(null)
      setStatus(datasetId ? 'loading' : 'idle')
    },
    [selectedDatasetId, useCases.saveSelectedDataset],
  )

  const retry = useCallback(() => {
    setLoadedDataset(null)
    setErrorMessage(null)
    setStatus('loading')
    setReloadToken((current) => current + 1)
  }, [])

  return {
    datasets,
    selectedDatasetId,
    loadedDataset,
    status,
    errorMessage,
    selectDataset,
    retry,
  }
}
