import { useCallback, useRef, useState } from 'react'

import type { SemordnilapTag, SemordnilapTagChange, TagId } from '@/application'
import type { SemordnilapId } from '@/domain/semordnilap'

import { ModalDialog } from './ModalDialog'
import { TagIconGlyph } from './TagIconGlyph'
import styles from './TagControls.module.css'

export function TagDots({ tags }: { tags: readonly SemordnilapTag[] }) {
  const visible = tags.slice(0, 3)
  return (
    <span
      className={styles.dots}
      title={tags.map(({ name }) => name).join(', ')}
      aria-hidden="true"
    >
      {visible.map((tag) => (
        <TagIconGlyph
          key={tag.id}
          className={styles.tagMark}
          icon={tag.icon}
          color={tag.color}
        />
      ))}
      {tags.length > visible.length && (
        <small>+{tags.length - visible.length}</small>
      )}
    </span>
  )
}

type TagFilterMenuProps = {
  tags: readonly SemordnilapTag[]
  selectedTagIds: ReadonlySet<TagId>
  onApply: (tagIds: ReadonlySet<TagId>) => void
  onManage: () => void
}

export function TagFilterMenu({
  tags,
  selectedTagIds,
  onApply,
  onManage,
}: TagFilterMenuProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const [draftTagIds, setDraftTagIds] = useState<ReadonlySet<TagId>>(new Set())

  const close = () => {
    if (detailsRef.current) detailsRef.current.open = false
  }

  const toggleDraft = (tagId: TagId) => {
    setDraftTagIds((current) => {
      const next = new Set(current)
      if (next.has(tagId)) next.delete(tagId)
      else next.add(tagId)
      return next
    })
  }

  return (
    <details
      ref={detailsRef}
      className={styles.menu}
      onToggle={(event) => {
        if (event.currentTarget.open) setDraftTagIds(new Set(selectedTagIds))
      }}
    >
      <summary>
        Etiquetas
        {selectedTagIds.size > 0 && <span>{selectedTagIds.size}</span>}
      </summary>
      <div className={styles.panel}>
        <strong>Filtrar por cualquiera</strong>
        {tags.length === 0 ? (
          <p>Todavía no hay etiquetas.</p>
        ) : (
          tags.map((tag) => (
            <label key={tag.id}>
              <input
                type="checkbox"
                checked={draftTagIds.has(tag.id)}
                onChange={() => toggleDraft(tag.id)}
              />
              <TagIconGlyph
                className={styles.tagMark}
                icon={tag.icon}
                color={tag.color}
              />
              <span>{tag.name}</span>
            </label>
          ))
        )}
        <div className={styles.panelActions}>
          <button
            type="button"
            disabled={draftTagIds.size === 0}
            onClick={() => setDraftTagIds(new Set())}
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={() => {
              close()
              onManage()
            }}
          >
            Gestionar
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(draftTagIds)
              close()
            }}
          >
            Aplicar
          </button>
        </div>
      </div>
    </details>
  )
}

type TagAssignmentMenuProps = {
  tags: readonly SemordnilapTag[]
  selectedIds: readonly SemordnilapId[]
  assignments: ReadonlyMap<SemordnilapId, ReadonlySet<TagId>>
  onApply: (changes: readonly SemordnilapTagChange[]) => Promise<void>
  onManage: () => void
}

export function TagAssignmentMenu({
  tags,
  selectedIds,
  assignments,
  onApply,
  onManage,
}: TagAssignmentMenuProps) {
  const [open, setOpen] = useState(false)
  const [changes, setChanges] = useState<ReadonlyMap<TagId, boolean>>(new Map())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const close = useCallback(() => setOpen(false), [])

  const apply = async () => {
    setBusy(true)
    setError(null)
    try {
      await onApply(
        [...changes].map(([tagId, assigned]) => ({ tagId, assigned })),
      )
      close()
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'No se han podido aplicar las etiquetas.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        className={styles.trigger}
        type="button"
        disabled={selectedIds.length === 0}
        onClick={() => {
          setChanges(new Map())
          setError(null)
          setOpen(true)
        }}
      >
        Etiquetar
      </button>
      {open && (
        <ModalDialog title="Etiquetar selección" onClose={close}>
          <div className={styles.assignmentDialog}>
            <p className={styles.assignmentIntro}>
              Aplica etiquetas a los {selectedIds.length} semordnilaps
              seleccionados.
            </p>
            {tags.length === 0 ? (
              <p>Crea una etiqueta para clasificar la selección.</p>
            ) : (
              tags.map((tag) => {
                const assignedCount = selectedIds.filter((id) =>
                  assignments.get(id)?.has(tag.id),
                ).length
                const allAssigned = assignedCount === selectedIds.length
                const displayedAssigned = changes.get(tag.id) ?? allAssigned
                const displayedCount = changes.has(tag.id)
                  ? displayedAssigned
                    ? selectedIds.length
                    : 0
                  : assignedCount
                return (
                  <label key={tag.id}>
                    <input
                      type="checkbox"
                      checked={displayedAssigned}
                      aria-describedby={`tag-count-${tag.id}`}
                      onChange={() =>
                        setChanges((current) => {
                          const next = new Map(current)
                          next.set(tag.id, !displayedAssigned)
                          return next
                        })
                      }
                    />
                    <TagIconGlyph
                      className={styles.tagMark}
                      icon={tag.icon}
                      color={tag.color}
                    />
                    <span>{tag.name}</span>
                    <small id={`tag-count-${tag.id}`}>
                      {displayedCount}/{selectedIds.length}
                    </small>
                  </label>
                )
              })
            )}
            {error && <p role="alert">{error}</p>}
            <div className={styles.panelActions}>
              <button
                type="button"
                onClick={() => {
                  close()
                  onManage()
                }}
              >
                Gestionar etiquetas
              </button>
              <button
                type="button"
                disabled={busy || selectedIds.length === 0}
                onClick={() => void apply()}
              >
                Aplicar
              </button>
            </div>
          </div>
        </ModalDialog>
      )}
    </>
  )
}
