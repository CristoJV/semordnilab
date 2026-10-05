import styles from './CompositionToolbar.module.css'

type CompositionToolbarProps = {
  collapsed: boolean
  canUndo: boolean
  canRedo: boolean
  hasComponents: boolean
  canSave: boolean
  saving: boolean
  onToggleCollapsed: () => void
  onUndo: () => void
  onRedo: () => void
  onSave: () => void
  onClear: () => void
}

function ExpandIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={collapsed ? 'm6 9 6 6 6-6' : 'm6 15 6-6 6 6'} />
    </svg>
  )
}

export function CompositionToolbar({
  collapsed,
  canUndo,
  canRedo,
  hasComponents,
  canSave,
  saving,
  onToggleCollapsed,
  onUndo,
  onRedo,
  onSave,
  onClear,
}: CompositionToolbarProps) {
  return (
    <div className={styles.toolbar} aria-label="Acciones de composición">
      <button
        className={styles.collapseToggle}
        type="button"
        aria-expanded={!collapsed}
        aria-controls="composition-content"
        aria-label={collapsed ? 'Expandir composición' : 'Plegar composición'}
        onClick={onToggleCollapsed}
      >
        <ExpandIcon collapsed={collapsed} />
        <span>{collapsed ? 'Expandir' : 'Plegar'}</span>
      </button>
      <button
        type="button"
        disabled={!canUndo}
        aria-label="Deshacer"
        onClick={onUndo}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 7 4 12l5 5M5 12h8a6 6 0 0 1 6 6" />
        </svg>
        <span>Deshacer</span>
      </button>
      <button
        type="button"
        disabled={!canRedo}
        aria-label="Rehacer"
        onClick={onRedo}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m15 7 5 5-5 5m4-5h-8a6 6 0 0 0-6 6" />
        </svg>
        <span>Rehacer</span>
      </button>
      <button
        className={styles.save}
        type="button"
        disabled={!canSave || saving}
        aria-label={saving ? 'Guardando composite' : 'Guardar composite'}
        title={
          canSave
            ? 'Guardar composite'
            : hasComponents
              ? 'Esta composición no se puede guardar o ya está guardada'
              : 'Añade al menos dos componentes para guardar'
        }
        onClick={onSave}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 4h12l2 2v14H5V4Zm3 0v6h8V4M8 20v-6h8v6" />
        </svg>
        <span>{saving ? 'Guardando...' : 'Guardar'}</span>
      </button>
      <button
        className={styles.clear}
        type="button"
        disabled={!hasComponents}
        aria-label="Vaciar"
        onClick={onClear}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" />
        </svg>
        <span>Vaciar</span>
      </button>
    </div>
  )
}
