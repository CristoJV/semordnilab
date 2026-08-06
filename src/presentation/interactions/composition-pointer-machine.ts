export type CompositionSide = 'source' | 'target'

export type CompositionPointerTarget = {
  instanceId: number
  canonicalIndex: number
  text: string
  side: CompositionSide
}

type IdleState = { value: 'idle' }

type ActivePointerState = {
  pointerId: number
  target: CompositionPointerTarget
  originX: number
  originY: number
}

type PressedState = ActivePointerState & {
  value: 'pressed'
}

type WaitingForLongPressState = ActivePointerState & {
  value: 'waiting-for-long-press'
}

export type DraggingState = ActivePointerState & {
  value: 'dragging'
  clientX: number
  clientY: number
  dropIndex: number
}

export type CompositionPointerState =
  IdleState | PressedState | WaitingForLongPressState | DraggingState

export type CompositionPointerEvent =
  | {
      type: 'press'
      pointerId: number
      pointerType: string
      target: CompositionPointerTarget
      clientX: number
      clientY: number
    }
  | {
      type: 'move'
      pointerId: number
      clientX: number
      clientY: number
      dropIndex?: number
    }
  | { type: 'long-press'; pointerId: number }
  | { type: 'release'; pointerId: number }
  | { type: 'cancel'; pointerId: number }

export type CompositionPointerEffect =
  | { type: 'schedule-long-press'; pointerId: number }
  | { type: 'cancel-long-press' }
  | { type: 'remove'; target: CompositionPointerTarget }
  | { type: 'start-drag'; state: DraggingState }
  | {
      type: 'drop'
      target: CompositionPointerTarget
      dropIndex: number
    }
  | { type: 'cancel-drag' }

export type CompositionPointerTransition = {
  state: CompositionPointerState
  effects: readonly CompositionPointerEffect[]
}

export type CompositionPointerMachineConfig = {
  mouseDragThreshold: number
  touchScrollThreshold: number
}

export const DEFAULT_POINTER_MACHINE_CONFIG: CompositionPointerMachineConfig = {
  mouseDragThreshold: 5,
  touchScrollThreshold: 10,
}

export const IDLE_POINTER_STATE: CompositionPointerState = { value: 'idle' }

function movedAtLeast(
  state: ActivePointerState,
  clientX: number,
  clientY: number,
  threshold: number,
): boolean {
  return (
    Math.hypot(clientX - state.originX, clientY - state.originY) >= threshold
  )
}

function startDragging(
  state: ActivePointerState,
  clientX: number,
  clientY: number,
  dropIndex: number,
): DraggingState {
  return {
    value: 'dragging',
    pointerId: state.pointerId,
    target: state.target,
    originX: state.originX,
    originY: state.originY,
    clientX,
    clientY,
    dropIndex,
  }
}

export function transitionCompositionPointer(
  state: CompositionPointerState,
  event: CompositionPointerEvent,
  config: CompositionPointerMachineConfig = DEFAULT_POINTER_MACHINE_CONFIG,
): CompositionPointerTransition {
  if (state.value === 'idle') {
    if (event.type !== 'press') return { state, effects: [] }
    const base = {
      pointerId: event.pointerId,
      target: event.target,
      originX: event.clientX,
      originY: event.clientY,
    }
    if (event.pointerType === 'mouse') {
      return { state: { value: 'pressed', ...base }, effects: [] }
    }
    return {
      state: { value: 'waiting-for-long-press', ...base },
      effects: [{ type: 'schedule-long-press', pointerId: event.pointerId }],
    }
  }

  if ('pointerId' in event && event.pointerId !== state.pointerId) {
    return { state, effects: [] }
  }

  if (event.type === 'cancel') {
    return {
      state: IDLE_POINTER_STATE,
      effects: [
        { type: 'cancel-long-press' },
        ...(state.value === 'dragging'
          ? ([{ type: 'cancel-drag' }] as const)
          : []),
      ],
    }
  }

  if (state.value === 'pressed') {
    if (event.type === 'release') {
      return {
        state: IDLE_POINTER_STATE,
        effects: [{ type: 'remove', target: state.target }],
      }
    }
    if (
      event.type === 'move' &&
      movedAtLeast(
        state,
        event.clientX,
        event.clientY,
        config.mouseDragThreshold,
      )
    ) {
      const dragging = startDragging(
        state,
        event.clientX,
        event.clientY,
        event.dropIndex ?? state.target.canonicalIndex,
      )
      return {
        state: dragging,
        effects: [{ type: 'start-drag', state: dragging }],
      }
    }
    return { state, effects: [] }
  }

  if (state.value === 'waiting-for-long-press') {
    if (event.type === 'release') {
      return {
        state: IDLE_POINTER_STATE,
        effects: [
          { type: 'cancel-long-press' },
          { type: 'remove', target: state.target },
        ],
      }
    }
    if (event.type === 'long-press') {
      const dragging = startDragging(
        state,
        state.originX,
        state.originY,
        state.target.canonicalIndex,
      )
      return {
        state: dragging,
        effects: [
          { type: 'cancel-long-press' },
          { type: 'start-drag', state: dragging },
        ],
      }
    }
    if (
      event.type === 'move' &&
      movedAtLeast(
        state,
        event.clientX,
        event.clientY,
        config.touchScrollThreshold,
      )
    ) {
      return {
        state: IDLE_POINTER_STATE,
        effects: [{ type: 'cancel-long-press' }],
      }
    }
    return { state, effects: [] }
  }

  if (event.type === 'move') {
    return {
      state: {
        ...state,
        clientX: event.clientX,
        clientY: event.clientY,
        dropIndex: event.dropIndex ?? state.dropIndex,
      },
      effects: [],
    }
  }
  if (event.type === 'release') {
    return {
      state: IDLE_POINTER_STATE,
      effects: [
        { type: 'cancel-long-press' },
        { type: 'drop', target: state.target, dropIndex: state.dropIndex },
      ],
    }
  }
  return { state, effects: [] }
}
