import type { AvailableDataset } from '@/application'
import type { CompositionSnapshot } from '@/domain/semordnilap'
import type { DraftSemordnilapComponent } from '@/presentation/hooks/useCompositionWorkspace'

import { SemordnilapComponent } from './SemordnilapComponent'
import styles from './CompositionWorkspace.module.css'

type CompositionWorkspaceProps = {
  dataset: AvailableDataset | null
  components: readonly DraftSemordnilapComponent[]
  snapshot: CompositionSnapshot
  onRemove: (instanceId: number) => void
  onClear: () => void
}

export function CompositionWorkspace({
  dataset,
  components,
  snapshot,
  onRemove,
  onClear,
}: CompositionWorkspaceProps) {
  const sourceLabel = dataset?.sourceLanguage.label ?? 'Origen'
  const targetLabel = dataset?.targetLanguage.label ?? 'Destino'
  const statusMessage =
    components.length === 0
      ? 'Selecciona semordnilaps de las listas para empezar a componer.'
      : snapshot.isComposite
        ? 'La composición forma un semordnilap válido.'
        : 'Añade al menos otro semordnilap para formar una composición.'

  return (
    <section className={styles.workspace} aria-labelledby="composition-title">
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Borrador en memoria</p>
          <h1 id="composition-title">Área de composición</h1>
        </div>
        {components.length > 0 && (
          <button className={styles.clear} type="button" onClick={onClear}>
            Vaciar
          </button>
        )}
      </div>

      {components.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyMark} aria-hidden="true">
            ↔
          </span>
          <p>{statusMessage}</p>
        </div>
      ) : (
        <div className={styles.lanes}>
          <div className={styles.lane} data-tone="source">
            <span className={styles.language}>{sourceLabel}</span>
            <ol
              className={styles.components}
              aria-label={`Composición en ${sourceLabel}`}
            >
              {components.map(({ instanceId, semordnilap }) => (
                <SemordnilapComponent
                  key={instanceId}
                  instanceId={instanceId}
                  text={semordnilap.source.text}
                  tone="source"
                  onRemove={onRemove}
                />
              ))}
            </ol>
          </div>

          <div className={styles.lane} data-tone="target">
            <span className={styles.language}>{targetLabel}</span>
            <ol
              className={styles.components}
              aria-label={`Composición en ${targetLabel}`}
            >
              {components.toReversed().map(({ instanceId, semordnilap }) => (
                <SemordnilapComponent
                  key={instanceId}
                  instanceId={instanceId}
                  text={semordnilap.target.text}
                  tone="target"
                  onRemove={onRemove}
                />
              ))}
            </ol>
          </div>
        </div>
      )}

      {components.length > 0 && (
        <div className={styles.validation}>
          <output aria-live="polite">{statusMessage}</output>
          <code title="Formas normalizadas">
            {snapshot.sourceNormalized} ⇄ {snapshot.targetNormalized}
          </code>
        </div>
      )}
    </section>
  )
}
