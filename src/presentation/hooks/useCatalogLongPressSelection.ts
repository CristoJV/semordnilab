import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'

import type { SemordnilapId } from '@/domain/semordnilap'
import {
  IDLE_CATALOG_SELECTION_POINTER_STATE,
  transitionCatalogSelectionPointer,
  type CatalogSelectionPointerEffect,
  type CatalogSelectionPointerEvent,
  type CatalogSelectionPointerState,
} from '@/presentation/interactions/catalog-selection-pointer-machine'

export type CatalogLongPressBindings = {
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void
  onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => void
  onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => void
  onPointerCancel: (event: ReactPointerEvent<HTMLButtonElement>) => void
  onClickCapture: (event: ReactMouseEvent<HTMLButtonElement>) => void
  onContextMenu: (event: ReactMouseEvent<HTMLButtonElement>) => void
}

type CatalogLongPressSelectionOptions = {
  enabled: boolean
  onSelect: (semordnilapId: SemordnilapId) => void
}

export const CATALOG_LONG_PRESS_DELAY = 420

export function useCatalogLongPressSelection({
  enabled,
  onSelect,
}: CatalogLongPressSelectionOptions) {
  const stateRef = useRef<CatalogSelectionPointerState>(
    IDLE_CATALOG_SELECTION_POINTER_STATE,
  )
  const enabledRef = useRef(enabled)
  const onSelectRef = useRef(onSelect)
  const timerRef = useRef<number | null>(null)
  const suppressClickFor = useRef<SemordnilapId | null>(null)
  const sendRef = useRef<(event: CatalogSelectionPointerEvent) => void>(
    () => {},
  )
  const [pendingSemordnilapId, setPendingSemordnilapId] =
    useState<SemordnilapId | null>(null)

  useEffect(() => {
    enabledRef.current = enabled
    onSelectRef.current = onSelect
  }, [enabled, onSelect])

  const cancelTimer = () => {
    if (timerRef.current === null) return
    window.clearTimeout(timerRef.current)
    timerRef.current = null
  }

  const executeEffects = (
    effects: readonly CatalogSelectionPointerEffect[],
  ) => {
    for (const effect of effects) {
      if (effect.type === 'schedule-long-press') {
        cancelTimer()
        timerRef.current = window.setTimeout(() => {
          timerRef.current = null
          sendRef.current({
            type: 'long-press',
            pointerId: effect.pointerId,
          })
        }, CATALOG_LONG_PRESS_DELAY)
      } else if (effect.type === 'cancel-long-press') {
        cancelTimer()
      } else {
        suppressClickFor.current = effect.semordnilapId
        if (typeof navigator.vibrate === 'function') navigator.vibrate(8)
        onSelectRef.current(effect.semordnilapId)
      }
    }
  }

  const send = (event: CatalogSelectionPointerEvent) => {
    const transition = transitionCatalogSelectionPointer(
      stateRef.current,
      event,
    )
    stateRef.current = transition.state
    setPendingSemordnilapId(
      transition.state.value === 'waiting-for-long-press'
        ? transition.state.semordnilapId
        : null,
    )
    executeEffects(transition.effects)
  }
  useEffect(() => {
    sendRef.current = send
  })

  useEffect(() => {
    if (!enabled && stateRef.current.value === 'waiting-for-long-press') {
      sendRef.current({
        type: 'cancel',
        pointerId: stateRef.current.pointerId,
      })
    }
  }, [enabled])

  useEffect(
    () => () => {
      cancelTimer()
    },
    [],
  )

  const bind = (semordnilapId: SemordnilapId): CatalogLongPressBindings => ({
    onPointerDown: (event) => {
      if (
        !enabledRef.current ||
        event.button !== 0 ||
        event.pointerType === 'mouse' ||
        stateRef.current.value !== 'idle'
      ) {
        return
      }
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
      send({
        type: 'move',
        pointerId: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
      })
    },
    onPointerUp: (event) => {
      const current = stateRef.current
      const matchingPointer =
        current.value !== 'idle' && current.pointerId === event.pointerId
      const shouldSuppressClick =
        matchingPointer &&
        (current.value === 'triggered' ||
          current.value === 'cancelled-for-scroll')
      if (matchingPointer && current.value === 'cancelled-for-scroll') {
        suppressClickFor.current = current.semordnilapId
      }
      send({ type: 'release', pointerId: event.pointerId })
      if (shouldSuppressClick) {
        window.setTimeout(() => {
          if (suppressClickFor.current === semordnilapId) {
            suppressClickFor.current = null
          }
        }, 0)
      }
    },
    onPointerCancel: (event) => {
      send({ type: 'cancel', pointerId: event.pointerId })
      if (suppressClickFor.current === semordnilapId) {
        suppressClickFor.current = null
      }
    },
    onClickCapture: (event) => {
      if (suppressClickFor.current !== semordnilapId) return
      event.preventDefault()
      event.stopPropagation()
      suppressClickFor.current = null
    },
    onContextMenu: (event) => {
      const current = stateRef.current
      if (current.value !== 'idle' && current.semordnilapId === semordnilapId) {
        event.preventDefault()
      }
    },
  })

  return { pendingSemordnilapId, bind }
}
