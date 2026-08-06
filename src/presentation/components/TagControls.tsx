import type { SemordnilapTag, TagId } from '@/application'
import type { SemordnilapId } from '@/domain/semordnilap'

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
        <i key={tag.id} data-color={tag.color} />
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
  onToggle: (tagId: TagId) => void
  onClear: () => void
  onManage: () => void
}

export function TagFilterMenu({
  tags,
  selectedTagIds,
  onToggle,
  onClear,
  onManage,
}: TagFilterMenuProps) {
  return (
    <details className={styles.menu}>
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
                checked={selectedTagIds.has(tag.id)}
                onChange={() => onToggle(tag.id)}
              />
              <i data-color={tag.color} />
              <span>{tag.name}</span>
            </label>
          ))
        )}
        <div className={styles.panelActions}>
          <button
            type="button"
            disabled={selectedTagIds.size === 0}
            onClick={onClear}
          >
            Limpiar
          </button>
          <button type="button" onClick={onManage}>
            Gestionar
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
  onAdd: (tagId: TagId) => void
  onRemove: (tagId: TagId) => void
  onManage: () => void
}

export function TagAssignmentMenu({
  tags,
  selectedIds,
  assignments,
  onAdd,
  onRemove,
  onManage,
}: TagAssignmentMenuProps) {
  return (
    <details className={styles.menu}>
      <summary>Etiquetar</summary>
      <div className={styles.panel}>
        {tags.length === 0 ? (
          <p>Crea una etiqueta para clasificar la selección.</p>
        ) : (
          tags.map((tag) => {
            const assignedCount = selectedIds.filter((id) =>
              assignments.get(id)?.has(tag.id),
            ).length
            const allAssigned = assignedCount === selectedIds.length
            return (
              <label key={tag.id}>
                <input
                  type="checkbox"
                  checked={allAssigned}
                  aria-describedby={`tag-count-${tag.id}`}
                  onChange={() =>
                    allAssigned ? onRemove(tag.id) : onAdd(tag.id)
                  }
                />
                <i data-color={tag.color} />
                <span>{tag.name}</span>
                <small id={`tag-count-${tag.id}`}>
                  {assignedCount}/{selectedIds.length}
                </small>
              </label>
            )
          })
        )}
        <button type="button" onClick={onManage}>
          Gestionar etiquetas
        </button>
      </div>
    </details>
  )
}
