import { useCallback, useEffect, useRef, useState } from 'react'

import type {
  AvailableDataset,
  SaveCompositeSemordnilapResult,
} from '@/application'
import type { CompositionSnapshot } from '@/domain/semordnilap'
import type { DraftSemordnilapComponent } from '@/presentation/hooks/useCompositionWorkspace'
import { useCompositionPointerInteraction } from '@/presentation/hooks/useCompositionPointerInteraction'
import type { Notify } from '@/presentation/hooks/useTransientNotifications'

import { CompositionLane } from './CompositionLane'
import { CompositionPhrasesViewport } from './CompositionPhrasesViewport'
import { CompositionToolbar } from './CompositionToolbar'
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
  onNotify: Notify
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
  onNotify,
}: CompositionWorkspaceProps) {
  const [saving, setSaving] = useState(false)
  const [highlightedInstanceId, setHighlightedInstanceId] = useState<
    number | null
  >(null)
  const sourceLane = useRef<HTMLOListElement>(null)
  const targetLane = useRef<HTMLOListElement>(null)
  const compositionScroll = useRef<HTMLDivElement>(null)
  const canRestoreRemovedRef = useRef(canRestoreRemoved)
  const [collapsed, setCollapsed] = useState(() => initialCollapsed)
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
      onNotify({
        tone: 'warning',
        message: `Se ha retirado «${text}» de la composición.`,
        action: {
          label: 'Deshacer',
          run: () => {
            if (canRestoreRemovedRef.current(component.semordnilap.id)) {
              onRestoreRemoved(component, canonicalIndex)
              return
            }
            onNotify({
              tone: 'warning',
              message: 'El semordnilap ya no está disponible en este conjunto.',
            })
          },
        },
      })
    },
    [components, onNotify, onRemove, onRestoreRemoved],
  )
  const getLane = useCallback(
    (side: 'source' | 'target') =>
      side === 'source' ? sourceLane.current : targetLane.current,
    [],
  )
  const getScrollContainer = useCallback(() => compositionScroll.current, [])
  const pointerInteraction = useCompositionPointerInteraction({
    getLane,
    getScrollContainer,
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
      onNotify({
        tone: result.created ? 'success' : 'warning',
        message: result.created
          ? 'Composite guardado y añadido al catálogo.'
          : 'Esta composición ya estaba guardada.',
      })
    } catch (error) {
      onNotify({
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
        <div className={styles.titleBlock}>
          <h1 id="composition-title">Compón</h1>
          <p className={styles.persistenceStatus} aria-live="polite">
            {persistenceLabel}
          </p>
        </div>
        <CompositionToolbar
          collapsed={collapsed}
          canUndo={canUndo}
          canRedo={canRedo}
          hasComponents={components.length > 0}
          canSave={snapshot.isComposite}
          saving={saving}
          onToggleCollapsed={toggleCollapsed}
          onUndo={onUndo}
          onRedo={onRedo}
          onSave={() => void handleSave()}
          onClear={onClear}
        />
      </div>

      <div id="composition-content" className={styles.compositionContent}>
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
              <CompositionPhrasesViewport
                sourceLanguageLabel={sourceLabel}
                targetLanguageLabel={targetLabel}
                viewportRef={compositionScroll}
                sourcePhrase={
                  <CompositionLane
                    side="source"
                    languageLabel={sourceLabel}
                    components={components}
                    insertionIndex={insertionIndex}
                    dragging={pointerInteraction.dragging}
                    highlightedInstanceId={highlightedInstanceId}
                    laneRef={sourceLane}
                    onSelectInsertion={onSelectInsertion}
                    onRemove={removeWithNotification}
                    onMove={onMove}
                    onHighlight={setHighlightedInstanceId}
                    bindPointer={pointerInteraction.bind}
                  />
                }
                targetPhrase={
                  <CompositionLane
                    side="target"
                    languageLabel={targetLabel}
                    components={components}
                    insertionIndex={insertionIndex}
                    dragging={pointerInteraction.dragging}
                    highlightedInstanceId={highlightedInstanceId}
                    laneRef={targetLane}
                    onSelectInsertion={onSelectInsertion}
                    onRemove={removeWithNotification}
                    onMove={onMove}
                    onHighlight={setHighlightedInstanceId}
                    bindPointer={pointerInteraction.bind}
                  />
                }
              />
            </div>
          ))}
      </div>

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
    </section>
  )
}
