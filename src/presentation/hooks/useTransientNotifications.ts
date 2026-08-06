import { useCallback, useEffect, useRef, useState } from 'react'

export type NotificationTone = 'warning' | 'success' | 'error' | 'info'

export type TransientNotification = {
  id: number
  message: string
  tone: NotificationTone
  action?: {
    label: string
    run: () => void
  }
}

export type NotificationInput = Omit<TransientNotification, 'id'> & {
  lifetime?: number
}

export type Notify = (input: NotificationInput) => number

export function useTransientNotifications() {
  const [notifications, setNotifications] = useState<
    readonly TransientNotification[]
  >([])
  const nextId = useRef(0)
  const timers = useRef(new Map<number, number>())
  const activeIds = useRef<readonly number[]>([])

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer !== undefined) window.clearTimeout(timer)
    timers.current.delete(id)
    activeIds.current = activeIds.current.filter((activeId) => activeId !== id)
    setNotifications((current) =>
      current.filter((notification) => notification.id !== id),
    )
  }, [])

  const notify = useCallback(
    ({ lifetime = 3200, ...input }: NotificationInput) => {
      const id = nextId.current++
      const evictedIds = activeIds.current.slice(0, -2)
      for (const evictedId of evictedIds) {
        const timer = timers.current.get(evictedId)
        if (timer !== undefined) window.clearTimeout(timer)
        timers.current.delete(evictedId)
      }
      activeIds.current = [...activeIds.current.slice(-2), id]
      setNotifications((current) => [...current.slice(-2), { id, ...input }])
      timers.current.set(
        id,
        window.setTimeout(() => dismiss(id), lifetime),
      )
      return id
    },
    [dismiss],
  )

  useEffect(
    () => () => {
      for (const timer of timers.current.values()) window.clearTimeout(timer)
      timers.current.clear()
      activeIds.current = []
    },
    [],
  )

  return { notifications, notify, dismiss }
}
