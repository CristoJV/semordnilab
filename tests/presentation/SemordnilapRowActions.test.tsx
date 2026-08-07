import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SemordnilapRowActions } from '@/presentation/components/SemordnilapRowActions'

function renderActions({
  composite = false,
  discardedView = false,
}: {
  composite?: boolean
  discardedView?: boolean
} = {}) {
  const callbacks = {
    onToggleFavorite: vi.fn(),
    onDiscard: vi.fn(),
    onRestore: vi.fn(),
    onToggleSelection: vi.fn(),
    onOpenComposite: vi.fn(),
  }
  const view = render(
    <SemordnilapRowActions
      text="amor / roma"
      favorite={false}
      discardedView={discardedView}
      selectionMode={false}
      selected={false}
      disabled={false}
      composite={composite}
      layout="compact"
      {...callbacks}
    />,
  )
  return { callbacks, view }
}

describe('acciones compactas de una fila', () => {
  it('muestra los cheurones atómicos como pista sin crear una acción falsa', () => {
    const { view } = renderActions()

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(view.container).toHaveTextContent('‹›')
    expect(
      screen.queryByRole('dialog', { name: 'Acciones del semordnilap' }),
    ).not.toBeInTheDocument()
  })

  it('abre directamente la edición del composite desde el centro', async () => {
    const user = userEvent.setup()
    const { callbacks } = renderActions({ composite: true })
    const trigger = screen.getByRole('button', {
      name: 'Gestionar composite: amor / roma',
    })

    expect(trigger).toContainHTML('svg')
    await user.click(trigger)
    expect(callbacks.onOpenComposite).toHaveBeenCalledOnce()
  })

  it('prioriza la restauración directa para un composite descartado', async () => {
    const user = userEvent.setup()
    const { callbacks } = renderActions({
      composite: true,
      discardedView: true,
    })

    await user.click(
      screen.getByRole('button', { name: 'Restaurar: amor / roma' }),
    )
    expect(callbacks.onRestore).toHaveBeenCalledOnce()
    expect(callbacks.onOpenComposite).not.toHaveBeenCalled()
  })
})
