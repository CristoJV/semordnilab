import { useCallback, useEffect, useRef, useState } from 'react'

import type {
  AvailableDataset,
  SaveCompositeSemordnilapResult,
} from '@/application'
import type { CompositionSnapshot } from '@/domain/semordnilap'
import type { DraftSemordnilapComponent } from '@/presentation/hooks/useCompositionWorkspace'
import { useCompositionPointerInteraction } from '@/presentation/hooks/useCompositionPointerInteraction'
import { useTransientNotifications } from '@/presentation/hooks/useTransientNotifications'

import { CompositionLane } from './CompositionLane'
import { NotificationViewport } from './NotificationViewport'
import styles from './CompositionWorkspace.module.css'

type CompositionWorkspaceProps = {
  dataset: AvailableDataset | null
  components: readonly DraftSemordnilapComponent[]
  snapshot: CompositionSnapshot
  onRemove: (instanceId: number) => void
  onMove: (instanceId: number, offset: -1 | 1) => void
  onMoveTo: (instanceId: number, dropIndex: number) => void
  onRestoreRemoved: (
    component: DraftSemordnilapComponent,
    canonicalIndex: number,
  ) => void
  canRestoreRemoved: (semordnilapId: string) => boolean
  insertionIndex: number
  onSelectInsertion: (index: number) => void
  onClear: () => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  persistenceError: string | null
  persistenceStatus: 'loading' | 'saving' | 'saved' | 'error'
  initialCollapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  onDiscardIncompatibleDraft: () => Promise<void>
  onSave: (title?: string) => Promise<SaveCompositeSemordnilapResult>
}

