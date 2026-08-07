import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TagFilterMenu } from '@/presentation/components/TagControls'

describe('TagFilterMenu', () => {
  it('ancla el filtro móvil bajo su botón sin quedar dentro del contenedor', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    const { container } = render(
      <TagFilterMenu
        tags={[]}
        selectedTagIds={new Set()}
        layout="compact"
        onApply={onApply}
        onManage={vi.fn()}
      />,
    )
    const trigger = screen.getByRole('button', { name: 'Etiquetas' })
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
      top: 20,
      right: 380,
      bottom: 64,
      left: 300,
      width: 80,
      height: 44,
      x: 300,
      y: 20,
      toJSON: () => ({}),
    })

    await user.click(trigger)
    const panel = screen.getByRole('dialog', { name: 'Filtrar por etiquetas' })
    expect(container).not.toContainElement(panel)
    expect(panel).toHaveStyle({ position: 'fixed', top: '70px' })
    expect(
      within(panel).getByText('Filtrar por cualquiera'),
    ).toBeInTheDocument()

    await user.click(within(panel).getByRole('button', { name: 'Aplicar' }))
    expect(onApply).toHaveBeenCalledWith(new Set())
    expect(
      screen.queryByRole('dialog', { name: 'Filtrar por etiquetas' }),
    ).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('cierra el filtro compacto al pulsar fuera', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <TagFilterMenu
          tags={[]}
          selectedTagIds={new Set()}
          layout="compact"
          onApply={vi.fn()}
          onManage={vi.fn()}
        />
        <button type="button">Fuera</button>
      </div>,
    )

    await user.click(screen.getByRole('button', { name: 'Etiquetas' }))
    expect(
      screen.getByRole('dialog', { name: 'Filtrar por etiquetas' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Fuera' }))
    expect(
      screen.queryByRole('dialog', { name: 'Filtrar por etiquetas' }),
    ).not.toBeInTheDocument()
  })
})
