import type { SemordnilapId } from '@/domain/semordnilap'

export type CatalogSwipeDirection = 'left' | 'right'

type IdleState = { value: 'idle' }

type ActivePointerState = {
  pointerId: number
  semordnilapId: SemordnilapId
  originX: number
  originY: number
}

type PendingState = ActivePointerState & { value: 'pending' }
type ScrollingState = ActivePointerState & { value: 'scrolling' }
type SelectionTriggeredState = ActivePointerState & {
  value: 'selection-triggered'
}

export type CatalogSwipingState = ActivePointerState & {
  value: 'swiping'
  direction: CatalogSwipeDirection
  offsetX: number
  ready: boolean
}

export type CatalogRowPointerState =
  | IdleState
  | PendingState
  | ScrollingState
  | SelectionTriggeredState
  | CatalogSwipingState

export type CatalogRowPointerEvent =
  | {
      type: 'press'
      pointerId: number
      semordnilapId: SemordnilapId
      clientX: number
      clientY: number
    }
  | { type: 'move'; pointerId: number; clientX: number; clientY: number }
  | { type: 'long-press'; pointerId: number }
  | { type: 'release'; pointerId: number }
  | { type: 'cancel'; pointerId: number }

export type CatalogRowPointerEffect =
  | { type: 'schedule-long-press'; pointerId: number }
  | { type: 'cancel-long-press' }
  | { type: 'capture-pointer'; pointerId: number }
  | { type: 'indicate-swipe-ready' }
  | { type: 'select'; semordnilapId: SemordnilapId }
  | {
      type: 'commit-swipe'
      semordnilapId: SemordnilapId
      direction: CatalogSwipeDirection
    }

export type CatalogRowPointerTransition = {
  state: CatalogRowPointerState
  effects: readonly CatalogRowPointerEffect[]
}

export type CatalogRowPointerConfig = {
  directionThreshold: number
  commitThreshold: number
  maximumOffset: number
  allowedDirections: readonly CatalogSwipeDirection[]
}

export const DEFAULT_CATALOG_ROW_POINTER_CONFIG: CatalogRowPointerConfig = {
  directionThreshold: 10,
  commitThreshold: 72,
  maximumOffset: 112,
  allowedDirections: ['left', 'right'],
}

export const IDLE_CATALOG_ROW_POINTER_STATE: CatalogRowPointerState = {
  value: 'idle',
}

function swipingState(
  state: ActivePointerState,
  clientX: number,
  config: CatalogRowPointerConfig,
): CatalogSwipingState {
  const rawOffset = clientX - state.originX
  const direction = rawOffset < 0 ? 'left' : 'right'
  const allowed = config.allowedDirections.includes(direction)
  const offsetX = allowed
    ? Math.max(-config.maximumOffset, Math.min(config.maximumOffset, rawOffset))
    : 0
  return {
    ...state,
    value: 'swiping',
    direction,
    offsetX,
    ready: Math.abs(offsetX) >= config.commitThreshold,
  }
}

export function transitionCatalogRowPointer(
  state: CatalogRowPointerState,
  event: CatalogRowPointerEvent,
  config: CatalogRowPointerConfig = DEFAULT_CATALOG_ROW_POINTER_CONFIG,
): CatalogRowPointerTransition {
  if (state.value === 'idle') {
    if (event.type !== 'press') return { state, effects: [] }
    return {
      state: {
        value: 'pending',
        pointerId: event.pointerId,
        semordnilapId: event.semordnilapId,
        originX: event.clientX,
        originY: event.clientY,
      },
      effects: [{ type: 'schedule-long-press', pointerId: event.pointerId }],
    }
  }

  if (event.pointerId !== state.pointerId) return { state, effects: [] }

  if (event.type === 'cancel') {
    return {
      state: IDLE_CATALOG_ROW_POINTER_STATE,
      effects: [{ type: 'cancel-long-press' }],
    }
  }

  if (state.value === 'pending') {
    if (event.type === 'release') {
      return {
        state: IDLE_CATALOG_ROW_POINTER_STATE,
        effects: [{ type: 'cancel-long-press' }],
      }
    }
    if (event.type === 'long-press') {
      return {
        state: { ...state, value: 'selection-triggered' },
        effects: [
          { type: 'cancel-long-press' },
          { type: 'select', semordnilapId: state.semordnilapId },
        ],
      }
    }
    if (event.type !== 'move') return { state, effects: [] }

    const deltaX = event.clientX - state.originX
    const deltaY = event.clientY - state.originY
    if (Math.hypot(deltaX, deltaY) < config.directionThreshold) {
      return { state, effects: [] }
    }
    if (Math.abs(deltaY) >= Math.abs(deltaX)) {
      return {
        state: { ...state, value: 'scrolling' },
        effects: [{ type: 'cancel-long-press' }],
      }
    }

    const next = swipingState(state, event.clientX, config)
    return {
      state: next,
      effects: [
        { type: 'cancel-long-press' },
        { type: 'capture-pointer', pointerId: state.pointerId },
        ...(next.ready ? ([{ type: 'indicate-swipe-ready' }] as const) : []),
      ],
    }
  }

  if (state.value === 'swiping') {
    if (event.type === 'move') {
      const next = swipingState(state, event.clientX, config)
      return {
        state: next,
        effects:
          next.ready && (!state.ready || next.direction !== state.direction)
            ? [{ type: 'indicate-swipe-ready' }]
            : [],
      }
    }
    if (event.type === 'release') {
      return {
        state: IDLE_CATALOG_ROW_POINTER_STATE,
        effects: [
          { type: 'cancel-long-press' },
          ...(state.ready
            ? ([
                {
                  type: 'commit-swipe',
                  semordnilapId: state.semordnilapId,
                  direction: state.direction,
                },
              ] as const)
            : []),
        ],
      }
    }
    return { state, effects: [] }
  }

  if (event.type === 'release') {
    return {
      state: IDLE_CATALOG_ROW_POINTER_STATE,
      effects: [{ type: 'cancel-long-press' }],
    }
  }
  return { state, effects: [] }
}
