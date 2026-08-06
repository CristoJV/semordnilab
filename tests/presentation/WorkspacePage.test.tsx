import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
  AddSemordnilapStatus,
  ClearCompositionDraft,
  DeleteSavedComposite,
  ExportPersonalData,
  ImportPersonalData,
  GetPersonalDataSummary,
  ListAvailableDatasets,
  ListSavedCompositeSemordnilaps,
  ListSemordnilapStatuses,
  LoadAtomicSemordnilaps,
  LoadCompositionDraft,
  LoadWorkspacePreferences,
  MigrateSemordnilapStatusReferences,
  RemoveAllSemordnilapStatuses,
  RemoveSemordnilapStatus,
  RenameSavedComposite,
  SaveCompositeSemordnilap,
  SaveCompositionDraft,
  SaveWorkspacePreferences,
  PreviewPersonalDataImport,
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
import { InMemorySemordnilapStatusRepository } from '../support/in-memory-semordnilap-status-repository'
import {
  InMemoryCompositionDraftRepository,
  InMemoryPersonalDataRepository,
  InMemorySavedCompositeSemordnilapRepository,
  InMemoryWorkspacePreferencesRepository,
} from '../support/in-memory-saved-data-repositories'

const ella = createAtomicSemordnilap('ella', 'ella', 'ella', 'a lle', 'alle')
const noSe = createAtomicSemordnilap('no-se', 'no se', 'nose', 'e son', 'eson')
const shortA = createAtomicSemordnilap('a', 'a', 'a', 'a', 'a')
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
  const statusRepository = new InMemorySemordnilapStatusRepository()
  const compositeRepository = new InMemorySavedCompositeSemordnilapRepository()
  const draftRepository = new InMemoryCompositionDraftRepository()
  const preferencesRepository = new InMemoryWorkspacePreferencesRepository()
  const personalDataRepository = new InMemoryPersonalDataRepository(
    statusRepository,
    compositeRepository,
    draftRepository,
    preferencesRepository,
  )

  return {
    listAvailableDatasets: new ListAvailableDatasets(source),
    loadAtomicSemordnilaps: new LoadAtomicSemordnilaps(source),
    listSemordnilapStatuses: new ListSemordnilapStatuses(statusRepository),
    addSemordnilapStatus: new AddSemordnilapStatus(statusRepository),
    removeSemordnilapStatus: new RemoveSemordnilapStatus(statusRepository),
    removeAllSemordnilapStatuses: new RemoveAllSemordnilapStatuses(
      statusRepository,
    ),
    migrateSemordnilapStatusReferences: new MigrateSemordnilapStatusReferences(
      statusRepository,
    ),
    listSavedCompositeSemordnilaps: new ListSavedCompositeSemordnilaps(
      compositeRepository,
    ),
    saveCompositeSemordnilap: new SaveCompositeSemordnilap(compositeRepository),
    loadCompositionDraft: new LoadCompositionDraft(draftRepository),
    saveCompositionDraft: new SaveCompositionDraft(draftRepository),
    clearCompositionDraft: new ClearCompositionDraft(draftRepository),
    loadWorkspacePreferences: new LoadWorkspacePreferences(
      preferencesRepository,
    ),
    saveWorkspacePreferences: new SaveWorkspacePreferences(
      preferencesRepository,
    ),
    renameSavedComposite: new RenameSavedComposite(personalDataRepository),
    deleteSavedComposite: new DeleteSavedComposite(personalDataRepository),
    exportPersonalData: new ExportPersonalData(personalDataRepository),
    previewPersonalDataImport: new PreviewPersonalDataImport(
      personalDataRepository,
      source,
    ),
    importPersonalData: new ImportPersonalData(personalDataRepository, source),
    getPersonalDataSummary: new GetPersonalDataSummary(personalDataRepository),
    personalDataFileGateway: {
      readText: (file) => file.text(),
      downloadText: vi.fn(),
    },
  }
}

