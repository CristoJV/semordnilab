import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SemordnilapRowActions } from '@/presentation/components/SemordnilapRowActions'

function renderActions(composite = false) {
  const callbacks = {
    onToggleFavorite: vi.fn(),
    onDiscard: vi.fn(),
    onRestore: vi.fn(),
    onToggleSelection: vi.fn(),
    onOpenComposite: vi.fn(),
  }
  render(
    <SemordnilapRowActions
      text="amor / roma"
      favorite={false}
      discardedView={false}
      selectionMode={false}
      selected={false}
      disabled={false}
      composite={composite}
      layout="compact"
      {...callbacks}
    />,
  )
  return callbacks
}

describe('acciones compactas de una fila', () => {
  it('utiliza los cheurones como acceso alternativo a acciones con texto', async () => {
    const user = userEvent.setup()
    renderActions()
    const trigger = screen.getByRole('button', {
      name: 'Abrir acciones para amor / roma',
    })
    expect(trigger).toHaveTextContent('‹›')

    await user.click(trigger)
    const dialog = screen.getByRole('dialog', {
      name: 'Acciones del semordnilap',
    })
    expect(dialog).toHaveTextContent('Añadir a favoritos')
    expect(dialog).toHaveTextContent('Descartar')
  })

  it('centra la edición de composites entre ambos cheurones', async () => {
    const user = userEvent.setup()
    const callbacks = renderActions(true)
    const trigger = screen.getByRole('button', {
      name: 'Abrir acciones para amor / roma',
    })

    expect(trigger).toContainHTML('svg')
    await user.click(trigger)
    await user.click(
      screen.getByRole('button', { name: 'Gestionar composite' }),
    )
    expect(callbacks.onOpenComposite).toHaveBeenCalledOnce()
  })
})
