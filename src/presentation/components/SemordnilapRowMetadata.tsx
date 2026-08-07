import type { SemordnilapTag } from '@/application'

import { TagDots } from './TagControls'
import styles from './SemordnilapRowMetadata.module.css'

type SemordnilapRowMetadataProps =
  | {
      kind: 'tags'
      tags: readonly SemordnilapTag[]
    }
  | {
      kind: 'usage'
      count: number
      favorite: boolean
    }

export function SemordnilapRowMetadata(props: SemordnilapRowMetadataProps) {
  if (props.kind === 'tags') return <TagDots tags={props.tags} />

  return (
    <span className={styles.statuses}>
      <span
        className={styles.count}
        data-visible={props.count > 0}
        aria-label={props.count > 0 ? `${props.count} añadidos` : undefined}
        aria-hidden={props.count === 0}
      >
        {props.count > 0 ? props.count : ''}
      </span>
      <span
        className={styles.favorite}
        data-visible={props.favorite}
        aria-label={props.favorite ? 'Favorito' : undefined}
        aria-hidden={!props.favorite}
        title={props.favorite ? 'Favorito' : undefined}
      >
        ★
      </span>
    </span>
  )
}