export function CompositionWorkspace({
  dataset,
  components,
  snapshot,
  onRemove,
  onMove,
  onMoveTo,
  onRestoreRemoved,
  canRestoreRemoved,
  insertionIndex,
  onSelectInsertion,
  onClear,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  persistenceError,
  persistenceStatus,
  initialCollapsed,
  onCollapsedChange,
  onDiscardIncompatibleDraft,
  onSave,
}: CompositionWorkspaceProps) {
  const [saving, setSaving] = useState(false)
  const sourceLane = useRef<HTMLOListElement>(null)
  const targetLane = useRef<HTMLOListElement>(null)
  const canRestoreRemovedRef = useRef(canRestoreRemoved)
  const { notifications, notify, dismiss } = useTransientNotifications()
  const [collapsed, setCollapsed] = useState(
    () =>
      initialCollapsed ||
      (typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(max-width: 760px)').matches),
  )
  const sourceLabel = dataset?.sourceLanguage.label ?? 'Origen'
  const targetLabel = dataset?.targetLanguage.label ?? 'Destino'

  useEffect(() => {
    canRestoreRemovedRef.current = canRestoreRemoved
  }, [canRestoreRemoved])
  const persistenceLabel =
    persistenceStatus === 'loading'
      ? 'Recuperando borrador'
      : persistenceStatus === 'saving'
        ? 'Guardando borrador...'
        : persistenceStatus === 'error'
          ? 'Error al guardar el borrador'
          : 'Borrador guardado localmente'

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current
      onCollapsedChange(next)
      return next
    })
  }

  const removeWithNotification = useCallback(
    (instanceId: number, canonicalIndex: number, text: string) => {
      const component = components.find(
        (candidate) => candidate.instanceId === instanceId,
      )
      if (!component) return
      onRemove(instanceId)
      notify({
        tone: 'warning',
        message: `Se ha retirado «${text}» de la composición.`,
        action: {
          label: 'Deshacer',
          run: () => {
            if (canRestoreRemovedRef.current(component.semordnilap.id)) {
              onRestoreRemoved(component, canonicalIndex)
              return
            }
            notify({
              tone: 'warning',
              message: 'El semordnilap ya no está disponible en este conjunto.',
            })
          },
        },
      })
    },
    [components, notify, onRemove, onRestoreRemoved],
  )
  const getLane = useCallback(
    (side: 'source' | 'target') =>
      side === 'source' ? sourceLane.current : targetLane.current,
    [],
  )
  const pointerInteraction = useCompositionPointerInteraction({
    getLane,
    onRemove: (target) =>
      removeWithNotification(
        target.instanceId,
        target.canonicalIndex,
        target.text,
      ),
    onDrop: onMoveTo,
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      const result = await onSave()
      notify({
        tone: result.created ? 'success' : 'warning',
        message: result.created
          ? 'Composite guardado y añadido al catálogo.'
          : 'Esta composición ya estaba guardada.',
      })
    } catch (error) {
      notify({
        tone: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'No se ha podido guardar el composite.',
        lifetime: 4500,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section
      className={styles.workspace}
      data-collapsed={collapsed}
      aria-labelledby="composition-title"
    >
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow} aria-live="polite">
            {persistenceLabel}
          </p>
          <h1 id="composition-title">Área de composición</h1>
        </div>
        <div className={styles.headingActions}>
          <button type="button" onClick={toggleCollapsed}>
            {collapsed ? 'Expandir área' : 'Plegar área'}
          </button>
          <button type="button" disabled={!canUndo} onClick={onUndo}>
            Deshacer
          </button>
          <button type="button" disabled={!canRedo} onClick={onRedo}>
            Rehacer
          </button>
          {components.length > 0 && (
            <button
              className={styles.saveButton}
              type="button"
              disabled={!snapshot.isComposite || saving}
              onClick={() => void handleSave()}
              aria-label="Guardar composite"
              title={
                snapshot.isComposite
                  ? 'Guardar composite'
                  : 'Añade al menos dos componentes para guardar'
              }
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 4h12l2 2v14H5V4Zm3 0v6h8V4M8 20v-6h8v6" />
              </svg>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          )}
          {components.length > 0 && (
            <button className={styles.clear} type="button" onClick={onClear}>
              Vaciar
            </button>
          )}
        </div>
      </div>

      {collapsed && (
        <p className={styles.compactSummary}>
          {components.length === 0
            ? 'Borrador vacío'
            : `${components.length} componentes, próxima inserción en la posición ${insertionIndex + 1}`}
        </p>
      )}

      {!collapsed &&
        (components.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyMark} aria-hidden="true">
              ↔
            </span>
            <p>
              Selecciona semordnilaps de las listas para empezar a componer.
            </p>
          </div>
        ) : (
          <div className={styles.lanes}>
            <CompositionLane
              side="source"
              languageLabel={sourceLabel}
              components={components}
              insertionIndex={insertionIndex}
              dragging={pointerInteraction.dragging}
              laneRef={sourceLane}
              onSelectInsertion={onSelectInsertion}
              onRemove={removeWithNotification}
              onMove={onMove}
              bindPointer={pointerInteraction.bind}
            />
            <CompositionLane
              side="target"
              languageLabel={targetLabel}
              components={components}
              insertionIndex={insertionIndex}
              dragging={pointerInteraction.dragging}
              laneRef={targetLane}
              onSelectInsertion={onSelectInsertion}
              onRemove={removeWithNotification}
              onMove={onMove}
              bindPointer={pointerInteraction.bind}
            />
          </div>
        ))}

      {pointerInteraction.dragging && (
        <div
          className={styles.dragPreview}
          data-tone={pointerInteraction.dragging.target.side}
          style={{
            left: pointerInteraction.dragging.clientX,
            top: pointerInteraction.dragging.clientY,
          }}
          aria-hidden="true"
        >
          {pointerInteraction.dragging.target.text}
        </div>
      )}
      {persistenceError && (
        <div className={styles.persistenceError} role="alert">
          <span>{persistenceError}</span>
          <button
            type="button"
            onClick={() => void onDiscardIncompatibleDraft()}
          >
            Empezar con un borrador vacío
          </button>
        </div>
      )}
      <NotificationViewport notifications={notifications} onDismiss={dismiss} />
    </section>
  )
}
