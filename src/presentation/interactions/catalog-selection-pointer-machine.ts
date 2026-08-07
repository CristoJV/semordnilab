import type { SemordnilapId } from '@/domain/semordnilap'

type IdleState = { value: 'idle' }

type ActivePointerState = {
  pointerId: number
  semordnilapId: SemordnilapId
  originX: number
  originY: number
}

type WaitingState = ActivePointerState & { value: 'waiting-for-long-press' }
type TriggeredState = ActivePointerState & { value: 'triggered' }
type CancelledForScrollState = ActivePointerState & {
  value: 'cancelled-for-scroll'
}

export type CatalogSelectionPointerState =
  IdleState | WaitingState | TriggeredState | CancelledForScrollState

export type CatalogSelectionPointerEvent =
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

export type CatalogSelectionPointerEffect =
  | { type: 'schedule-long-press'; pointerId: number }
  | { type: 'cancel-long-press' }
  | { type: 'select'; semordnilapId: SemordnilapId }

export type CatalogSelectionPointerTransition = {
  state: CatalogSelectionPointerState
  effects: readonly CatalogSelectionPointerEffect[]
}

export const IDLE_CATALOG_SELECTION_POINTER_STATE: CatalogSelectionPointerState =
  { value: 'idle' }

const SCROLL_INTENT_THRESHOLD = 10

export function transitionCatalogSelectionPointer(
  state: CatalogSelectionPointerState,
  event: CatalogSelectionPointerEvent,
): CatalogSelectionPointerTransition {
  if (state.value === 'idle') {
    if (event.type !== 'press') return { state, effects: [] }
    return {
      state: {
        value: 'waiting-for-long-press',
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
      state: IDLE_CATALOG_SELECTION_POINTER_STATE,
      effects: [{ type: 'cancel-long-press' }],
    }
  }

  if (state.value === 'waiting-for-long-press') {
    if (event.type === 'release') {
      return {
        state: IDLE_CATALOG_SELECTION_POINTER_STATE,
        effects: [{ type: 'cancel-long-press' }],
      }
    }
    if (event.type === 'long-press') {
      return {
        state: { ...state, value: 'triggered' },
        effects: [
          { type: 'cancel-long-press' },
          { type: 'select', semordnilapId: state.semordnilapId },
        ],
      }
    }
    if (
      event.type === 'move' &&
      Math.hypot(
        event.clientX - state.originX,
        event.clientY - state.originY,
      ) >= SCROLL_INTENT_THRESHOLD
    ) {
      return {
        state: { ...state, value: 'cancelled-for-scroll' },
        effects: [{ type: 'cancel-long-press' }],
      }
    }
    return { state, effects: [] }
  }

  if (event.type === 'release') {
    return {
      state: IDLE_CATALOG_SELECTION_POINTER_STATE,
      effects: [{ type: 'cancel-long-press' }],
    }
  }
  return { state, effects: [] }
}
