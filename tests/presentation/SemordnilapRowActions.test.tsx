import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SemordnilapRowActions } from '@/presentation/components/SemordnilapRowActions'

function renderActions({
  composite = false,
  discardedView = false,
  layout = 'compact',
}: {
  composite?: boolean
  discardedView?: boolean
  layout?: 'compact' | 'wide'
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
      layout={layout}
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

  it('reutiliza el mismo icono de edición en móvil y escritorio', () => {
    const compact = renderActions({ composite: true })
    const compactIcon = compact.view.container.querySelector('svg')?.innerHTML
    compact.view.unmount()

    const wide = renderActions({ composite: true, layout: 'wide' })
    const wideIcon = wide.view.container.querySelector('svg')?.innerHTML

    expect(compactIcon).toBeTruthy()
    expect(wideIcon).toBe(compactIcon)
  })

  it('deja solo la pista del gesto izquierdo en un composite descartado', () => {
    const { callbacks, view } = renderActions({
      composite: true,
      discardedView: true,
    })

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(view.container).toHaveTextContent('‹')
    expect(view.container).not.toHaveTextContent('›')
    expect(view.container.querySelector('svg')).not.toBeInTheDocument()
    expect(callbacks.onRestore).not.toHaveBeenCalled()
    expect(callbacks.onOpenComposite).not.toHaveBeenCalled()
  })
})
