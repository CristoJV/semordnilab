import { useMemo, useState } from 'react'

import type { CompositeDeletionPlan } from '@/application'
import type { CompositeSemordnilap, Semordnilap } from '@/domain/semordnilap'

import { ModalDialog } from './ModalDialog'
import styles from './CompositeManagerDialog.module.css'

type CompositeManagerDialogProps = {
  composite: CompositeSemordnilap
  library: readonly Semordnilap[]
  hasCurrentDraft: boolean
  usedInCurrentDraft: boolean
  onClose: () => void
  onInsert: () => void
  onOpenAsDraft: () => void
  onRename: (title: string) => Promise<void>
  onInspectDeletion: () => Promise<CompositeDeletionPlan>
  onDelete: (plan: CompositeDeletionPlan) => Promise<void>
  onExportBackup: () => Promise<void>
}

export function CompositeManagerDialog({
  composite,
  library,
  hasCurrentDraft,
  usedInCurrentDraft,
  onClose,
  onInsert,
  onOpenAsDraft,
  onRename,
  onInspectDeletion,
  onDelete,
  onExportBackup,
}: CompositeManagerDialogProps) {
  const [title, setTitle] = useState(composite.title ?? '')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [confirmingDraft, setConfirmingDraft] = useState(false)
  const [deletionPlan, setDeletionPlan] =
    useState<CompositeDeletionPlan | null>(null)
  const libraryById = useMemo(
    () => new Map(library.map((semordnilap) => [semordnilap.id, semordnilap])),
    [library],
  )

  const run = async (operation: () => Promise<void>, success: string) => {
    setBusy(true)
    setMessage(null)
    try {
      await operation()
      setMessage(success)
      return true
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'No se ha podido completar la operación.',
      )
      return false
    } finally {
      setBusy(false)
    }
  }

  const inspectDeletion = async () => {
    setBusy(true)
    setMessage(null)
    try {
      setDeletionPlan(await onInspectDeletion())
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'No se han podido revisar las dependencias.',
      )
    } finally {
      setBusy(false)
    }
  }

  const directIds = new Set(deletionPlan?.directDependentIds ?? [])
  const dependentComposites = (deletionPlan?.dependentIds ?? [])
    .map((id) => libraryById.get(id))
    .filter((item): item is CompositeSemordnilap => item?.kind === 'composite')

  return (
    <ModalDialog title="Composite guardado" onClose={onClose} wide>
      <div className={styles.summary}>
        <div data-side="source">
          <span>Origen</span>
          <strong>{composite.source.text}</strong>
        </div>
        <div data-side="target">
          <span>Destino</span>
          <strong>{composite.target.text}</strong>
        </div>
      </div>

      <dl className={styles.metadata}>
        <div>
          <dt>Componentes directos</dt>
          <dd>{composite.components.length}</dd>
        </div>
        <div>
          <dt>Unidades atómicas</dt>
          <dd>{composite.atomicComponents.length}</dd>
        </div>
      </dl>

      <ol className={styles.components} aria-label="Componentes del composite">
        {composite.components.map((reference, index) => {
          const component = libraryById.get(reference.semordnilapId)
          return (
            <li key={`${reference.kind}:${reference.semordnilapId}:${index}`}>
              <span>{component?.source.text ?? reference.semordnilapId}</span>
              <span>
                {component?.target.text ?? 'Referencia no disponible'}
              </span>
            </li>
          )
        })}
      </ol>

      <div className={styles.actions}>
        <button type="button" onClick={onInsert}>
          Insertar en la composición
        </button>
        {!confirmingDraft ? (
          <button
            type="button"
            onClick={() =>
              hasCurrentDraft ? setConfirmingDraft(true) : onOpenAsDraft()
            }
          >
            Abrir como borrador
          </button>
        ) : (
          <div className={styles.confirmation} role="alert">
            <span>Se sustituirá la composición actual.</span>
            <button type="button" onClick={onOpenAsDraft}>
              Sustituir
            </button>
            <button type="button" onClick={() => setConfirmingDraft(false)}>
              Cancelar
            </button>
          </div>
        )}
      </div>

      <div className={styles.rename}>
        <label htmlFor="composite-title">Nombre del composite</label>
        <div>
          <input
            id="composite-title"
            value={title}
            maxLength={120}
            onChange={(event) => setTitle(event.target.value)}
          />
          <button
            type="button"
            disabled={busy || title.trim() === (composite.title ?? '')}
            onClick={() =>
              void run(() => onRename(title), 'Nombre actualizado.')
            }
          >
            Renombrar
          </button>
        </div>
      </div>

      <div className={styles.danger}>
        {!deletionPlan ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void inspectDeletion()}
          >
            Eliminar composite
          </button>
        ) : (
          <div className={styles.deletionPlan} role="alert">
            <strong>
              {deletionPlan.dependentIds.length === 0
                ? 'El composite no tiene derivados.'
                : `Este composite se utiliza en ${deletionPlan.dependentIds.length} ${deletionPlan.dependentIds.length === 1 ? 'composite derivado' : 'composites derivados'}.`}
            </strong>
            {dependentComposites.length > 0 && (
              <ul className={styles.dependencies}>
                {dependentComposites.map((dependent) => (
                  <li key={dependent.id}>
                    <span>
                      {directIds.has(dependent.id)
                        ? 'Dependencia directa'
                        : 'Dependencia indirecta'}
                    </span>
                    <strong>{dependent.title ?? dependent.source.text}</strong>
                    <small>
                      {dependent.source.text} ⇄ {dependent.target.text}
                    </small>
                  </li>
                ))}
              </ul>
            )}
            <p>
              Se eliminarán {deletionPlan.dependentIds.length + 1} composites y
              sus favoritos, descartes y etiquetas.
            </p>
            {deletionPlan.dependentDraftDatasetIds.length > 0 && (
              <p className={styles.blocked}>
                Retira los composites afectados del borrador antes de continuar.
              </p>
            )}
            <div className={styles.confirmation}>
              <button
                type="button"
                disabled={
                  busy || deletionPlan.dependentDraftDatasetIds.length > 0
                }
                onClick={() => {
                  void run(
                    () => onDelete(deletionPlan),
                    'Composites eliminados.',
                  ).then((deleted) => {
                    if (deleted) onClose()
                  })
                }}
              >
                Eliminar {deletionPlan.dependentIds.length + 1}
              </button>
              <button type="button" onClick={() => setDeletionPlan(null)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
        {usedInCurrentDraft && !deletionPlan && (
          <p>Retíralo del borrador actual antes de eliminarlo.</p>
        )}
        <button
          className={styles.export}
          type="button"
          disabled={busy}
          onClick={() => void run(onExportBackup, 'Copia exportada.')}
        >
          Exportar copia antes de continuar
        </button>
      </div>
      {message && (
        <p className={styles.message} role="status">
          {message}
        </p>
      )}
    </ModalDialog>
  )
}
