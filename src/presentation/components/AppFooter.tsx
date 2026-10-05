import styles from './AppFooter.module.css'

export function AppFooter() {
  return (
    <footer className={styles.footer}>
      <span>Semordnilab</span>
      <svg viewBox="0 0 24 24" aria-label="con cariño por">
        <path d="M12 20.5 4.2 13A5.2 5.2 0 0 1 12 6.1 5.2 5.2 0 0 1 19.8 13L12 20.5Z" />
      </svg>
      <strong>CristoJV</strong>
    </footer>
  )
}
