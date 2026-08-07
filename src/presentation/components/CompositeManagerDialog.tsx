import { useMemo, useState } from 'react'

import type { CompositeDeletionPlan, SemordnilapTag } from '@/application'
import type { CompositeSemordnilap, Semordnilap } from '@/domain/semordnilap'

import { CompositeDeletionConfirmationDialog } from './CompositeDeletionConfirmationDialog'
import { ModalDialog } from './ModalDialog'
import { TagIconGlyph } from './TagIconGlyph'
import styles from './CompositeManagerDialog.module.css'

type CompositeManagerDialogProps = {
  composite: CompositeSemordnilap
  library: readonly Semordnilap[]
  sourceLanguageLabel: string
  targetLanguageLabel: string
  tags: readonly SemordnilapTag[]
  favorite: boolean
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
  sourceLanguageLabel,
  targetLanguageLabel,
  tags,
  favorite,
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
  const canConfirmDeletion =
    deletionPlan !== null &&
    deletionPlan.found &&
    deletionPlan.dependentIds.length === 0 &&
    deletionPlan.dependentDraftDatasetIds.length === 0 &&
    !usedInCurrentDraft

  if (deletionPlan && canConfirmDeletion) {
    return (
      <CompositeDeletionConfirmationDialog
        composite={composite}
        sourceLanguageLabel={sourceLanguageLabel}
        targetLanguageLabel={targetLanguageLabel}
        onClose={() => setDeletionPlan(null)}
        onConfirm={async () => {
          await onDelete(deletionPlan)
          onClose()
        }}
      />
    )
  }

  return (
    <ModalDialog title="Composite guardado" onClose={onClose} wide>
      <div className={styles.summary}>
        <div data-side="source">
          <span>{sourceLanguageLabel}</span>
          <strong>{composite.source.text}</strong>
        </div>
        <div data-side="target">
          <span>{targetLanguageLabel}</span>
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
        <div>
          <dt>Favorito</dt>
          <dd className={favorite ? styles.favorite : undefined}>
            {favorite && (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
              </svg>
            )}
            {favorite ? 'Sí' : 'No'}
          </dd>
        </div>
      </dl>

      {tags.length > 0 && (
        <div className={styles.tags} aria-label="Etiquetas del composite">
          <span>Etiquetas</span>
          <ul>
            {tags.map((tag) => (
              <li key={tag.id}>
                <TagIconGlyph icon={tag.icon} color={tag.color} />
                {tag.name}
              </li>
            ))}
          </ul>
        </div>
      )}

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
            <strong>No se puede eliminar todavía.</strong>
            {!deletionPlan.found && (
              <p className={styles.blocked}>
                El composite ya no está guardado. Cierra el diálogo para
                actualizar el catálogo.
              </p>
            )}
            {deletionPlan.dependentIds.length > 0 && (
              <p>
                Este composite se utiliza en {deletionPlan.dependentIds.length}{' '}
                {deletionPlan.dependentIds.length === 1
                  ? 'composite derivado'
                  : 'composites derivados'}
                .
              </p>
            )}
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
            {deletionPlan.dependentIds.length > 0 && (
              <p className={styles.blocked}>
                Elimina primero los composites derivados indicados.
              </p>
            )}
            {(deletionPlan.dependentDraftDatasetIds.length > 0 ||
              usedInCurrentDraft) && (
              <p className={styles.blocked}>
                Retira los composites afectados del borrador antes de continuar.
              </p>
            )}
            <div className={styles.confirmation}>
              <button type="button" onClick={() => setDeletionPlan(null)}>
                Cerrar aviso
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
