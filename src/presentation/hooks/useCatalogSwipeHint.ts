import { useEffect, useRef } from 'react'

import type { Notify } from './useTransientNotifications'

const SWIPE_HINT_STORAGE_KEY = 'semordnilab:catalog-swipe-hint:v1'

export function useCatalogSwipeHint(enabled: boolean, notify: Notify) {
  const handled = useRef(false)

  useEffect(() => {
    if (!enabled || handled.current) return
    handled.current = true

    try {
      if (window.localStorage.getItem(SWIPE_HINT_STORAGE_KEY) === 'seen') return
      window.localStorage.setItem(SWIPE_HINT_STORAGE_KEY, 'seen')
    } catch {
      // El aviso sigue siendo útil aunque el almacenamiento esté bloqueado.
    }

    notify({
      tone: 'info',
      message:
        'Desliza una fila: derecha para favoritos e izquierda para descartar.',
      lifetime: 5200,
    })
  }, [enabled, notify])
}
