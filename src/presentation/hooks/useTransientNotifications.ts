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

type NotificationInput = Omit<TransientNotification, 'id'> & {
  lifetime?: number
}

export function useTransientNotifications() {
  const [notifications, setNotifications] = useState<
    readonly TransientNotification[]
  >([])
  const nextId = useRef(0)
  const timers = useRef(new Map<number, number>())

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer !== undefined) window.clearTimeout(timer)
    timers.current.delete(id)
    setNotifications((current) =>
      current.filter((notification) => notification.id !== id),
    )
  }, [])

  const notify = useCallback(
    ({ lifetime = 3200, ...input }: NotificationInput) => {
      const id = nextId.current++
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
    },
    [],
  )

  return { notifications, notify, dismiss }
}
