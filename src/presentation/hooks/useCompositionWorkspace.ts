import { useCallback, useMemo, useRef, useState } from 'react'

import {
  composeSemordnilaps,
  type CompositionSnapshot,
  type Semordnilap,
} from '@/domain/semordnilap'

export type DraftSemordnilapComponent = {
  instanceId: number
  semordnilap: Semordnilap
}

type CompositionPresent = {
  components: readonly DraftSemordnilapComponent[]
  insertionIndex: number
}

type CompositionHistory = {
  past: readonly CompositionPresent[]
  present: CompositionPresent
  future: readonly CompositionPresent[]
}

export type CompositionWorkspaceState = {
  components: readonly DraftSemordnilapComponent[]
  insertionIndex: number
  snapshot: CompositionSnapshot
  canUndo: boolean
  canRedo: boolean
  add: (semordnilap: Semordnilap) => void
  remove: (instanceId: number) => void
  move: (instanceId: number, offset: -1 | 1) => void
  selectInsertion: (index: number) => void
  clear: () => void
  undo: () => void
  redo: () => void
  restore: (
    semordnilaps: readonly Semordnilap[],
    insertionIndex: number,
  ) => void
}

const emptyPresent: CompositionPresent = { components: [], insertionIndex: 0 }

function commit(
  history: CompositionHistory,
  present: CompositionPresent,
): CompositionHistory {
  return {
    past: [...history.past.slice(-99), history.present],
    present,
    future: [],
  }
}

export function useCompositionWorkspace(): CompositionWorkspaceState {
  const [history, setHistory] = useState<CompositionHistory>({
    past: [],
    present: emptyPresent,
    future: [],
  })
  const nextInstanceId = useRef(0)
  const { components, insertionIndex } = history.present

  const add = useCallback((semordnilap: Semordnilap) => {
    const instanceId = nextInstanceId.current++
    setHistory((current) => {
      const index = Math.min(
        current.present.insertionIndex,
        current.present.components.length,
      )
      const nextComponents = [...current.present.components]
      nextComponents.splice(index, 0, { instanceId, semordnilap })
      return commit(current, {
        components: nextComponents,
        insertionIndex: index + 1,
      })
    })
  }, [])

  const remove = useCallback((instanceId: number) => {
    setHistory((current) => {
      const index = current.present.components.findIndex(
        (component) => component.instanceId === instanceId,
      )
      if (index < 0) return current
      const components = current.present.components.filter(
        (component) => component.instanceId !== instanceId,
      )
      const insertionIndex = Math.min(
        components.length,
        current.present.insertionIndex > index
          ? current.present.insertionIndex - 1
          : current.present.insertionIndex,
      )
      return commit(current, { components, insertionIndex })
    })
  }, [])

  const move = useCallback((instanceId: number, offset: -1 | 1) => {
    setHistory((current) => {
      const from = current.present.components.findIndex(
        (component) => component.instanceId === instanceId,
      )
      const to = from + offset
      if (from < 0 || to < 0 || to >= current.present.components.length) {
        return current
      }
      const components = [...current.present.components]
      ;[components[from], components[to]] = [components[to]!, components[from]!]
      return commit(current, { ...current.present, components })
    })
  }, [])

  const selectInsertion = useCallback((index: number) => {
    setHistory((current) => ({
      ...current,
      present: {
        ...current.present,
        insertionIndex: Math.max(
          0,
          Math.min(index, current.present.components.length),
        ),
      },
    }))
  }, [])

  const clear = useCallback(
    () =>
      setHistory((current) =>
        current.present.components.length === 0
          ? current
          : commit(current, emptyPresent),
      ),
    [],
  )

  const undo = useCallback(() => {
    setHistory((current) => {
      const previous = current.past.at(-1)
      if (!previous) return current
      return {
        past: current.past.slice(0, -1),
        present: previous,
        future: [current.present, ...current.future],
      }
    })
  }, [])

  const redo = useCallback(() => {
    setHistory((current) => {
      const [next, ...future] = current.future
      if (!next) return current
      return {
        past: [...current.past, current.present],
        present: next,
        future,
      }
    })
  }, [])

  const restore = useCallback(
    (semordnilaps: readonly Semordnilap[], requestedIndex: number) => {
      const restoredComponents = semordnilaps.map((semordnilap) => ({
        instanceId: nextInstanceId.current++,
        semordnilap,
      }))
      setHistory({
        past: [],
        present: {
          components: restoredComponents,
          insertionIndex: Math.max(
            0,
            Math.min(requestedIndex, restoredComponents.length),
          ),
        },
        future: [],
      })
    },
    [],
  )

  const snapshot = useMemo(
    () => composeSemordnilaps(components.map(({ semordnilap }) => semordnilap)),
    [components],
  )

  return {
    components,
    insertionIndex,
    snapshot,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    add,
    remove,
    move,
    selectInsertion,
    clear,
    undo,
    redo,
    restore,
  }
}
