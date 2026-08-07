import styles from './CatalogDiscoveryFab.module.css'

type CatalogDiscoveryFabProps = {
  active: boolean
  onClick: () => void
}

export function CatalogDiscoveryFab({
  active,
  onClick,
}: CatalogDiscoveryFabProps) {
  const label = active ? 'Mostrar otro grupo' : 'Descubrir semordnilaps'

  return (
    <button
      className={styles.fab}
      type="button"
      data-active={active}
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="13" width="8" height="8" rx="1.5" />
        <circle cx="7" cy="7" r="0.8" />
        <circle cx="15.8" cy="15.8" r="0.8" />
        <circle cx="18.2" cy="18.2" r="0.8" />
      </svg>
    </button>
  )
}
