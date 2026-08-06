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
  it('muestra dependencias directas e indirectas antes de borrarlas en cascada', async () => {
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

    await user.click(within(dialog).getByRole('button', { name: 'Eliminar 3' }))
    expect(onDelete).toHaveBeenCalledWith(plan)
  })

  it('bloquea la cascada cuando un borrador usa un composite afectado', async () => {
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
    expect(screen.getByRole('button', { name: 'Eliminar 1' })).toBeDisabled()
  })
})
