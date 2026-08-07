import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'

import type { SemordnilapId } from '@/domain/semordnilap'
import {
  DEFAULT_CATALOG_ROW_POINTER_CONFIG,
  IDLE_CATALOG_ROW_POINTER_STATE,
  transitionCatalogRowPointer,
  type CatalogRowPointerEffect,
  type CatalogRowPointerEvent,
  type CatalogRowPointerState,
  type CatalogSwipeDirection,
} from '@/presentation/interactions/catalog-row-pointer-machine'

export type CatalogRowPointerBindings = {
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void
  onClickCapture: (event: ReactMouseEvent<HTMLDivElement>) => void
  onContextMenu: (event: ReactMouseEvent<HTMLDivElement>) => void
}

type CatalogRowPointerInteractionOptions = {
  enabled: boolean
  allowedSwipeDirections?: readonly CatalogSwipeDirection[]
  semordnilapId: SemordnilapId
  onSelect: (semordnilapId: SemordnilapId) => void
  onSwipe: (
    semordnilapId: SemordnilapId,
    direction: CatalogSwipeDirection,
  ) => void
}

export const CATALOG_ROW_LONG_PRESS_DELAY = 420

export function useCatalogRowPointerInteraction({
  enabled,
  allowedSwipeDirections = DEFAULT_CATALOG_ROW_POINTER_CONFIG.allowedDirections,
  semordnilapId,
  onSelect,
  onSwipe,
}: CatalogRowPointerInteractionOptions) {
  const [state, setState] = useState<CatalogRowPointerState>(
    IDLE_CATALOG_ROW_POINTER_STATE,
  )
  const stateRef = useRef<CatalogRowPointerState>(
    IDLE_CATALOG_ROW_POINTER_STATE,
  )
  const enabledRef = useRef(enabled)
  const allowedSwipeDirectionsRef = useRef(allowedSwipeDirections)
  const callbacksRef = useRef({ onSelect, onSwipe })
  const activeElementRef = useRef<HTMLDivElement | null>(null)
  const timerRef = useRef<number | null>(null)
  const suppressClickRef = useRef(false)
  const sendRef = useRef<
    (event: CatalogRowPointerEvent) => CatalogRowPointerState
  >(() => IDLE_CATALOG_ROW_POINTER_STATE)

  useEffect(() => {
    enabledRef.current = enabled
    allowedSwipeDirectionsRef.current = allowedSwipeDirections
    callbacksRef.current = { onSelect, onSwipe }
  }, [allowedSwipeDirections, enabled, onSelect, onSwipe])

  const cancelTimer = () => {
    if (timerRef.current === null) return
    window.clearTimeout(timerRef.current)
    timerRef.current = null
  }

  const executeEffects = (effects: readonly CatalogRowPointerEffect[]) => {
    for (const effect of effects) {
      switch (effect.type) {
        case 'schedule-long-press':
          cancelTimer()
          timerRef.current = window.setTimeout(() => {
            timerRef.current = null
            sendRef.current({
              type: 'long-press',
              pointerId: effect.pointerId,
            })
          }, CATALOG_ROW_LONG_PRESS_DELAY)
          break
        case 'cancel-long-press':
          cancelTimer()
          break
        case 'capture-pointer':
          try {
            activeElementRef.current?.setPointerCapture(effect.pointerId)
          } catch {
            // El navegador puede cancelar el puntero al iniciar el scroll.
          }
          break
        case 'indicate-swipe-ready':
          if (typeof navigator.vibrate === 'function') navigator.vibrate(10)
          break
        case 'select':
          suppressClickRef.current = true
          if (typeof navigator.vibrate === 'function') navigator.vibrate(8)
          callbacksRef.current.onSelect(effect.semordnilapId)
          break
        case 'commit-swipe':
          callbacksRef.current.onSwipe(effect.semordnilapId, effect.direction)
          break
      }
    }
  }

  const send = (event: CatalogRowPointerEvent): CatalogRowPointerState => {
    const transition = transitionCatalogRowPointer(stateRef.current, event, {
      ...DEFAULT_CATALOG_ROW_POINTER_CONFIG,
      allowedDirections: allowedSwipeDirectionsRef.current,
    })
    stateRef.current = transition.state
    setState(transition.state)
    executeEffects(transition.effects)
    return transition.state
  }

  useEffect(() => {
    sendRef.current = send
  })

  useEffect(() => {
    const current = stateRef.current
    if (
      !enabled &&
      current.value !== 'idle' &&
      current.value !== 'selection-triggered'
    ) {
      sendRef.current({ type: 'cancel', pointerId: current.pointerId })
    }
  }, [enabled])

  useEffect(
    () => () => {
      cancelTimer()
    },
    [],
  )

  const bindings: CatalogRowPointerBindings = {
    onPointerDown: (event) => {
      if (
        !enabledRef.current ||
        event.button !== 0 ||
        event.pointerType === 'mouse' ||
        stateRef.current.value !== 'idle'
      ) {
        return
      }
      activeElementRef.current = event.currentTarget
      send({
        type: 'press',
        pointerId: event.pointerId,
        semordnilapId,
        clientX: event.clientX,
        clientY: event.clientY,
      })
    },
    onPointerMove: (event) => {
      if (stateRef.current.value === 'idle') return
      const next = send({
        type: 'move',
        pointerId: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
      })
      if (next.value === 'swiping' && event.cancelable) event.preventDefault()
    },
    onPointerUp: (event) => {
      const current = stateRef.current
      const matchingPointer =
        current.value !== 'idle' && current.pointerId === event.pointerId
      const suppressClick =
        matchingPointer &&
        (current.value === 'scrolling' ||
          current.value === 'swiping' ||
          current.value === 'selection-triggered')
      if (suppressClick) suppressClickRef.current = true
      send({ type: 'release', pointerId: event.pointerId })
      if (suppressClick) {
        window.setTimeout(() => {
          suppressClickRef.current = false
        }, 0)
      }
    },
    onPointerCancel: (event) => {
      send({ type: 'cancel', pointerId: event.pointerId })
      suppressClickRef.current = false
    },
    onClickCapture: (event) => {
      if (!suppressClickRef.current) return
      event.preventDefault()
      event.stopPropagation()
      suppressClickRef.current = false
    },
    onContextMenu: (event) => {
      if (stateRef.current.value !== 'idle') event.preventDefault()
    },
  }

  return { state, bindings }
}
