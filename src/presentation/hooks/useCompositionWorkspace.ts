import { useCallback, useMemo, useRef, useState } from 'react'

import {
  composeAtomicSemordnilaps,
  type AtomicSemordnilap,
  type CompositionSnapshot,
} from '@/domain/semordnilap'

export type DraftSemordnilapComponent = {
  instanceId: number
  semordnilap: AtomicSemordnilap
}

type CompositionWorkspaceState = {
  components: readonly DraftSemordnilapComponent[]
  snapshot: CompositionSnapshot
  add: (semordnilap: AtomicSemordnilap) => void
  remove: (instanceId: number) => void
  clear: () => void
}

export function useCompositionWorkspace(): CompositionWorkspaceState {
  const [components, setComponents] = useState<
    readonly DraftSemordnilapComponent[]
  >([])
  const nextInstanceId = useRef(0)

  const add = useCallback((semordnilap: AtomicSemordnilap) => {
    const instanceId = nextInstanceId.current
    nextInstanceId.current += 1
    setComponents((current) => [...current, { instanceId, semordnilap }])
  }, [])

  const remove = useCallback((instanceId: number) => {
    setComponents((current) =>
      current.filter((component) => component.instanceId !== instanceId),
    )
  }, [])

  const clear = useCallback(() => setComponents([]), [])

  const snapshot = useMemo(
    () =>
      composeAtomicSemordnilaps(
        components.map(({ semordnilap }) => semordnilap),
      ),
    [components],
  )

  return { components, snapshot, add, remove, clear }
}
