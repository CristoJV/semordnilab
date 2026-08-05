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
import { WorkspacePage } from '@/presentation/pages/WorkspacePage'

import {
  createAtomicSemordnilap,
  createCatalogItem,
  testDataset,
} from '../support/fixtures'

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

    const catalog = await screen.findByRole('region', {
      name: 'Catálogo bilingüe',
    })
    const pairedList = within(catalog).getByRole('list', {
      name: 'Semordnilaps filtrados',
    })
    const pairedRows = within(pairedList).getAllByRole('listitem')

    expect(pairedRows).toHaveLength(2)
    expect(
      within(pairedRows[0]!).getByRole('button', {
        name: 'Añadir ella a la composición',
      }),
    ).toBeInTheDocument()
    expect(
      within(pairedRows[0]!).getByRole('button', {
        name: 'Añadir a lle a la composición',
      }),
    ).toBeInTheDocument()

    await user.click(
      within(catalog).getByRole('button', {
        name: 'Añadir ella a la composición',
      }),
    )
    await user.click(
      within(catalog).getByRole('button', {
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

  it('combina ambos filtros sin romper la alineación', async () => {
    const user = userEvent.setup()
    render(<WorkspacePage dependencies={createDependencies()} />)

    await user.selectOptions(
      screen.getByLabelText('Conjunto lingüístico'),
      testDataset.id,
    )

    const catalog = await screen.findByRole('region', {
      name: 'Catálogo bilingüe',
    })
    await user.type(
      within(catalog).getByRole('searchbox', {
        name: 'Buscar en Español',
      }),
      'ella',
    )

    await waitFor(() => {
      const rows = within(catalog)
        .getByRole('list', { name: 'Semordnilaps filtrados' })
        .querySelectorAll('li')
      expect(rows).toHaveLength(1)
      expect(rows[0]).toHaveTextContent('ella')
      expect(rows[0]).toHaveTextContent('a lle')
    })

    const targetSearch = within(catalog).getByRole('searchbox', {
      name: 'Buscar en Gallego',
    })
    await user.type(targetSearch, 'e son')

    expect(
      await within(catalog).findByText(
        'No hay semordnilaps que coincidan con ambas búsquedas.',
      ),
    ).toBeInTheDocument()

    await user.clear(targetSearch)
    await user.type(targetSearch, 'a lle')

    await waitFor(() => {
      const row = within(catalog)
        .getByRole('list', { name: 'Semordnilaps filtrados' })
        .querySelector('li')
      expect(row).toHaveTextContent('ella')
      expect(row).toHaveTextContent('a lle')
      expect(row).not.toHaveTextContent('no se')
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
      await screen.findByRole('region', { name: 'Catálogo bilingüe' }),
    ).toBeInTheDocument()
    expect(load).toHaveBeenCalledTimes(2)
  })
})
