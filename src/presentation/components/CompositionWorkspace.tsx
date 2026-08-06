import { Fragment, useState } from 'react'

import type {
  AvailableDataset,
  SaveCompositeSemordnilapResult,
} from '@/application'
import type { CompositionSnapshot } from '@/domain/semordnilap'
import type { DraftSemordnilapComponent } from '@/presentation/hooks/useCompositionWorkspace'

import { CompositionInsertionPoint } from './CompositionInsertionPoint'
import { SemordnilapComponent } from './SemordnilapComponent'
import styles from './CompositionWorkspace.module.css'

type CompositionWorkspaceProps = {
  dataset: AvailableDataset | null
  components: readonly DraftSemordnilapComponent[]
  snapshot: CompositionSnapshot
  onRemove: (instanceId: number) => void
  onMove: (instanceId: number, offset: -1 | 1) => void
  insertionIndex: number
  onSelectInsertion: (index: number) => void
  onClear: () => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  persistenceError: string | null
  onDiscardIncompatibleDraft: () => Promise<void>
  onSave: (title?: string) => Promise<SaveCompositeSemordnilapResult>
}

export function CompositionWorkspace({
  dataset,
  components,
  snapshot,
  onRemove,
  onMove,
  insertionIndex,
  onSelectInsertion,
  onClear,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  persistenceError,
  onDiscardIncompatibleDraft,
  onSave,
}: CompositionWorkspaceProps) {
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(max-width: 760px)').matches,
  )
  const sourceLabel = dataset?.sourceLanguage.label ?? 'Origen'
  const targetLabel = dataset?.targetLanguage.label ?? 'Destino'
  const statusMessage =
    components.length === 0
      ? 'Selecciona semordnilaps de las listas para empezar a componer.'
      : snapshot.isComposite
        ? 'La composición forma un semordnilap válido.'
        : 'Añade al menos otro semordnilap para formar una composición.'

  const handleSave = async () => {
    setSaving(true)
    setSaveMessage(null)
    try {
      const result = await onSave(title.trim() || undefined)
      setSaveMessage(
        result.created
          ? 'Composite guardado y añadido al catálogo.'
          : 'Esta composición ya estaba guardada.',
      )
      if (result.created) setTitle('')
    } catch (error) {
      setSaveMessage(
        error instanceof Error
          ? error.message
          : 'No se ha podido guardar el composite.',
      )
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
          <p className={styles.eyebrow}>Borrador guardado localmente</p>
          <h1 id="composition-title">Área de composición</h1>
        </div>
        <div className={styles.headingActions}>
          <button type="button" onClick={() => setCollapsed((value) => !value)}>
            {collapsed ? 'Expandir área' : 'Plegar área'}
          </button>
          <button type="button" disabled={!canUndo} onClick={onUndo}>
            Deshacer
          </button>
          <button type="button" disabled={!canRedo} onClick={onRedo}>
            Rehacer
          </button>
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
            <p>{statusMessage}</p>
          </div>
        ) : (
          <div className={styles.lanes}>
            <div className={styles.lane} data-tone="source">
              <span className={styles.language}>{sourceLabel}</span>
              <ol
                className={styles.components}
                aria-label={`Composición en ${sourceLabel}`}
              >
                {components.map(({ instanceId, semordnilap }, index) => (
                  <Fragment key={instanceId}>
                    <CompositionInsertionPoint
                      index={index}
                      active={insertionIndex === index}
                      languageLabel={sourceLabel}
                      onSelect={onSelectInsertion}
                    />
                    <SemordnilapComponent
                      instanceId={instanceId}
                      text={semordnilap.source.text}
                      tone="source"
                      onRemove={onRemove}
                      canMoveLeft={index > 0}
                      canMoveRight={index < components.length - 1}
                      onMoveLeft={() => onMove(instanceId, -1)}
                      onMoveRight={() => onMove(instanceId, 1)}
                    />
                  </Fragment>
                ))}
                <CompositionInsertionPoint
                  index={components.length}
                  active={insertionIndex === components.length}
                  languageLabel={sourceLabel}
                  onSelect={onSelectInsertion}
                />
              </ol>
            </div>

            <div className={styles.lane} data-tone="target">
              <span className={styles.language}>{targetLabel}</span>
              <ol
                className={styles.components}
                aria-label={`Composición en ${targetLabel}`}
              >
                {components
                  .toReversed()
                  .map(({ instanceId, semordnilap }, visualIndex) => (
                    <Fragment key={instanceId}>
                      <CompositionInsertionPoint
                        index={components.length - visualIndex}
                        active={
                          insertionIndex === components.length - visualIndex
                        }
                        languageLabel={targetLabel}
                        onSelect={onSelectInsertion}
                      />
                      <SemordnilapComponent
                        instanceId={instanceId}
                        text={semordnilap.target.text}
                        tone="target"
                        onRemove={onRemove}
                        canMoveLeft={visualIndex > 0}
                        canMoveRight={visualIndex < components.length - 1}
                        onMoveLeft={() => onMove(instanceId, 1)}
                        onMoveRight={() => onMove(instanceId, -1)}
                      />
                    </Fragment>
                  ))}
                <CompositionInsertionPoint
                  index={0}
                  active={insertionIndex === 0}
                  languageLabel={targetLabel}
                  onSelect={onSelectInsertion}
                />
              </ol>
            </div>
          </div>
        ))}

      {!collapsed && components.length > 0 && (
        <>
          <div className={styles.validation}>
            <output aria-live="polite">{statusMessage}</output>
            <code title="Formas normalizadas">
              {snapshot.sourceNormalized} ⇄ {snapshot.targetNormalized}
            </code>
          </div>
          <div className={styles.saveRow}>
            <label>
              <span>Nombre opcional</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Mi composite"
              />
            </label>
            <button
              type="button"
              disabled={!snapshot.isComposite || saving}
              onClick={() => void handleSave()}
            >
              {saving ? 'Guardando...' : 'Guardar composite'}
            </button>
            {saveMessage && <output aria-live="polite">{saveMessage}</output>}
          </div>
        </>
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
