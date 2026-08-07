import { describe, expect, it } from 'vitest'

import {
  IDLE_CATALOG_ROW_POINTER_STATE,
  transitionCatalogRowPointer,
} from '@/presentation/interactions/catalog-row-pointer-machine'

function press() {
  return transitionCatalogRowPointer(IDLE_CATALOG_ROW_POINTER_STATE, {
    type: 'press',
    pointerId: 4,
    semordnilapId: 'amor-roma',
    clientX: 100,
    clientY: 30,
  })
}

describe('máquina de interacción de una fila del catálogo', () => {
  it('espera antes de decidir entre toque, selección y gesto', () => {
    expect(press()).toMatchObject({
      state: { value: 'pending', semordnilapId: 'amor-roma' },
      effects: [{ type: 'schedule-long-press', pointerId: 4 }],
    })
  })

  it('conserva el toque normal al soltar sin moverse', () => {
    expect(
      transitionCatalogRowPointer(press().state, {
        type: 'release',
        pointerId: 4,
      }),
    ).toEqual({
      state: IDLE_CATALOG_ROW_POINTER_STATE,
      effects: [{ type: 'cancel-long-press' }],
    })
  })

  it('activa la selección con una pulsación prolongada', () => {
    const transition = transitionCatalogRowPointer(press().state, {
      type: 'long-press',
      pointerId: 4,
    })

    expect(transition.state.value).toBe('selection-triggered')
    expect(transition.effects).toContainEqual({
      type: 'select',
      semordnilapId: 'amor-roma',
    })
  })

  it('cede el gesto al scroll cuando domina el movimiento vertical', () => {
    const transition = transitionCatalogRowPointer(press().state, {
      type: 'move',
      pointerId: 4,
      clientX: 103,
      clientY: 44,
    })

    expect(transition.state.value).toBe('scrolling')
    expect(transition.effects).toEqual([{ type: 'cancel-long-press' }])
  })

  it('revela favorito a la derecha y confirma al superar el umbral', () => {
    const started = transitionCatalogRowPointer(press().state, {
      type: 'move',
      pointerId: 4,
      clientX: 124,
      clientY: 31,
    })
    expect(started.state).toMatchObject({
      value: 'swiping',
      direction: 'right',
      ready: false,
    })
    expect(started.effects).toContainEqual({
      type: 'capture-pointer',
      pointerId: 4,
    })

    const ready = transitionCatalogRowPointer(started.state, {
      type: 'move',
      pointerId: 4,
      clientX: 180,
      clientY: 31,
    })
    expect(ready.state).toMatchObject({
      value: 'swiping',
      direction: 'right',
      ready: true,
    })
    expect(ready.effects).toEqual([{ type: 'indicate-swipe-ready' }])

    const released = transitionCatalogRowPointer(ready.state, {
      type: 'release',
      pointerId: 4,
    })
    expect(released.effects).toContainEqual({
      type: 'commit-swipe',
      semordnilapId: 'amor-roma',
      direction: 'right',
    })
  })

  it('revela descarte a la izquierda y limita el desplazamiento', () => {
    const transition = transitionCatalogRowPointer(press().state, {
      type: 'move',
      pointerId: 4,
      clientX: -100,
      clientY: 30,
    })

    expect(transition.state).toMatchObject({
      value: 'swiping',
      direction: 'left',
      offsetX: -112,
      ready: true,
    })
  })

  it('vuelve al centro sin ejecutar cuando no alcanza el umbral', () => {
    const swiping = transitionCatalogRowPointer(press().state, {
      type: 'move',
      pointerId: 4,
      clientX: 130,
      clientY: 30,
    })
    const released = transitionCatalogRowPointer(swiping.state, {
      type: 'release',
      pointerId: 4,
    })

    expect(released.state).toBe(IDLE_CATALOG_ROW_POINTER_STATE)
    expect(released.effects).not.toContainEqual(
      expect.objectContaining({ type: 'commit-swipe' }),
    )
  })

  it('ignora los eventos de otro puntero', () => {
    const pending = press().state
    expect(
      transitionCatalogRowPointer(pending, {
        type: 'release',
        pointerId: 9,
      }),
    ).toEqual({ state: pending, effects: [] })
  })
})
