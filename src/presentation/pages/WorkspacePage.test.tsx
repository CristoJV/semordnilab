import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
  ListAvailableDatasets,
  LoadAtomicSemordnilaps,
  type LoadedSemordnilapDataset,
  type SemordnilapDatasetSource,
} from '@/application'
import type { ApplicationDependencies } from '@/app/composition/create-application-dependencies'
import {
  createAtomicSemordnilap,
  createCatalogItem,
  testDataset,
} from '@/test/fixtures'

import { WorkspacePage } from './WorkspacePage'

const ella = createAtomicSemordnilap('ella', 'ella', 'ella', 'a lle', 'alle')
const noSe = createAtomicSemordnilap('no-se', 'no se', 'nose', 'e son', 'eson')
const loadedDataset: LoadedSemordnilapDataset = {
  dataset: testDataset,
  items: [createCatalogItem(ella), createCatalogItem(noSe)],
}

function createDependencies(
  sourceOverrides: Partial<SemordnilapDatasetSource> = {},
): ApplicationDependencies {
  const source: SemordnilapDatasetSource = {
    listAvailable: () => [testDataset],
    load: async () => loadedDataset,
    ...sourceOverrides,
  }

  return {
    listAvailableDatasets: new ListAvailableDatasets(source),
    loadAtomicSemordnilaps: new LoadAtomicSemordnilaps(source),
  }
}

function getComponentTexts(list: HTMLElement): string[] {
  return within(list)
    .getAllByRole('listitem')
    .map((item) => item.querySelector('span')?.textContent ?? '')
}

describe('WorkspacePage', () => {
  it('carga el catálogo y compone el destino en orden inverso', async () => {
    const user = userEvent.setup()
    render(<WorkspacePage dependencies={createDependencies()} />)

    expect(
      screen.getByText('Selecciona un conjunto lingüístico para explorar.'),
    ).toBeInTheDocument()

    await user.selectOptions(
      screen.getByLabelText('Conjunto lingüístico'),
      testDataset.id,
    )

    const sourcePanel = await screen.findByRole('region', {
      name: 'Español',
    })
    const targetPanel = screen.getByRole('region', { name: 'Gallego' })

    await user.click(
      within(sourcePanel).getByRole('button', {
        name: 'Añadir ella a la composición',
      }),
    )
    await user.click(
      within(targetPanel).getByRole('button', {
        name: 'Añadir e son a la composición',
      }),
    )

    const sourceComposition = screen.getByRole('list', {
      name: 'Composición en Español',
    })
    const targetComposition = screen.getByRole('list', {
      name: 'Composición en Gallego',
    })

    expect(getComponentTexts(sourceComposition)).toEqual(['ella', 'no se'])
    expect(getComponentTexts(targetComposition)).toEqual(['e son', 'a lle'])
    expect(
      screen.getByText('La composición forma un semordnilap válido.'),
    ).toBeInTheDocument()

    await user.click(
      within(targetComposition).getByRole('button', {
        name: 'Retirar a lle de la composición',
      }),
    )

    expect(getComponentTexts(sourceComposition)).toEqual(['no se'])
    expect(
      screen.getByText(
        'Añade al menos otro semordnilap para formar una composición.',
      ),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Vaciar' }))
    expect(
      screen.getByText(
        'Selecciona semordnilaps de las listas para empezar a componer.',
      ),
    ).toBeInTheDocument()
  })

  it('filtra cada idioma de forma independiente', async () => {
    const user = userEvent.setup()
    render(<WorkspacePage dependencies={createDependencies()} />)

    await user.selectOptions(
      screen.getByLabelText('Conjunto lingüístico'),
      testDataset.id,
    )

    const targetPanel = await screen.findByRole('region', { name: 'Gallego' })
    await user.type(
      within(targetPanel).getByRole('searchbox', {
        name: 'Buscar en Gallego',
      }),
      'e son',
    )

    await waitFor(() => {
      expect(
        within(targetPanel).getByRole('button', {
          name: 'Añadir e son a la composición',
        }),
      ).toBeInTheDocument()
      expect(
        within(targetPanel).queryByRole('button', {
          name: 'Añadir a lle a la composición',
        }),
      ).not.toBeInTheDocument()
    })
  })

  it('muestra un error recuperable y permite reintentar', async () => {
    const user = userEvent.setup()
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error('Archivo dañado'))
      .mockResolvedValueOnce(loadedDataset)
    render(<WorkspacePage dependencies={createDependencies({ load })} />)

    await user.selectOptions(
      screen.getByLabelText('Conjunto lingüístico'),
      testDataset.id,
    )

    expect(await screen.findByRole('alert')).toHaveTextContent('Archivo dañado')
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(
      await screen.findByRole('region', { name: 'Gallego' }),
    ).toBeInTheDocument()
    expect(load).toHaveBeenCalledTimes(2)
  })
})
