import { describe, expect, it, vi } from 'vitest'

import type {
  LoadedSemordnilapDataset,
  SemordnilapDatasetSource,
} from '@/application'
import { ListAvailableDatasets, LoadAtomicSemordnilaps } from '@/application'

import {
  createCatalogItem,
  createAtomicSemordnilap,
  testDataset,
} from '../support/fixtures'

describe('casos de uso del catálogo', () => {
  it('delegan en el puerto sin conocer la infraestructura', async () => {
    const loaded: LoadedSemordnilapDataset = {
      dataset: testDataset,
      items: [
        createCatalogItem(
          createAtomicSemordnilap('ella', 'ella', 'ella', 'a lle', 'alle'),
        ),
      ],
    }
    const load = vi.fn().mockResolvedValue(loaded)
    const source: SemordnilapDatasetSource = {
      listAvailable: () => [testDataset],
      load,
    }
    const listUseCase = new ListAvailableDatasets(source)
    const loadUseCase = new LoadAtomicSemordnilaps(source)
    const controller = new AbortController()

    expect(listUseCase.execute()).toEqual([testDataset])
    await expect(
      loadUseCase.execute(testDataset.id, controller.signal),
    ).resolves.toBe(loaded)
    expect(load).toHaveBeenCalledWith(testDataset.id, controller.signal)
  })
})
