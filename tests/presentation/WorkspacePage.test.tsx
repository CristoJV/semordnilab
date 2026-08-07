import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
  AddSemordnilapTagAssignments,
  ApplySemordnilapTagChanges,
  ClearCompositionDraft,
  DeleteSavedComposite,
  DeleteSemordnilapTag,
  ExportPersonalData,
  ImportPersonalData,
  InspectSavedCompositeDeletion,
  GetPersonalDataSummary,
  ListAvailableDatasets,
  ListSavedCompositeSemordnilaps,
  ListSemordnilapStatuses,
  ListSemordnilapTags,
  LoadAtomicSemordnilaps,
  LoadCompositionDraft,
  LoadSelectedDataset,
  LoadWorkspacePreferences,
  MigrateSemordnilapStatusReferences,
  NormalizeSemordnilapStatuses,
  RemoveAllSemordnilapStatuses,
  RemoveSemordnilapTagAssignments,
  RenameSavedComposite,
  SaveCompositeSemordnilap,
  SaveCompositionDraft,
  SaveSelectedDataset,
  SaveWorkspacePreferences,
  SetSemordnilapStatuses,
  CreateSemordnilapTag,
  UpdateSemordnilapTag,
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
import { InMemorySemordnilapTagRepository } from '../support/in-memory-semordnilap-tag-repository'
import { InMemorySelectedDatasetRepository } from '../support/in-memory-selected-dataset-repository'
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
  selectedDatasetId: string = '',
): ApplicationDependencies {
  const source: SemordnilapDatasetSource = {
    listAvailable: () => [testDataset],
    load: async () => loadedDataset,
    ...sourceOverrides,
  }
  const statusRepository = new InMemorySemordnilapStatusRepository()
  const selectedDatasetRepository = new InMemorySelectedDatasetRepository(
    selectedDatasetId,
  )
  const tagRepository = new InMemorySemordnilapTagRepository()
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
    loadSelectedDataset: new LoadSelectedDataset(selectedDatasetRepository),
    saveSelectedDataset: new SaveSelectedDataset(selectedDatasetRepository),
    listSemordnilapStatuses: new ListSemordnilapStatuses(statusRepository),
    setSemordnilapStatuses: new SetSemordnilapStatuses(statusRepository),
    normalizeSemordnilapStatuses: new NormalizeSemordnilapStatuses(
      statusRepository,
    ),
    removeAllSemordnilapStatuses: new RemoveAllSemordnilapStatuses(
      statusRepository,
    ),
    migrateSemordnilapStatusReferences: new MigrateSemordnilapStatusReferences(
      statusRepository,
    ),
    listSemordnilapTags: new ListSemordnilapTags(tagRepository),
    createSemordnilapTag: new CreateSemordnilapTag(tagRepository),
    updateSemordnilapTag: new UpdateSemordnilapTag(tagRepository),
    deleteSemordnilapTag: new DeleteSemordnilapTag(tagRepository),
    addSemordnilapTagAssignments: new AddSemordnilapTagAssignments(
      tagRepository,
    ),
    applySemordnilapTagChanges: new ApplySemordnilapTagChanges(tagRepository),
    removeSemordnilapTagAssignments: new RemoveSemordnilapTagAssignments(
      tagRepository,
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
    inspectSavedCompositeDeletion: new InspectSavedCompositeDeletion(
      personalDataRepository,
    ),
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
  it('ofrece los controles esenciales en la disposición móvil', async () => {
    const matchMedia = vi.fn((query: string) => ({
      media: query,
      matches: query === '(max-width: 560px)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    vi.stubGlobal('matchMedia', matchMedia)
    const user = userEvent.setup()
    render(<WorkspacePage dependencies={createDependencies()} />)

    expect(
      screen.queryByRole('combobox', { name: 'Conjunto lingüístico' }),
    ).not.toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: 'Elegir conjunto lingüístico' }),
    )
    const datasetDialog = screen.getByRole('dialog', {
      name: 'Conjunto lingüístico',
    })
    await user.click(
      within(datasetDialog).getByRole('button', {
        name: /Español \/ Gallego/,
      }),
    )

    const catalog = await screen.findByRole('region', {
      name: 'Catálogo bilingüe',
    })
    expect(screen.getByRole('heading', { name: 'Compón' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Plegar composición' }),
    ).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByRole('button', {
        name: /Cambiar conjunto lingüístico, actual Español \/ Gallego/,
      }),
    ).toHaveTextContent('ES ⇄ GL')
    expect(
      within(catalog).getByRole('button', { name: 'Ordenar Español' }),
    ).toBeInTheDocument()
    const spanishHeading = within(catalog).getByRole('heading', {
      name: 'Español',
    })
    const headingMeta = spanishHeading.parentElement?.nextElementSibling
    expect(headingMeta?.children[0]).toHaveTextContent('2')
    expect(headingMeta?.children[1]).toHaveAccessibleName('Ordenar Español')
    const viewNavigation = within(catalog).getByRole('navigation', {
      name: 'Vistas del catálogo',
    })
    expect(
      within(viewNavigation)
        .getAllByRole('button')
        .map((button) => button.textContent?.trim()),
    ).toEqual(['Todos 2', 'Guardados 0', 'Favoritos 0', 'Descartados 0'])
    expect(viewNavigation.nextElementSibling).toHaveTextContent('Etiquetas')
    expect(
      within(catalog).getByRole('searchbox', { name: 'Buscar en Español' }),
    ).toHaveAttribute('placeholder', 'Buscar')
    const discoveryFab = within(catalog).getByRole('button', {
      name: 'Descubrir semordnilaps',
    })
    expect(discoveryFab).toContainHTML('svg')
    expect(
      within(catalog).queryByRole('button', { name: 'Seleccionar' }),
    ).not.toBeInTheDocument()
    expect(catalog).toHaveTextContent('‹›')

    await user.click(discoveryFab)
    expect(
      within(catalog).getByRole('button', { name: 'Mostrar otro grupo' }),
    ).toHaveAttribute('aria-pressed', 'true')
    const sourceSearch = within(catalog).getByRole('searchbox', {
      name: 'Buscar en Español',
    })
    await user.type(sourceSearch, 'ella')
    await user.click(
      within(catalog).getByRole('button', {
        name: 'Restablecer filtros y orden',
      }),
    )
    expect(sourceSearch).toHaveValue('')

    await user.click(
      within(catalog).getByRole('button', {
        name: 'Añadir ella a la composición',
      }),
    )
    expect(screen.getByRole('button', { name: 'Vaciar' })).toContainHTML('svg')
    expect(
      screen.getByRole('button', { name: 'Guardar composite' }),
    ).toContainHTML('svg')
    const persistenceStatus = await screen.findByText(
      'Borrador guardado localmente',
    )
    expect(getComputedStyle(persistenceStatus).position).toBe('absolute')
    expect(getComputedStyle(persistenceStatus).overflow).toBe('hidden')

    const longPressedOption = within(catalog).getByRole('button', {
      name: 'Añadir ella a la composición',
    })
    vi.useFakeTimers()
    fireEvent.pointerDown(longPressedOption, {
      button: 0,
      pointerId: 17,
      pointerType: 'touch',
      clientX: 20,
      clientY: 20,
    })
    act(() => vi.advanceTimersByTime(420))
    fireEvent.pointerUp(longPressedOption, {
      button: 0,
      pointerId: 17,
      pointerType: 'touch',
      clientX: 20,
      clientY: 20,
    })
    fireEvent.click(longPressedOption)
    expect(
      within(catalog).getByRole('button', { name: 'Deseleccionar ella' }),
    ).toBeInTheDocument()
    expect(longPressedOption.closest('[data-selected]')).toHaveAttribute(
      'data-selected',
      'true',
    )
    vi.useRealTimers()
    const addFavorite = within(catalog).getByRole('button', {
      name: 'Añadir a favoritos',
    })
    const discard = within(catalog).getByRole('button', { name: 'Descartar' })
    const assignTags = within(catalog).getByRole('button', {
      name: 'Etiquetar',
    })
    expect(addFavorite).toHaveTextContent('★')
    expect(discard).toContainHTML('svg')
    expect(assignTags).toContainHTML('svg')
    expect(addFavorite.firstElementChild).toHaveAttribute('aria-hidden', 'true')
    expect(addFavorite.lastElementChild).toHaveTextContent('Añadir a favoritos')
  })

  it('aplica favorito y descarte mediante gestos horizontales en móvil', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        media: query,
        matches: query === '(max-width: 560px)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
    render(
      <WorkspacePage dependencies={createDependencies({}, testDataset.id)} />,
    )
    const catalog = await screen.findByRole('region', {
      name: 'Catálogo bilingüe',
    })
    let option = within(catalog).getByRole('button', {
      name: 'Añadir ella a la composición',
    })
    let row = option.closest('li')
    expect(row).not.toBeNull()

    fireEvent.pointerDown(option, {
      button: 0,
      pointerId: 31,
      pointerType: 'touch',
      clientX: 100,
      clientY: 20,
    })
    fireEvent.pointerMove(option, {
      buttons: 1,
      pointerId: 31,
      pointerType: 'touch',
      clientX: 180,
      clientY: 21,
    })
    expect(within(row as HTMLElement).getByText('Favorito')).toBeInTheDocument()
    fireEvent.pointerUp(option, {
      button: 0,
      pointerId: 31,
      pointerType: 'touch',
      clientX: 180,
      clientY: 21,
    })
    fireEvent.click(option)

    await waitFor(() =>
      expect(
        within(catalog).getByRole('button', { name: /Favoritos 1/ }),
      ).toBeInTheDocument(),
    )
    expect(
      within(row as HTMLElement).getByTitle('Favorito'),
    ).toBeInTheDocument()
    expect(within(row as HTMLElement).queryByLabelText('1 añadidos')).toBeNull()

    fireEvent.pointerDown(option, {
      button: 0,
      pointerId: 35,
      pointerType: 'touch',
      clientX: 100,
      clientY: 20,
    })
    fireEvent.pointerMove(option, {
      buttons: 1,
      pointerId: 35,
      pointerType: 'touch',
      clientX: 180,
      clientY: 21,
    })
    const removeFavoriteFeedback = within(row as HTMLElement).getByText(
      'Quitar favorito',
    )
    expect(
      removeFavoriteFeedback.parentElement?.querySelector('svg'),
    ).toBeInTheDocument()
    fireEvent.pointerCancel(option, {
      pointerId: 35,
      pointerType: 'touch',
    })

    option = within(catalog).getByRole('button', {
      name: 'Añadir ella a la composición',
    })
    row = option.closest('li')
    fireEvent.pointerDown(option, {
      button: 0,
      pointerId: 32,
      pointerType: 'touch',
      clientX: 100,
      clientY: 20,
    })
    fireEvent.pointerMove(option, {
      buttons: 1,
      pointerId: 32,
      pointerType: 'touch',
      clientX: 20,
      clientY: 21,
    })
    expect(
      within(row as HTMLElement).getByText('Descartar'),
    ).toBeInTheDocument()
    fireEvent.pointerUp(option, {
      button: 0,
      pointerId: 32,
      pointerType: 'touch',
      clientX: 20,
      clientY: 21,
    })

    await waitFor(() =>
      expect(
        within(catalog).queryByRole('button', {
          name: 'Añadir ella a la composición',
        }),
      ).not.toBeInTheDocument(),
    )
    expect(
      within(catalog).getByRole('button', { name: /Favoritos 0/ }),
    ).toBeInTheDocument()

    await userEvent
      .setup()
      .click(within(catalog).getByRole('button', { name: /Descartados 1/ }))
    option = await within(catalog).findByRole('button', {
      name: 'Añadir ella a la composición',
    })
    row = option.closest('li')
    expect(
      within(catalog).queryByRole('button', { name: 'Restaurar todos' }),
    ).not.toBeInTheDocument()
    expect(within(row as HTMLElement).queryByTitle('Favorito')).toBeNull()
    expect(
      within(row as HTMLElement).queryByRole('button', { name: /Restaurar/ }),
    ).toBeNull()
    fireEvent.pointerDown(option, {
      button: 0,
      pointerId: 33,
      pointerType: 'touch',
      clientX: 100,
      clientY: 20,
    })
    fireEvent.pointerMove(option, {
      buttons: 1,
      pointerId: 33,
      pointerType: 'touch',
      clientX: 180,
      clientY: 21,
    })
    expect((row as HTMLElement).querySelector('[data-swiping]')).toHaveStyle({
      transform: 'translate3d(0px, 0, 0)',
    })
    expect(within(row as HTMLElement).queryByText(/Favorito/)).toBeNull()
    fireEvent.pointerUp(option, {
      button: 0,
      pointerId: 33,
      pointerType: 'touch',
      clientX: 180,
      clientY: 21,
    })
    fireEvent.pointerDown(option, {
      button: 0,
      pointerId: 34,
      pointerType: 'touch',
      clientX: 100,
      clientY: 20,
    })
    fireEvent.pointerMove(option, {
      buttons: 1,
      pointerId: 34,
      pointerType: 'touch',
      clientX: 20,
      clientY: 21,
    })
    expect(
      within(row as HTMLElement).getByText('Restaurar'),
    ).toBeInTheDocument()
    fireEvent.pointerUp(option, {
      button: 0,
      pointerId: 34,
      pointerType: 'touch',
      clientX: 20,
      clientY: 21,
    })
    expect(
      screen.queryByRole('dialog', { name: 'Acciones del semordnilap' }),
    ).not.toBeInTheDocument()
    expect(
      await screen.findByText('Semordnilap restaurado.'),
    ).toBeInTheDocument()
    await waitFor(() =>
      expect(
        within(catalog).queryByRole('button', {
          name: 'Añadir ella a la composición',
        }),
      ).not.toBeInTheDocument(),
    )
  })

  it('ofrece selección accesible desde el menú móvil y controla todo el filtro', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        media: query,
        matches: query === '(max-width: 560px)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
    const user = userEvent.setup()
    render(
      <WorkspacePage dependencies={createDependencies({}, testDataset.id)} />,
    )
    const catalog = await screen.findByRole('region', {
      name: 'Catálogo bilingüe',
    })

    await user.click(screen.getByRole('button', { name: 'Menú' }))
    expect(
      within(catalog).queryByRole('button', {
        name: 'Descubrir semordnilaps',
      }),
    ).not.toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: 'Seleccionar semordnilaps' }),
    )

    const selectAll = within(catalog).getByRole('checkbox', {
      name: 'Seleccionar los 2 resultados',
    })
    expect(selectAll).not.toBeChecked()
    await user.click(
      within(catalog).getByRole('button', { name: 'Seleccionar ella' }),
    )
    expect(selectAll).toBePartiallyChecked()
    expect(selectAll).toHaveAttribute('aria-checked', 'mixed')
    await user.click(selectAll)
    expect(selectAll).toBeChecked()
    expect(within(catalog).getByText('2 seleccionados')).toBeInTheDocument()
    await user.click(selectAll)
    expect(selectAll).not.toBeChecked()
    expect(within(catalog).getByText('0 seleccionados')).toBeInTheDocument()
  })

  it('restaura el conjunto lingüístico guardado al iniciar', async () => {
    render(
      <WorkspacePage dependencies={createDependencies({}, testDataset.id)} />,
    )

    expect(screen.getByLabelText('Conjunto lingüístico')).toHaveValue(
      testDataset.id,
    )
    expect(
      await screen.findByRole('region', { name: 'Catálogo bilingüe' }),
    ).toBeInTheDocument()
  })

  it('abre la gestión global de etiquetas desde el menú', async () => {
    const user = userEvent.setup()
    render(<WorkspacePage dependencies={createDependencies()} />)

    await user.click(screen.getByRole('button', { name: 'Menú' }))
    await user.click(
      screen.getByRole('button', { name: 'Gestionar etiquetas' }),
    )

    expect(
      screen.getByRole('dialog', { name: 'Gestionar etiquetas' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('dialog', { name: 'Menú' }),
    ).not.toBeInTheDocument()
  })

  it('crea, asigna y filtra etiquetas sin romper la pareja bilingüe', async () => {
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
      within(catalog).getByText('Etiquetas', { selector: 'summary' }),
    )
    await user.click(within(catalog).getByRole('button', { name: 'Gestionar' }))
    const dialog = screen.getByRole('dialog', { name: 'Gestionar etiquetas' })
    await user.click(
      within(dialog).getByRole('button', { name: 'Nueva etiqueta' }),
    )
    await user.type(within(dialog).getByLabelText('Nombre'), 'Curioso')
    await user.click(within(dialog).getByRole('button', { name: 'Verde' }))
    await user.click(within(dialog).getByRole('button', { name: 'Estrella' }))
    await user.click(
      within(dialog).getByRole('button', { name: 'Crear etiqueta' }),
    )
    expect(await within(dialog).findByText('Curioso')).toBeInTheDocument()
    await user.click(
      within(dialog).getByRole('button', { name: 'Cerrar diálogo' }),
    )

    await user.click(
      within(catalog).getByRole('button', { name: 'Seleccionar' }),
    )
    const assignmentToggle = within(catalog).getByRole('button', {
      name: 'Etiquetar',
    })
    expect(assignmentToggle).toBeDisabled()
    await user.click(
      within(catalog).getByRole('button', { name: 'Seleccionar ella' }),
    )
    expect(assignmentToggle).toBeEnabled()
    await user.click(assignmentToggle)
    const assignmentDialog = screen.getByRole('dialog', {
      name: 'Etiquetar selección',
    })
    await user.click(
      within(assignmentDialog).getByRole('checkbox', { name: /Curioso/ }),
    )
    expect(
      within(catalog).getByRole('button', { name: 'Deseleccionar ella' }),
    ).not.toHaveAttribute(
      'title',
      expect.stringContaining('Etiquetas: Curioso'),
    )
    await user.click(
      within(assignmentDialog).getByRole('button', { name: 'Aplicar' }),
    )
    expect(
      screen.queryByRole('dialog', { name: 'Etiquetar selección' }),
    ).not.toBeInTheDocument()
    await waitFor(() =>
      expect(
        within(catalog).getByRole('button', {
          name: 'Deseleccionar ella',
        }),
      ).toHaveAttribute('title', expect.stringContaining('Etiquetas: Curioso')),
    )
    expect(within(catalog).getAllByTitle('Curioso')).toHaveLength(1)
    await user.click(
      within(catalog).getByRole('button', { name: 'Cerrar selección' }),
    )

    const filterToggle = within(catalog).getByText('Etiquetas', {
      selector: 'summary',
    })
    await user.click(filterToggle)
    await user.click(within(catalog).getByRole('checkbox', { name: 'Curioso' }))
    expect(
      within(
        within(catalog).getByRole('list', { name: 'Semordnilaps filtrados' }),
      ).getAllByRole('listitem'),
    ).toHaveLength(2)
    await user.click(within(catalog).getByRole('button', { name: 'Aplicar' }))
    expect(filterToggle.closest('details')).not.toHaveAttribute('open')
    const filtered = within(catalog).getByRole('list', {
      name: 'Semordnilaps filtrados',
    })
    expect(within(filtered).getAllByRole('listitem')).toHaveLength(1)
    expect(within(filtered).getByText('ella')).toBeInTheDocument()
  })

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
    const sharedCompositionScroll = screen.getByRole('region', {
      name: 'Desplazar ambas composiciones',
    })
    const fixedLanguageLabels = sharedCompositionScroll.previousElementSibling

    expect(getComponentTexts(sourceComposition)).toEqual(['ella', 'no se'])
    expect(getComponentTexts(targetComposition)).toEqual(['e son', 'a lle'])
    expect(fixedLanguageLabels).toHaveTextContent('Español')
    expect(fixedLanguageLabels).toHaveTextContent('Gallego')
    expect(sharedCompositionScroll.contains(fixedLanguageLabels)).toBe(false)
    expect(sharedCompositionScroll).toContainElement(sourceComposition)
    expect(sharedCompositionScroll).toContainElement(targetComposition)
    expect(sharedCompositionScroll).not.toContainElement(
      screen.getByRole('button', { name: 'Plegar composición' }),
    )
    expect(sharedCompositionScroll).not.toContainElement(
      screen.getByRole('button', { name: 'Vaciar' }),
    )
    expect(
      document.querySelectorAll('[data-composition-scroll="shared"]'),
    ).toHaveLength(1)
    expect(within(catalog).getAllByLabelText('1 añadidos')).toHaveLength(2)
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

    const sourceElla = within(sourceComposition).getByRole('listitem', {
      name: /ella\. Pulsa Intro para retirar/,
    })
    const targetElla = within(targetComposition).getByRole('listitem', {
      name: /a lle\. Pulsa Intro para retirar/,
    })
    fireEvent.pointerEnter(sourceElla)
    expect(sourceElla).toHaveAttribute('data-highlighted', 'true')
    expect(targetElla).toHaveAttribute('data-highlighted', 'true')
    fireEvent.pointerLeave(sourceElla)
    expect(targetElla).toHaveAttribute('data-highlighted', 'false')

    await user.click(targetElla)

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

  it('ofrece grupos de descubrimiento y vuelve a la búsqueda normal', async () => {
    const user = userEvent.setup()
    render(<WorkspacePage dependencies={createDependencies()} />)
    await user.selectOptions(
      screen.getByLabelText('Conjunto lingüístico'),
      testDataset.id,
    )
    const catalog = await screen.findByRole('region', {
      name: 'Catálogo bilingüe',
    })

    await user.click(within(catalog).getByRole('button', { name: 'Descubrir' }))
    expect(
      within(catalog).getByRole('button', { name: 'Otro grupo' }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(within(catalog).getByText('2 de 2')).toBeInTheDocument()

    await user.type(
      within(catalog).getByRole('searchbox', { name: 'Buscar en Español' }),
      'ella',
    )
    expect(
      within(catalog).getByRole('button', { name: 'Descubrir' }),
    ).toHaveAttribute('aria-pressed', 'false')
    expect(within(catalog).queryByText('2 de 2')).not.toBeInTheDocument()
  })

  it('virtualiza un catálogo grande y conserva el scroll al marcar estados', async () => {
    const manyItems: LoadedSemordnilapDataset = {
      dataset: testDataset,
      items: Array.from({ length: 100 }, (_, index) =>
        createCatalogItem(
          createAtomicSemordnilap(
            `item-${index}`,
            `palabra ${index}`,
            `palabra${index}`,
            `${index} arbalap`,
            `${index}arbalap`,
          ),
        ),
      ),
    }
    const user = userEvent.setup()
    render(
      <WorkspacePage
        dependencies={createDependencies({ load: async () => manyItems })}
      />,
    )
    await user.selectOptions(
      screen.getByLabelText('Conjunto lingüístico'),
      testDataset.id,
    )
    const catalog = await screen.findByRole('region', {
      name: 'Catálogo bilingüe',
    })
    const list = within(catalog).getByRole('list', {
      name: 'Semordnilaps filtrados',
    })
    const scroller = list.parentElement!

    expect(within(list).getAllByRole('listitem').length).toBeLessThan(100)
    expect(within(list).getAllByRole('listitem')[0]).toHaveAttribute(
      'aria-setsize',
      '100',
    )

    scroller.scrollTop = 560
    fireEvent.scroll(scroller)
    const visibleRow = within(list).getAllByRole('listitem')[3]!
    const favorite = within(visibleRow).getByRole('button', {
      name: /Añadir a favoritos/,
    })
    await user.click(favorite)
    await waitFor(() => expect(favorite).toHaveAccessibleName(/Quitar/))
    expect(scroller.scrollTop).toBe(560)
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

    await user.click(within(catalog).getByRole('button', { name: 'Descubrir' }))
    expect(within(catalog).getAllByRole('listitem')).toHaveLength(2)
    expect(
      within(catalog).queryByRole('button', {
        name: 'Añadir ella no se a la composición',
      }),
    ).not.toBeInTheDocument()
    await user.click(within(catalog).getByRole('button', { name: /Todos 3/ }))
    expect(within(catalog).getAllByRole('listitem')).toHaveLength(3)

    await user.click(screen.getByRole('button', { name: 'Guardar composite' }))
    expect(
      await screen.findByText('Esta composición ya estaba guardada.'),
    ).toBeInTheDocument()
    expect(within(catalog).getAllByRole('listitem')).toHaveLength(3)
  })

  it('mantiene estable un favorito y conserva alineado el catálogo descartado', async () => {
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
      expect(rows[0]).toHaveTextContent('ella')
      expect(rows[1]).toHaveTextContent('no se')
      expect(rows[1]).toHaveTextContent('e son')
    })
    expect(
      within(catalog).getByRole('button', {
        name: 'Quitar de favoritos: no se / e son',
      }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Deshacer favorito' }))
    expect(
      await within(catalog).findByRole('button', {
        name: 'Añadir a favoritos: no se / e son',
      }),
    ).toBeInTheDocument()

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
        name: /Descartados 1/,
      }),
    )

    const discardedRow = await within(catalog).findByRole('listitem')
    expect(discardedRow).toHaveTextContent('ella')
    expect(discardedRow).toHaveTextContent('a lle')
    expect(
      within(discardedRow).queryByRole('button', { name: /favoritos/i }),
    ).not.toBeInTheDocument()

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

  it('descarta un favorito de forma exclusiva y deshacer recupera su estado', async () => {
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
        name: 'Añadir a favoritos: ella / a lle',
      }),
    )
    await user.click(
      await within(catalog).findByRole('button', {
        name: 'Descartar: ella / a lle',
      }),
    )

    await waitFor(() => {
      expect(
        within(catalog).getByRole('button', { name: /Favoritos 0/ }),
      ).toBeInTheDocument()
      expect(
        within(catalog).getByRole('button', { name: /Descartados 1/ }),
      ).toBeInTheDocument()
    })
    expect(
      await screen.findByText(
        'Semordnilap descartado y retirado de favoritos.',
      ),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Deshacer descarte' }))

    expect(
      await within(catalog).findByRole('button', {
        name: 'Quitar de favoritos: ella / a lle',
      }),
    ).toBeInTheDocument()
    expect(
      within(catalog).getByRole('button', { name: /Favoritos 1/ }),
    ).toBeInTheDocument()
    expect(
      within(catalog).getByRole('button', { name: /Descartados 0/ }),
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
    const draggingPoints = sourceComposition.querySelectorAll<HTMLElement>(
      '[data-composition-index][data-dragging="true"]',
    )
    expect(draggingPoints).toHaveLength(3)
    expect(
      [...draggingPoints].filter(
        (point) => point.dataset.dropTarget === 'true',
      ),
    ).toHaveLength(1)
    expect(
      sourceComposition.querySelector(
        '[data-composition-index][data-drop-target="true"]',
      ),
    ).toHaveAttribute('data-tone', 'source')
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
    await user.click(screen.getByRole('button', { name: 'Deshacer descarte' }))

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
      name: 'Seleccionar',
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
        name: /Descartados 2/,
      }),
    )
    expect(await within(catalog).findAllByRole('listitem')).toHaveLength(2)
  })

  it('confirma antes de restaurar una colección descartada grande', async () => {
    const manyItems = Array.from({ length: 10 }, (_, index) => {
      const normalized = `palabra${index}`
      return createCatalogItem(
        createAtomicSemordnilap(
          `item-${index}`,
          normalized,
          normalized,
          [...normalized].reverse().join(''),
          [...normalized].reverse().join(''),
        ),
      )
    })
    const user = userEvent.setup()
    render(
      <WorkspacePage
        dependencies={createDependencies({
          load: async () => ({ dataset: testDataset, items: manyItems }),
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
      within(catalog).getByRole('button', { name: 'Seleccionar' }),
    )
    await user.click(
      within(catalog).getByRole('checkbox', {
        name: 'Seleccionar los 10 resultados',
      }),
    )
    await user.click(within(catalog).getByRole('button', { name: 'Descartar' }))
    await user.click(
      within(catalog).getByRole('button', { name: /Descartados 10/ }),
    )

    expect(within(catalog).queryByText('Viendo descartados')).toBeNull()
    await user.click(
      within(catalog).getByRole('button', { name: 'Restaurar todos' }),
    )
    const dialog = screen.getByRole('dialog', {
      name: 'Restaurar descartados',
    })
    expect(dialog).toHaveTextContent('Se restaurarán 10 semordnilaps')
    await user.click(
      within(dialog).getByRole('button', { name: 'Restaurar todos' }),
    )

    expect(
      await within(catalog).findByText(
        'No hay semordnilaps descartados que coincidan con ambas búsquedas.',
      ),
    ).toBeInTheDocument()
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

  it('ofrece un único acceso superior a los descartados', async () => {
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
      name: /Descartados 0/,
    })
    expect(discarded).toBeInTheDocument()
    expect(
      within(catalog).queryByRole('button', {
        name: /Ver descartados desde/,
      }),
    ).not.toBeInTheDocument()
    const discard = within(catalog).getByRole('button', {
      name: 'Descartar: ella / a lle',
    })
    expect(discard.querySelector('svg')).toBeInTheDocument()
    expect(discard).not.toHaveTextContent('×')
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