function getComponentTexts(list: HTMLElement): string[] {
  return within(list)
    .getAllByRole('listitem')
    .map((item) => item.textContent?.trim() ?? '')
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
      within(sourceComposition).queryByRole('button', { name: /^Mover/ }),
    ).not.toBeInTheDocument()
    expect(
      within(sourceComposition).queryByRole('button', { name: /^Retirar/ }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText('La composición forma un semordnilap válido.'),
    ).not.toBeInTheDocument()
    expect(screen.queryByTitle('Formas normalizadas')).not.toBeInTheDocument()

    await user.click(
      within(targetComposition).getByRole('listitem', {
        name: /a lle\. Pulsa Intro para retirar/,
      }),
    )

    expect(getComponentTexts(sourceComposition)).toEqual(['no se'])
    expect(
      screen.getByText('Se ha retirado «a lle» de la composición.'),
    ).toBeInTheDocument()
    expect(
      screen
        .getByText('Se ha retirado «a lle» de la composición.')
        .closest('[data-tone]'),
    ).toHaveAttribute('data-tone', 'warning')
    await user.click(
      within(screen.getByLabelText('Notificaciones')).getByRole('button', {
        name: 'Deshacer',
      }),
    )
    expect(getComponentTexts(sourceComposition)).toEqual(['ella', 'no se'])

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

  it('guarda un composite, evita duplicados y lo incorpora al catálogo', async () => {
    const user = userEvent.setup()
    render(<WorkspacePage dependencies={createDependencies()} />)

    await user.selectOptions(
      screen.getByLabelText('Conjunto lingüístico'),
      testDataset.id,
    )
    const catalog = await screen.findByRole('region', {
      name: 'Catálogo bilingüe',
    })
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
    await user.click(screen.getByRole('button', { name: 'Guardar composite' }))

    expect(
      await screen.findByText('Composite guardado y añadido al catálogo.'),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Nombre opcional')).not.toBeInTheDocument()
    expect(
      screen
        .getByText('Composite guardado y añadido al catálogo.')
        .closest('[data-tone]'),
    ).toHaveAttribute('data-tone', 'success')
    await waitFor(() =>
      expect(within(catalog).getAllByRole('listitem')).toHaveLength(3),
    )
    expect(
      within(catalog).getByRole('button', {
        name: 'Añadir ella no se a la composición',
      }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Guardar composite' }))
    expect(
      await screen.findByText('Esta composición ya estaba guardada.'),
    ).toBeInTheDocument()
    expect(within(catalog).getAllByRole('listitem')).toHaveLength(3)
  })

  it('prioriza favoritos y mantiene alineado el catálogo descartado', async () => {
    const user = userEvent.setup()
    render(<WorkspacePage dependencies={createDependencies()} />)

    await user.selectOptions(
      screen.getByLabelText('Conjunto lingüístico'),
      testDataset.id,
    )

    const catalog = await screen.findByRole('region', {
      name: 'Catálogo bilingüe',
    })
    const favorite = within(catalog).getByRole('button', {
      name: 'Añadir a favoritos: no se / e son',
    })
    await waitFor(() => expect(favorite).toBeEnabled())
    await user.click(favorite)

    await waitFor(() => {
      const rows = within(catalog).getAllByRole('listitem')
      expect(rows[0]).toHaveTextContent('no se')
      expect(rows[0]).toHaveTextContent('e son')
    })

    await user.click(
      within(catalog).getByRole('button', {
        name: 'Descartar: ella / a lle',
      }),
    )

    await waitFor(() => {
      const rows = within(catalog).getAllByRole('listitem')
      expect(rows).toHaveLength(1)
      expect(rows[0]).toHaveTextContent('no se')
      expect(rows[0]).toHaveTextContent('e son')
    })

    await user.click(
      within(catalog).getByRole('button', {
        name: 'Ver descartados desde Español',
      }),
    )

    const discardedRow = await within(catalog).findByRole('listitem')
    expect(discardedRow).toHaveTextContent('ella')
    expect(discardedRow).toHaveTextContent('a lle')

    await user.click(
      within(catalog).getByRole('button', {
        name: 'Restaurar: ella / a lle',
      }),
    )
    expect(
      await within(catalog).findByText(
        'No hay semordnilaps descartados que coincidan con ambas búsquedas.',
      ),
    ).toBeInTheDocument()
  })

  it('ordena por cada idioma con un control de tres estados', async () => {
    const user = userEvent.setup()
    render(<WorkspacePage dependencies={createDependencies()} />)

    await user.selectOptions(
      screen.getByLabelText('Conjunto lingüístico'),
      testDataset.id,
    )
    const catalog = await screen.findByRole('region', {
      name: 'Catálogo bilingüe',
    })

    const alphabeticalSort = within(catalog).getByRole('button', {
      name: 'Activar orden alfabético ascendente en Español',
    })
    await user.click(alphabeticalSort)
    await user.click(
      within(catalog).getByRole('button', {
        name: 'Cambiar orden alfabético a descendente en Español',
      }),
    )

    const rows = within(catalog).getAllByRole('listitem')
    expect(rows[0]).toHaveTextContent('no se')
    expect(rows[1]).toHaveTextContent('ella')

    await user.click(
      within(catalog).getByRole('button', {
        name: 'Desactivar orden alfabético en Español',
      }),
    )
    const originalRows = within(catalog).getAllByRole('listitem')
    expect(originalRows[0]).toHaveTextContent('ella')
    expect(originalRows[1]).toHaveTextContent('no se')
  })

  it('combina criterios de ordenación según su prioridad', async () => {
    const user = userEvent.setup()
    const extendedDataset: LoadedSemordnilapDataset = {
      dataset: testDataset,
      items: [
        createCatalogItem(ella),
        createCatalogItem(noSe),
        createCatalogItem(shortA),
      ],
    }
    render(
      <WorkspacePage
        dependencies={createDependencies({
          load: async () => extendedDataset,
        })}
      />,
    )
    await user.selectOptions(
      screen.getByLabelText('Conjunto lingüístico'),
      testDataset.id,
    )
    const catalog = await screen.findByRole('region', {
      name: 'Catálogo bilingüe',
    })

    await user.click(
      within(catalog).getByRole('button', {
        name: 'Activar orden por longitud ascendente en Español',
      }),
    )
    await user.click(
      within(catalog).getByRole('button', {
        name: 'Activar orden alfabético ascendente en Español',
      }),
    )
    await user.click(
      within(catalog).getByRole('button', {
        name: 'Cambiar orden alfabético a descendente en Español',
      }),
    )

    const rows = within(catalog).getAllByRole('listitem')
    expect(rows[0]).toHaveTextContent('a')
    expect(rows[1]).toHaveTextContent('no se')
    expect(rows[2]).toHaveTextContent('ella')
    expect(within(catalog).getByText('1 · 1→9')).toBeInTheDocument()
    expect(within(catalog).getByText('2 · Z→A')).toBeInTheDocument()
  })

  it('inserta en un espacio, mueve componentes y conserva historial', async () => {
    const user = userEvent.setup()
    render(<WorkspacePage dependencies={createDependencies()} />)
    await user.selectOptions(
      screen.getByLabelText('Conjunto lingüístico'),
      testDataset.id,
    )
    const catalog = await screen.findByRole('region', {
      name: 'Catálogo bilingüe',
    })
    await user.click(
      within(catalog).getByRole('button', {
        name: 'Añadir ella a la composición',
      }),
    )
    await user.click(
      within(catalog).getByRole('button', {
        name: 'Añadir no se a la composición',
      }),
    )
    const sourceComposition = screen.getByRole('list', {
      name: 'Composición en Español',
    })
    await user.click(
      within(sourceComposition).getByRole('button', {
        name: 'Insertar el próximo semordnilap en la posición 2 de Español',
      }),
    )
    await user.click(
      within(catalog).getByRole('button', {
        name: 'Añadir ella a la composición',
      }),
    )
    expect(getComponentTexts(sourceComposition)).toEqual([
      'ella',
      'ella',
      'no se',
    ])

    await user.click(screen.getByRole('button', { name: 'Deshacer' }))
    expect(getComponentTexts(sourceComposition)).toEqual(['ella', 'no se'])
    await user.click(screen.getByRole('button', { name: 'Rehacer' }))
    expect(getComponentTexts(sourceComposition)).toEqual([
      'ella',
      'ella',
      'no se',
    ])
    fireEvent.keyDown(
      within(sourceComposition).getByRole('listitem', {
        name: /no se\. Pulsa Intro para retirar/,
      }),
      { key: 'ArrowLeft', shiftKey: true },
    )
    expect(getComponentTexts(sourceComposition)).toEqual([
      'ella',
      'no se',
      'ella',
    ])
  })

  it('arrastra con el ratón hasta un espacio canónico', async () => {
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 1),
    )
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    const user = userEvent.setup()
    render(<WorkspacePage dependencies={createDependencies()} />)
    await user.selectOptions(
      screen.getByLabelText('Conjunto lingüístico'),
      testDataset.id,
    )
    const catalog = await screen.findByRole('region', {
      name: 'Catálogo bilingüe',
    })
    await user.click(
      within(catalog).getByRole('button', {
        name: 'Añadir ella a la composición',
      }),
    )
    await user.click(
      within(catalog).getByRole('button', {
        name: 'Añadir no se a la composición',
      }),
    )
    const sourceComposition = screen.getByRole('list', {
      name: 'Composición en Español',
    })
    vi.spyOn(sourceComposition, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      right: 400,
      top: 0,
      bottom: 60,
      width: 400,
    } as DOMRect)
    for (const point of sourceComposition.querySelectorAll<HTMLElement>(
      '[data-composition-index]',
    )) {
      const index = Number(point.dataset.compositionIndex)
      vi.spyOn(point, 'getBoundingClientRect').mockReturnValue({
        left: index * 150,
        right: index * 150 + 20,
        width: 20,
      } as DOMRect)
    }
    const ellaComponent = within(sourceComposition).getByRole('listitem', {
      name: /ella\. Pulsa Intro para retirar/,
    })

    fireEvent.pointerDown(ellaComponent, {
      button: 0,
      pointerId: 5,
      pointerType: 'mouse',
      clientX: 10,
      clientY: 10,
    })
    fireEvent.pointerMove(ellaComponent, {
      buttons: 1,
      pointerId: 5,
      pointerType: 'mouse',
      clientX: 310,
      clientY: 10,
    })
    fireEvent.pointerUp(ellaComponent, {
      button: 0,
      pointerId: 5,
      pointerType: 'mouse',
      clientX: 310,
      clientY: 10,
    })

    expect(getComponentTexts(sourceComposition)).toEqual(['no se', 'ella'])
    vi.unstubAllGlobals()
  })

  it('recupera automáticamente el borrador y su posición', async () => {
    const dependencies = createDependencies()
    const saveDraft = vi.spyOn(dependencies.saveCompositionDraft, 'execute')
    const firstUser = userEvent.setup()
    const firstRender = render(<WorkspacePage dependencies={dependencies} />)
    await firstUser.selectOptions(
      screen.getByLabelText('Conjunto lingüístico'),
      testDataset.id,
    )
    const catalog = await screen.findByRole('region', {
      name: 'Catálogo bilingüe',
    })
    await firstUser.click(
      within(catalog).getByRole('button', {
        name: 'Añadir ella a la composición',
      }),
    )
    const sourceComposition = screen.getByRole('list', {
      name: 'Composición en Español',
    })
    await firstUser.click(
      within(sourceComposition).getByRole('button', {
        name: 'Insertar el próximo semordnilap en la posición 1 de Español',
      }),
    )
    await firstUser.click(
      within(catalog).getByRole('button', {
        name: 'Añadir no se a la composición',
      }),
    )

    await waitFor(() =>
      expect(saveDraft).toHaveBeenLastCalledWith(
        expect.objectContaining({ insertionIndex: 1 }),
      ),
    )
    expect(screen.getByText('Borrador guardado localmente')).toBeInTheDocument()
    firstRender.unmount()

    const secondUser = userEvent.setup()
    render(<WorkspacePage dependencies={dependencies} />)
    await secondUser.selectOptions(
      screen.getByLabelText('Conjunto lingüístico'),
      testDataset.id,
    )
    const restored = await screen.findByRole('list', {
      name: 'Composición en Español',
    })
    expect(getComponentTexts(restored)).toEqual(['no se', 'ella'])
    expect(
      within(restored).getByRole('button', {
        name: 'Insertar el próximo semordnilap en la posición 2 de Español',
        pressed: true,
      }),
    ).toBeInTheDocument()
  })

  it('no sobrescribe un borrador incompatible sin confirmación', async () => {
    const dependencies = createDependencies()
    vi.spyOn(dependencies.loadCompositionDraft, 'execute').mockResolvedValue({
      datasetId: testDataset.id,
      components: [
        {
          kind: 'atomic',
          datasetId: testDataset.id,
          semordnilapId: 'referencia-ausente',
        },
      ],
      insertionIndex: 1,
      updatedAt: '2026-08-06T10:00:00.000Z',
    })
    const clearDraft = vi.spyOn(dependencies.clearCompositionDraft, 'execute')
    const user = userEvent.setup()
    render(<WorkspacePage dependencies={dependencies} />)

    await user.selectOptions(
      screen.getByLabelText('Conjunto lingüístico'),
      testDataset.id,
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'referencia que ya no está disponible',
    )
    expect(clearDraft).not.toHaveBeenCalled()

    await user.click(
      screen.getByRole('button', { name: 'Empezar con un borrador vacío' }),
    )
    expect(clearDraft).toHaveBeenCalledWith(testDataset.id)
    expect(
      await screen.findByRole('region', { name: 'Catálogo bilingüe' }),
    ).toBeInTheDocument()
  })

  it('permite deshacer inmediatamente un descarte', async () => {
    const user = userEvent.setup()
    render(<WorkspacePage dependencies={createDependencies()} />)
    await user.selectOptions(
      screen.getByLabelText('Conjunto lingüístico'),
      testDataset.id,
    )
    const catalog = await screen.findByRole('region', {
      name: 'Catálogo bilingüe',
    })
    const discard = within(catalog).getByRole('button', {
      name: 'Descartar: ella / a lle',
    })
    await waitFor(() => expect(discard).toBeEnabled())
    await user.click(discard)
    await user.click(
      within(catalog).getByRole('button', { name: 'Deshacer descarte' }),
    )

    await waitFor(() =>
      expect(within(catalog).getAllByRole('listitem')).toHaveLength(2),
    )
  })

  it('aplica estados por lotes mediante selección compartida', async () => {
    const user = userEvent.setup()
    render(<WorkspacePage dependencies={createDependencies()} />)

    await user.selectOptions(
      screen.getByLabelText('Conjunto lingüístico'),
      testDataset.id,
    )
    const catalog = await screen.findByRole('region', {
      name: 'Catálogo bilingüe',
    })
    const selectMany = within(catalog).getByRole('button', {
      name: 'Seleccionar varios',
    })
    await waitFor(() => expect(selectMany).toBeEnabled())
    await user.click(selectMany)
    await user.click(
      within(catalog).getByRole('checkbox', {
        name: 'Seleccionar ella / a lle',
      }),
    )
    await user.click(
      within(catalog).getByRole('checkbox', {
        name: 'Seleccionar no se / e son',
      }),
    )
    await user.click(within(catalog).getByRole('button', { name: 'Descartar' }))

    expect(
      await within(catalog).findByText(
        'No hay semordnilaps que coincidan con ambas búsquedas.',
      ),
    ).toBeInTheDocument()
    await user.click(
      within(catalog).getByRole('button', {
        name: 'Ver descartados desde Gallego',
      }),
    )
    expect(await within(catalog).findAllByRole('listitem')).toHaveLength(2)
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

  it('muestra solo composites guardados y abre su gestión', async () => {
    const user = userEvent.setup()
    render(<WorkspacePage dependencies={createDependencies()} />)
    await user.selectOptions(
      screen.getByLabelText('Conjunto lingüístico'),
      testDataset.id,
    )
    const catalog = await screen.findByRole('region', {
      name: 'Catálogo bilingüe',
    })
    await user.click(
      within(catalog).getByRole('button', {
        name: 'Añadir ella a la composición',
      }),
    )
    await user.click(
      within(catalog).getByRole('button', {
        name: 'Añadir no se a la composición',
      }),
    )
    await user.click(screen.getByRole('button', { name: 'Guardar composite' }))
    await screen.findByText('Composite guardado y añadido al catálogo.')

    await user.click(
      within(catalog).getByRole('button', { name: /Guardados 1/ }),
    )
    expect(within(catalog).getAllByRole('listitem')).toHaveLength(1)
    await user.click(
      within(catalog).getByRole('button', {
        name: 'Gestionar composite: ella no se / e son a lle',
      }),
    )

    const dialog = screen.getByRole('dialog', { name: 'Composite guardado' })
    expect(within(dialog).getByText('ella no se')).toBeInTheDocument()
    expect(within(dialog).getByText('e son a lle')).toBeInTheDocument()
    const title = within(dialog).getByLabelText('Nombre del composite')
    await user.type(title, 'Hallazgo')
    await user.click(within(dialog).getByRole('button', { name: 'Renombrar' }))
    expect(
      await within(dialog).findByText('Nombre actualizado.'),
    ).toBeInTheDocument()
  })

  it('abre el menú, exporta y conserva preferencias', async () => {
    const dependencies = createDependencies()
    const download = vi.spyOn(
      dependencies.personalDataFileGateway,
      'downloadText',
    )
    const savePreferences = vi.spyOn(
      dependencies.saveWorkspacePreferences,
      'execute',
    )
    const user = userEvent.setup()
    render(<WorkspacePage dependencies={dependencies} />)

    await user.click(screen.getByRole('button', { name: 'Menú' }))
    const dialog = screen.getByRole('dialog', { name: 'Menú' })
    await user.click(
      within(dialog).getByRole('button', { name: 'Exportar copia' }),
    )
    await waitFor(() => expect(download).toHaveBeenCalledOnce())

    await user.click(
      within(dialog).getByRole('button', { name: 'Preferencias' }),
    )
    await user.click(
      within(dialog).getByRole('checkbox', {
        name: /Filtros y ordenación por dataset/,
      }),
    )
    await waitFor(() =>
      expect(savePreferences).toHaveBeenCalledWith(
        expect.objectContaining({ rememberCatalogView: false }),
      ),
    )
  })

  it('rechaza una copia incompatible desde el menú antes de importarla', async () => {
    const dependencies = createDependencies()
    vi.spyOn(
      dependencies.personalDataFileGateway,
      'readText',
    ).mockResolvedValue('{}')
    const importData = vi.spyOn(dependencies.importPersonalData, 'execute')
    const user = userEvent.setup()
    render(<WorkspacePage dependencies={dependencies} />)

    await user.click(screen.getByRole('button', { name: 'Menú' }))
    const dialog = screen.getByRole('dialog', { name: 'Menú' })
    const fileInput = within(dialog).getByLabelText(
      'Seleccionar copia para importar',
    )
    await user.upload(
      fileInput,
      new File(['{}'], 'copia.json', { type: 'application/json' }),
    )

    expect(
      await within(dialog).findByText(
        'El archivo no es una copia de SemordniLAB.',
      ),
    ).toBeInTheDocument()
    expect(importData).not.toHaveBeenCalled()
  })

  it('usa una papelera para abrir los descartados', async () => {
    const user = userEvent.setup()
    render(<WorkspacePage dependencies={createDependencies()} />)
    await user.selectOptions(
      screen.getByLabelText('Conjunto lingüístico'),
      testDataset.id,
    )
    const catalog = await screen.findByRole('region', {
      name: 'Catálogo bilingüe',
    })
    const discarded = within(catalog).getByRole('button', {
      name: 'Ver descartados desde Español',
    })
    expect(discarded.querySelector('svg')).toBeInTheDocument()
    expect(discarded).not.toHaveTextContent('⌫')
  })

  it('recupera filtros y ordenación para cada dataset', async () => {
    const dependencies = createDependencies()
    const firstUser = userEvent.setup()
    const firstRender = render(<WorkspacePage dependencies={dependencies} />)
    await firstUser.selectOptions(
      screen.getByLabelText('Conjunto lingüístico'),
      testDataset.id,
    )
    const firstCatalog = await screen.findByRole('region', {
      name: 'Catálogo bilingüe',
    })
    await firstUser.type(
      within(firstCatalog).getByRole('searchbox', {
        name: 'Buscar en Español',
      }),
      'ella',
    )
    await firstUser.click(
      within(firstCatalog).getByRole('button', {
        name: 'Activar orden alfabético ascendente en Español',
      }),
    )
    await waitFor(async () =>
      expect(
        await dependencies.loadWorkspacePreferences.execute(),
      ).toMatchObject({
        catalogViews: [
          expect.objectContaining({
            datasetId: testDataset.id,
            sourceQuery: 'ella',
            sort: [
              expect.objectContaining({
                field: 'alphabetical',
                direction: 'ascending',
              }),
            ],
          }),
        ],
      }),
    )
    firstRender.unmount()

    const secondUser = userEvent.setup()
    render(<WorkspacePage dependencies={dependencies} />)
    await secondUser.selectOptions(
      screen.getByLabelText('Conjunto lingüístico'),
      testDataset.id,
    )
    const restoredCatalog = await screen.findByRole('region', {
      name: 'Catálogo bilingüe',
    })
    expect(
      within(restoredCatalog).getByRole('searchbox', {
        name: 'Buscar en Español',
      }),
    ).toHaveValue('ella')
    expect(
      within(restoredCatalog).getByRole('button', {
        name: 'Cambiar orden alfabético a descendente en Español',
      }),
    ).toBeInTheDocument()
  })
})
