import { useCallback, useEffect, useMemo, useState } from 'react'

import type {
  ListSavedCompositeSemordnilaps,
  SaveCompositeSemordnilap,
  SaveCompositeSemordnilapResult,
  SemordnilapCatalogItem,
  RenameSavedComposite,
  DeleteSavedComposite,
} from '@/application'
import { createCompositeCatalogItem } from '@/application'
import type {
  AtomicSemordnilap,
  DatasetId,
  Semordnilap,
} from '@/domain/semordnilap'

type CompositeUseCases = {
  listSavedCompositeSemordnilaps: ListSavedCompositeSemordnilaps
  saveCompositeSemordnilap: SaveCompositeSemordnilap
  renameSavedComposite: RenameSavedComposite
  deleteSavedComposite: DeleteSavedComposite
}

type SavedCompositeState = {
  items: readonly SemordnilapCatalogItem[]
  ready: boolean
  errorMessage: string | null
  save: (
    components: readonly Semordnilap[],
    title?: string,
  ) => Promise<SaveCompositeSemordnilapResult>
  rename: (id: string, title: string) => Promise<void>
  remove: (id: string) => Promise<void>
}

export function useSavedCompositeSemordnilaps(
  datasetId: DatasetId | '',
  atomicItems: readonly SemordnilapCatalogItem[],
  useCases: CompositeUseCases,
): SavedCompositeState {
  const atomics = useMemo(
    () =>
      atomicItems
        .map(({ semordnilap }) => semordnilap)
        .filter(
          (semordnilap): semordnilap is AtomicSemordnilap =>
            semordnilap.kind === 'atomic',
        ),
    [atomicItems],
  )
  const [items, setItems] = useState<readonly SemordnilapCatalogItem[]>([])
  const [loadedDatasetId, setLoadedDatasetId] = useState<DatasetId | ''>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    if (!datasetId || atomics.length === 0) {
      return undefined
    }
    let active = true
    void useCases.listSavedCompositeSemordnilaps
      .execute(datasetId, atomics)
      .then((composites) => {
        if (!active) return
        setItems(composites.map(createCompositeCatalogItem))
        setLoadedDatasetId(datasetId)
        setErrorMessage(null)
      })
      .catch((error: unknown) => {
        if (!active) return
        setItems([])
        setLoadedDatasetId(datasetId)
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'No se han podido cargar los composites guardados.',
        )
      })
    return () => {
      active = false
    }
  }, [atomics, datasetId, reloadToken, useCases.listSavedCompositeSemordnilaps])

  const save = useCallback(
    async (components: readonly Semordnilap[], title?: string) => {
      if (!datasetId) throw new Error('No hay un dataset seleccionado.')
      const result = await useCases.saveCompositeSemordnilap.execute({
        datasetId,
        components,
        ...(title ? { title } : {}),
      })
      setReloadToken((current) => current + 1)
      return result
    },
    [datasetId, useCases.saveCompositeSemordnilap],
  )

  const rename = useCallback(
    async (id: string, title: string) => {
      await useCases.renameSavedComposite.execute(id, title)
      setReloadToken((current) => current + 1)
    },
    [useCases.renameSavedComposite],
  )
  const remove = useCallback(
    async (id: string) => {
      await useCases.deleteSavedComposite.execute(id)
      setReloadToken((current) => current + 1)
    },
    [useCases.deleteSavedComposite],
  )

  return {
    items,
    ready: Boolean(datasetId && loadedDatasetId === datasetId),
    errorMessage,
    save,
    rename,
    remove,
  }
}
