import { describe, expect, it } from 'vitest'

import {
  IDLE_CATALOG_SELECTION_POINTER_STATE,
  transitionCatalogSelectionPointer,
} from '@/presentation/interactions/catalog-selection-pointer-machine'

function press() {
  return transitionCatalogSelectionPointer(
    IDLE_CATALOG_SELECTION_POINTER_STATE,
    {
      type: 'press',
      pointerId: 4,
      semordnilapId: 'amor-roma',
      clientX: 20,
      clientY: 30,
    },
  )
}

describe('máquina de selección prolongada del catálogo', () => {
  it('espera antes de seleccionar', () => {
    expect(press()).toMatchObject({
      state: {
        value: 'waiting-for-long-press',
        semordnilapId: 'amor-roma',
      },
      effects: [{ type: 'schedule-long-press', pointerId: 4 }],
    })
  })

  it('entra en selección al cumplirse el tiempo', () => {
    const transition = transitionCatalogSelectionPointer(press().state, {
      type: 'long-press',
      pointerId: 4,
    })

    expect(transition.state.value).toBe('triggered')
    expect(transition.effects).toEqual([
      { type: 'cancel-long-press' },
      { type: 'select', semordnilapId: 'amor-roma' },
    ])
  })

  it('conserva el toque normal si se suelta antes de tiempo', () => {
    const transition = transitionCatalogSelectionPointer(press().state, {
      type: 'release',
      pointerId: 4,
    })

    expect(transition).toEqual({
      state: IDLE_CATALOG_SELECTION_POINTER_STATE,
      effects: [{ type: 'cancel-long-press' }],
    })
  })

  it('cancela la espera cuando detecta intención de scroll', () => {
    const transition = transitionCatalogSelectionPointer(press().state, {
      type: 'move',
      pointerId: 4,
      clientX: 20,
      clientY: 41,
    })

    expect(transition).toMatchObject({
      state: {
        value: 'cancelled-for-scroll',
        semordnilapId: 'amor-roma',
      },
      effects: [{ type: 'cancel-long-press' }],
    })
  })

  it('ignora los eventos de otro puntero', () => {
    const waiting = press().state
    expect(
      transitionCatalogSelectionPointer(waiting, {
        type: 'release',
        pointerId: 9,
      }),
    ).toEqual({ state: waiting, effects: [] })
  })
})
