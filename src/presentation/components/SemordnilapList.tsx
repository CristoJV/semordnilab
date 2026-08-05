import type { SemordnilapCatalogItem } from '@/application'
import type { AtomicSemordnilap } from '@/domain/semordnilap'

import { SemordnilapListItem } from './SemordnilapListItem'
import styles from './SemordnilapList.module.css'

type SemordnilapListProps = {
  items: readonly SemordnilapCatalogItem[]
  side: 'source' | 'target'
  selectedCounts: ReadonlyMap<string, number>
  onAdd: (semordnilap: AtomicSemordnilap) => void
}

export function SemordnilapList({
  items,
  side,
  selectedCounts,
  onAdd,
}: SemordnilapListProps) {
  if (items.length === 0) {
    return <p className={styles.empty}>No hay coincidencias.</p>
  }

  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <SemordnilapListItem
          key={item.semordnilap.id}
          item={item}
          side={side}
          selectedCount={selectedCounts.get(item.semordnilap.id) ?? 0}
          onAdd={({ semordnilap }) => onAdd(semordnilap)}
        />
      ))}
    </ul>
  )
}
