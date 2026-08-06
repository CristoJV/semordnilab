import type { TransientNotification } from '@/presentation/hooks/useTransientNotifications'

import styles from './NotificationViewport.module.css'

type NotificationViewportProps = {
  notifications: readonly TransientNotification[]
  onDismiss: (id: number) => void
}

export function NotificationViewport({
  notifications,
  onDismiss,
}: NotificationViewportProps) {
  if (notifications.length === 0) return null
  return (
    <div className={styles.viewport} aria-label="Notificaciones">
      {notifications.map((notification) => (
        <div
          className={styles.notification}
          data-tone={notification.tone}
          key={notification.id}
          role={notification.tone === 'error' ? 'alert' : 'status'}
        >
          <span>{notification.message}</span>
          {notification.action && (
            <button
              type="button"
              onClick={() => {
                notification.action?.run()
                onDismiss(notification.id)
              }}
            >
              {notification.action.label}
            </button>
          )}
          <button
            className={styles.close}
            type="button"
            onClick={() => onDismiss(notification.id)}
            aria-label="Cerrar notificación"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
