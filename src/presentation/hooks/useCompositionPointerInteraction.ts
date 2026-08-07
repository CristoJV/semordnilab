import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'

import {
  IDLE_POINTER_STATE,
  transitionCompositionPointer,
  type CompositionPointerEffect,
  type CompositionPointerEvent,
  type CompositionPointerState,
  type CompositionPointerTarget,
  type CompositionSide,
} from '@/presentation/interactions/composition-pointer-machine'
import {
  calculateHorizontalAutoScroll,
  findNearestCompositionGap,
  isWithinVerticalDropZone,
} from '@/presentation/interactions/composition-drag-geometry'

export type CompositionPointerBindings = {
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void
  onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void
}

type CompositionPointerInteractionOptions = {
  getLane: (side: CompositionSide) => HTMLElement | null
  getScrollContainer?: () => HTMLElement | null
  onRemove: (target: CompositionPointerTarget) => void
  onDrop: (instanceId: number, dropIndex: number) => void
}

const LONG_PRESS_DELAY = 300

export function useCompositionPointerInteraction({
  getLane,
  getScrollContainer,
  onRemove,
  onDrop,
}: CompositionPointerInteractionOptions) {
  const [state, setState] =
    useState<CompositionPointerState>(IDLE_POINTER_STATE)
  const stateRef = useRef<CompositionPointerState>(IDLE_POINTER_STATE)
  const activeElement = useRef<HTMLElement | null>(null)
  const longPressTimer = useRef<number | null>(null)
  const animationFrame = useRef<number | null>(null)
  const latestPointer = useRef({ clientX: 0, clientY: 0 })
  const callbacks = useRef({ getLane, getScrollContainer, onRemove, onDrop })
  const sendRef = useRef<(event: CompositionPointerEvent) => void>(() => {})

  useEffect(() => {
    callbacks.current = { getLane, getScrollContainer, onRemove, onDrop }
  }, [getLane, getScrollContainer, onDrop, onRemove])

  const cancelLongPress = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const stopAutoScroll = () => {
    if (animationFrame.current !== null) {
      window.cancelAnimationFrame(animationFrame.current)
      animationFrame.current = null
    }
  }

  const runAutoScroll = () => {
    stopAutoScroll()
    const tick = () => {
      const current = stateRef.current
      if (current.value !== 'dragging') {
        animationFrame.current = null
        return
      }
      const lane = callbacks.current.getLane(current.target.side)
      if (!lane) {
        animationFrame.current = null
        return
      }
      const scrollContainer = callbacks.current.getScrollContainer?.() ?? lane
      const speed = calculateHorizontalAutoScroll(
        scrollContainer.getBoundingClientRect(),
        latestPointer.current.clientX,
      )
      if (speed === 0) {
        animationFrame.current = null
        return
      }
      const previousScroll = scrollContainer.scrollLeft
      scrollContainer.scrollLeft += speed
      if (scrollContainer.scrollLeft === previousScroll) {
        animationFrame.current = null
        return
      }
      sendRef.current({
        type: 'move',
        pointerId: current.pointerId,
        clientX: latestPointer.current.clientX,
        clientY: latestPointer.current.clientY,
        dropIndex: findNearestCompositionGap(
          lane,
          latestPointer.current.clientX,
        ),
      })
      animationFrame.current = window.requestAnimationFrame(tick)
    }
    animationFrame.current = window.requestAnimationFrame(tick)
  }

  const executeEffects = (effects: readonly CompositionPointerEffect[]) => {
    for (const effect of effects) {
      switch (effect.type) {
        case 'schedule-long-press':
          cancelLongPress()
          longPressTimer.current = window.setTimeout(() => {
            longPressTimer.current = null
            sendRef.current({
              type: 'long-press',
              pointerId: effect.pointerId,
            })
          }, LONG_PRESS_DELAY)
          break
        case 'cancel-long-press':
          cancelLongPress()
          break
        case 'start-drag':
          try {
            activeElement.current?.setPointerCapture(effect.state.pointerId)
          } catch {
            // El puntero puede haber sido cancelado por el navegador.
          }
          if (typeof navigator.vibrate === 'function') navigator.vibrate(8)
          runAutoScroll()
          break
        case 'remove':
          callbacks.current.onRemove(effect.target)
          activeElement.current = null
          break
        case 'drop':
          stopAutoScroll()
          callbacks.current.onDrop(effect.target.instanceId, effect.dropIndex)
          activeElement.current = null
          break
        case 'cancel-drag':
          stopAutoScroll()
          activeElement.current = null
          break
      }
    }
  }

  const send = (event: CompositionPointerEvent) => {
    const transition = transitionCompositionPointer(stateRef.current, event)
    stateRef.current = transition.state
    setState(transition.state)
    executeEffects(transition.effects)
  }
  useEffect(() => {
    sendRef.current = send
  })

  useEffect(
    () => () => {
      cancelLongPress()
      stopAutoScroll()
    },
    [],
  )

  const bind = (
    target: CompositionPointerTarget,
  ): CompositionPointerBindings => ({
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0 || stateRef.current.value !== 'idle') return
      activeElement.current = event.currentTarget
      latestPointer.current = {
        clientX: event.clientX,
        clientY: event.clientY,
      }
      if (event.pointerType === 'mouse') {
        event.preventDefault()
        event.currentTarget.focus()
        try {
          event.currentTarget.setPointerCapture(event.pointerId)
        } catch {
          // El navegador puede haber cancelado el puntero.
        }
      }
      send({
        type: 'press',
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        target,
        clientX: event.clientX,
        clientY: event.clientY,
      })
    },
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
      const current = stateRef.current
      if (current.value === 'idle' || current.pointerId !== event.pointerId)
        return
      latestPointer.current = {
        clientX: event.clientX,
        clientY: event.clientY,
      }
      if (current.value === 'dragging' && event.cancelable) {
        event.preventDefault()
      }
      const lane = callbacks.current.getLane(target.side)
      send({
        type: 'move',
        pointerId: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
        dropIndex: findNearestCompositionGap(lane, event.clientX),
      })
      if (stateRef.current.value === 'dragging') runAutoScroll()
    },
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => {
      const current = stateRef.current
      if (current.value === 'dragging') {
        const lane = callbacks.current.getLane(current.target.side)
        if (
          lane &&
          !isWithinVerticalDropZone(lane.getBoundingClientRect(), event.clientY)
        ) {
          send({ type: 'cancel', pointerId: event.pointerId })
          return
        }
      }
      send({ type: 'release', pointerId: event.pointerId })
    },
    onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => {
      send({ type: 'cancel', pointerId: event.pointerId })
    },
  })

  return {
    state,
    bind,
    dragging: state.value === 'dragging' ? state : null,
  }
}
