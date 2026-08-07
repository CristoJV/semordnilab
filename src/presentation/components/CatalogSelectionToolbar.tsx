import type { SemordnilapTag, SemordnilapTagChange, TagId } from '@/application'
import type { SemordnilapId } from '@/domain/semordnilap'

import styles from './PairedSemordnilapCatalog.module.css'
import { TagAssignmentMenu } from './TagControls'
import { TriStateCheckbox } from './TriStateCheckbox'

type CatalogSelectionToolbarProps = {
  state: 'empty' | 'mixed' | 'checked'
  resultCount: number
  selectedIds: readonly SemordnilapId[]
  discardedView: boolean
  tags: readonly SemordnilapTag[]
  assignments: ReadonlyMap<SemordnilapId, ReadonlySet<TagId>>
  onToggleAll: () => void
  onFavorite: () => void
  onDiscardOrRestore: () => void
  onApplyTags: (changes: readonly SemordnilapTagChange[]) => Promise<void>
  onManageTags: () => void
  onClose: () => void
}

export function CatalogSelectionToolbar({
  state,
  resultCount,
  selectedIds,
  discardedView,
  tags,
  assignments,
  onToggleAll,
  onFavorite,
  onDiscardOrRestore,
  onApplyTags,
  onManageTags,
  onClose,
}: CatalogSelectionToolbarProps) {
  return (
    <div className={styles.selectionControls}>
      <TriStateCheckbox
        state={state}
        total={resultCount}
        onChange={onToggleAll}
      />
      <strong>
        {selectedIds.length}{' '}
        {selectedIds.length === 1 ? 'seleccionado' : 'seleccionados'}
      </strong>
      <div
        className={styles.selectionActions}
        aria-label="Acciones para la selección"
      >
        <button
          className={styles.selectionAction}
          type="button"
          aria-label="Añadir a favoritos"
          title="Añadir a favoritos"
          disabled={selectedIds.length === 0}
          onClick={onFavorite}
        >
          <span className={styles.selectionActionIcon} aria-hidden="true">
            ★
          </span>
          <span className={styles.selectionActionLabel}>
            Añadir a favoritos
          </span>
        </button>
        <button
          className={styles.selectionAction}
          data-kind={discardedView ? 'restore' : 'discard'}
          type="button"
          aria-label={discardedView ? 'Restaurar' : 'Descartar'}
          title={discardedView ? 'Restaurar' : 'Descartar'}
          disabled={selectedIds.length === 0}
          onClick={onDiscardOrRestore}
        >
          <span className={styles.selectionActionIcon} aria-hidden="true">
            {discardedView ? (
              '↩'
            ) : (
              <svg viewBox="0 0 24 24">
                <path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" />
              </svg>
            )}
          </span>
          <span className={styles.selectionActionLabel}>
            {discardedView ? 'Restaurar' : 'Descartar'}
          </span>
        </button>
        <TagAssignmentMenu
          tags={tags}
          selectedIds={selectedIds}
          assignments={assignments}
          onApply={onApplyTags}
          onManage={onManageTags}
        />
      </div>
      <button
        className={styles.closeSelection}
        type="button"
        aria-label="Cerrar selección"
        title="Cerrar selección"
        onClick={onClose}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  )
}
