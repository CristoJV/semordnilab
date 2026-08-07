import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, it, vi } from 'vitest'

import { ModalDialog } from '@/presentation/components/ModalDialog'

it('renderiza fuera de contenedores con overflow y conserva el cierre accesible', async () => {
  const user = userEvent.setup()
  const onClose = vi.fn()
  const { container } = render(
    <div data-testid="clipping-parent">
      <ModalDialog title="Opciones" onClose={onClose}>
        <button type="button">Acción</button>
      </ModalDialog>
    </div>,
  )

  const dialog = screen.getByRole('dialog', { name: 'Opciones' })
  expect(container).not.toContainElement(dialog)
  expect(document.body).toContainElement(dialog)

  await user.click(
    within(dialog).getByRole('button', { name: 'Cerrar diálogo' }),
  )
  expect(onClose).toHaveBeenCalledOnce()
})

it('cierra con el fondo y con Escape', async () => {
  const user = userEvent.setup()
  const onClose = vi.fn()
  render(
    <ModalDialog title="Opciones" onClose={onClose}>
      <button type="button">Acción</button>
    </ModalDialog>,
  )

  const dialog = screen.getByRole('dialog', { name: 'Opciones' })
  fireEvent.mouseDown(dialog.parentElement!)
  expect(onClose).toHaveBeenCalledOnce()
  await user.keyboard('{Escape}')
  expect(onClose).toHaveBeenCalledTimes(2)
})

it('lleva el foco al cierre y lo devuelve al elemento anterior', async () => {
  const user = userEvent.setup()

  function Harness() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          Abrir
        </button>
        {open && (
          <ModalDialog title="Opciones" onClose={() => setOpen(false)}>
            <button type="button">Acción</button>
          </ModalDialog>
        )}
      </>
    )
  }

  render(<Harness />)
  const opener = screen.getByRole('button', { name: 'Abrir' })
  await user.click(opener)
  const close = screen.getByRole('button', { name: 'Cerrar diálogo' })
  expect(close).toHaveFocus()
  await user.keyboard('{Escape}')
  expect(opener).toHaveFocus()
})
