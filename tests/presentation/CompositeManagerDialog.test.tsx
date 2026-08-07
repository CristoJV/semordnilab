import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { CompositeDeletionPlan } from '@/application'
import type { CompositeSemordnilap } from '@/domain/semordnilap'
import { CompositeManagerDialog } from '@/presentation/components/CompositeManagerDialog'

const timestamp = '2026-08-06T10:00:00.000Z'

function composite(
  id: string,
  source: string,
  target: string,
): CompositeSemordnilap {
  return {
    kind: 'composite',
    id,
    datasetId: 'es-gl',
    components: [],
    atomicComponents: [],
    source: { language: 'es', text: source, normalized: source },
    target: { language: 'gl', text: target, normalized: target },
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

describe('gestión visual de composites', () => {
  it('muestra el resumen compacto con idiomas, cantidades, favorito y etiquetas', () => {
    const root = {
      ...composite('A', 'raíz compuesta', 'atsupmoc zíar'),
      components: [
        { kind: 'atomic' as const, datasetId: 'es-gl', semordnilapId: 'uno' },
        { kind: 'atomic' as const, datasetId: 'es-gl', semordnilapId: 'dos' },
      ],
      atomicComponents: [
        { kind: 'atomic' as const, datasetId: 'es-gl', semordnilapId: 'uno' },
        { kind: 'atomic' as const, datasetId: 'es-gl', semordnilapId: 'dos' },
      ],
    }

    render(
      <CompositeManagerDialog
        composite={root}
        library={[root]}
        sourceLanguageLabel="Español"
        targetLanguageLabel="Gallego"
        tags={[
          {
            id: 'tag:hallazgo',
            name: 'Hallazgo',
            normalizedName: 'hallazgo',
            color: 'violet',
            icon: 'star',
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ]}
        favorite
        hasCurrentDraft={false}
        usedInCurrentDraft={false}
        onClose={vi.fn()}
        onInsert={vi.fn()}
        onOpenAsDraft={vi.fn()}
        onRename={vi.fn(async () => undefined)}
        onInspectDeletion={vi.fn()}
        onDelete={vi.fn()}
        onExportBackup={vi.fn(async () => undefined)}
      />,
    )

    const dialog = screen.getByRole('dialog', { name: 'Composite guardado' })
    expect(within(dialog).getByText('Español')).toBeInTheDocument()
    expect(within(dialog).getByText('Gallego')).toBeInTheDocument()
    expect(within(dialog).queryByText('Origen')).not.toBeInTheDocument()
    expect(within(dialog).queryByText('Destino')).not.toBeInTheDocument()
    expect(
      within(dialog).getByText('Componentes directos').parentElement,
    ).toHaveTextContent('Componentes directos2')
    expect(
      within(dialog).getByText('Unidades atómicas').parentElement,
    ).toHaveTextContent('Unidades atómicas2')
    expect(
      within(dialog).getByText('Favorito').parentElement,
    ).toHaveTextContent('FavoritoSí')
    expect(
      within(dialog).getByLabelText('Etiquetas del composite'),
    ).toHaveTextContent('Hallazgo')
    expect(
      within(dialog).queryByRole('list', {
        name: 'Componentes del composite',
      }),
    ).not.toBeInTheDocument()
  })

  it('explica las dependencias directas e indirectas sin ofrecer un borrado en cascada', async () => {
    const user = userEvent.setup()
    const root = composite('A', 'raíz', 'ziar')
    const direct = { ...composite('B', 'directo', 'otcerid'), title: 'Directo' }
    const indirect = composite('C', 'indirecto', 'otceridni')
    const plan: CompositeDeletionPlan = {
      found: true,
      rootId: root.id,
      directDependentIds: [direct.id],
      dependentIds: [direct.id, indirect.id],
      dependentDraftDatasetIds: [],
    }
    const onDelete = vi.fn(async () => undefined)
    render(
      <CompositeManagerDialog
        composite={root}
        library={[root, direct, indirect]}
        sourceLanguageLabel="Español"
        targetLanguageLabel="Gallego"
        tags={[]}
        favorite={false}
        hasCurrentDraft={false}
        usedInCurrentDraft={false}
        onClose={vi.fn()}
        onInsert={vi.fn()}
        onOpenAsDraft={vi.fn()}
        onRename={vi.fn(async () => undefined)}
        onInspectDeletion={vi.fn(async () => plan)}
        onDelete={onDelete}
        onExportBackup={vi.fn(async () => undefined)}
      />,
    )

    const dialog = screen.getByRole('dialog', { name: 'Composite guardado' })
    await user.click(
      within(dialog).getByRole('button', { name: 'Eliminar composite' }),
    )
    expect(
      await within(dialog).findByText('Dependencia directa'),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByText('Dependencia indirecta'),
    ).toBeInTheDocument()
    expect(within(dialog).getByText('Directo')).toBeInTheDocument()
    expect(
      within(dialog).getByText(
        'Elimina primero los composites derivados indicados.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('dialog', { name: 'Eliminar composite' }),
    ).not.toBeInTheDocument()
    expect(
      within(dialog).queryByRole('button', { name: /^Eliminar \d+$/ }),
    ).not.toBeInTheDocument()
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('explica el bloqueo cuando un borrador usa un composite afectado', async () => {
    const user = userEvent.setup()
    const root = composite('A', 'raíz', 'ziar')
    const plan: CompositeDeletionPlan = {
      found: true,
      rootId: root.id,
      directDependentIds: [],
      dependentIds: [],
      dependentDraftDatasetIds: ['es-gl'],
    }
    render(
      <CompositeManagerDialog
        composite={root}
        library={[root]}
        sourceLanguageLabel="Español"
        targetLanguageLabel="Gallego"
        tags={[]}
        favorite={false}
        hasCurrentDraft
        usedInCurrentDraft
        onClose={vi.fn()}
        onInsert={vi.fn()}
        onOpenAsDraft={vi.fn()}
        onRename={vi.fn(async () => undefined)}
        onInspectDeletion={vi.fn(async () => plan)}
        onDelete={vi.fn(async () => undefined)}
        onExportBackup={vi.fn(async () => undefined)}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Eliminar composite' }))
    expect(
      await screen.findByText(
        'Retira los composites afectados del borrador antes de continuar.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('dialog', { name: 'Eliminar composite' }),
    ).not.toBeInTheDocument()
  })

  it('pide confirmación central antes de eliminar un composite sin dependencias', async () => {
    const user = userEvent.setup()
    const root = composite('A', 'raíz', 'ziar')
    const plan: CompositeDeletionPlan = {
      found: true,
      rootId: root.id,
      directDependentIds: [],
      dependentIds: [],
      dependentDraftDatasetIds: [],
    }
    const onDelete = vi.fn(async () => undefined)
    const onClose = vi.fn()

    render(
      <CompositeManagerDialog
        composite={root}
        library={[root]}
        sourceLanguageLabel="Español"
        targetLanguageLabel="Gallego"
        tags={[]}
        favorite={false}
        hasCurrentDraft={false}
        usedInCurrentDraft={false}
        onClose={onClose}
        onInsert={vi.fn()}
        onOpenAsDraft={vi.fn()}
        onRename={vi.fn(async () => undefined)}
        onInspectDeletion={vi.fn(async () => plan)}
        onDelete={onDelete}
        onExportBackup={vi.fn(async () => undefined)}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Eliminar composite' }))
    const confirmation = await screen.findByRole('dialog', {
      name: 'Eliminar composite',
    })
    expect(confirmation.parentElement).toHaveAttribute('data-centered', 'true')
    expect(
      within(confirmation).getByText(
        '¿Seguro que quieres eliminar este composite?',
      ),
    ).toBeInTheDocument()
    expect(within(confirmation).getByText('Español')).toBeInTheDocument()
    expect(within(confirmation).getByText('Gallego')).toBeInTheDocument()

    await user.click(
      within(confirmation).getByRole('button', { name: 'Eliminar' }),
    )
    expect(onDelete).toHaveBeenCalledWith(plan)
    expect(onClose).toHaveBeenCalledOnce()
  })
})
