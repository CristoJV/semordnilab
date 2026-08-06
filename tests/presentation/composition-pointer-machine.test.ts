import { describe, expect, it } from 'vitest'

import {
  IDLE_POINTER_STATE,
  transitionCompositionPointer,
  type CompositionPointerTarget,
} from '@/presentation/interactions/composition-pointer-machine'

const target: CompositionPointerTarget = {
  instanceId: 7,
  canonicalIndex: 2,
  text: 'amor',
  side: 'source',
}

describe('máquina de estados del puntero de composición', () => {
  it('interpreta una pulsación corta como retirada', () => {
    const pressed = transitionCompositionPointer(IDLE_POINTER_STATE, {
      type: 'press',
      pointerId: 1,
      pointerType: 'mouse',
      target,
      clientX: 10,
      clientY: 20,
    })
    expect(pressed.state.value).toBe('pressed')

    const released = transitionCompositionPointer(pressed.state, {
      type: 'release',
      pointerId: 1,
    })
    expect(released).toEqual({
      state: IDLE_POINTER_STATE,
      effects: [{ type: 'remove', target }],
    })
  })

  it('empieza a arrastrar con el ratón solo después del umbral', () => {
    const pressed = transitionCompositionPointer(IDLE_POINTER_STATE, {
      type: 'press',
      pointerId: 1,
      pointerType: 'mouse',
      target,
      clientX: 10,
      clientY: 20,
    })
    const stillPressed = transitionCompositionPointer(pressed.state, {
      type: 'move',
      pointerId: 1,
      clientX: 13,
      clientY: 20,
      dropIndex: 3,
    })
    expect(stillPressed.state.value).toBe('pressed')

    const dragging = transitionCompositionPointer(stillPressed.state, {
      type: 'move',
      pointerId: 1,
      clientX: 16,
      clientY: 20,
      dropIndex: 3,
    })
    expect(dragging.state).toMatchObject({
      value: 'dragging',
      dropIndex: 3,
    })
    expect(dragging.effects[0]?.type).toBe('start-drag')
  })

  it('requiere pulsación prolongada en táctil y deja libre el scroll', () => {
    const waiting = transitionCompositionPointer(IDLE_POINTER_STATE, {
      type: 'press',
      pointerId: 2,
      pointerType: 'touch',
      target,
      clientX: 10,
      clientY: 20,
    })
    expect(waiting.state.value).toBe('waiting-for-long-press')
    expect(waiting.effects).toEqual([
      { type: 'schedule-long-press', pointerId: 2 },
    ])

    const scrolling = transitionCompositionPointer(waiting.state, {
      type: 'move',
      pointerId: 2,
      clientX: 21,
      clientY: 20,
    })
    expect(scrolling.state).toBe(IDLE_POINTER_STATE)
    expect(scrolling.effects).toEqual([{ type: 'cancel-long-press' }])
  })

  it('confirma el índice al soltar y cancela sin mover', () => {
    const waiting = transitionCompositionPointer(IDLE_POINTER_STATE, {
      type: 'press',
      pointerId: 2,
      pointerType: 'touch',
      target,
      clientX: 10,
      clientY: 20,
    })
    const dragging = transitionCompositionPointer(waiting.state, {
      type: 'long-press',
      pointerId: 2,
    })
    const moved = transitionCompositionPointer(dragging.state, {
      type: 'move',
      pointerId: 2,
      clientX: 80,
      clientY: 20,
      dropIndex: 4,
    })
    const dropped = transitionCompositionPointer(moved.state, {
      type: 'release',
      pointerId: 2,
    })
    expect(dropped.effects).toContainEqual({
      type: 'drop',
      target,
      dropIndex: 4,
    })

    const cancelled = transitionCompositionPointer(dragging.state, {
      type: 'cancel',
      pointerId: 2,
    })
    expect(cancelled.state).toBe(IDLE_POINTER_STATE)
    expect(cancelled.effects).toContainEqual({ type: 'cancel-drag' })
  })

  it('ignora eventos pertenecientes a otro puntero', () => {
    const waiting = transitionCompositionPointer(IDLE_POINTER_STATE, {
      type: 'press',
      pointerId: 2,
      pointerType: 'touch',
      target,
      clientX: 10,
      clientY: 20,
    })
    expect(
      transitionCompositionPointer(waiting.state, {
        type: 'release',
        pointerId: 3,
      }),
    ).toEqual({ state: waiting.state, effects: [] })
  })
})
