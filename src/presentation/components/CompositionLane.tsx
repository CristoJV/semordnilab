import { Fragment, type RefObject } from 'react'

import type { DraftSemordnilapComponent } from '@/presentation/hooks/useCompositionWorkspace'
import type { CompositionPointerBindings } from '@/presentation/hooks/useCompositionPointerInteraction'
import type {
  CompositionPointerTarget,
  CompositionSide,
  DraggingState,
} from '@/presentation/interactions/composition-pointer-machine'

import { CompositionInsertionPoint } from './CompositionInsertionPoint'
import { SemordnilapComponent } from './SemordnilapComponent'
import styles from './CompositionLane.module.css'

type CompositionLaneProps = {
  side: CompositionSide
  languageLabel: string
  components: readonly DraftSemordnilapComponent[]
  insertionIndex: number
  dragging: DraggingState | null
  highlightedInstanceId: number | null
  laneRef: RefObject<HTMLOListElement | null>
  onSelectInsertion: (index: number) => void
  onRemove: (instanceId: number, canonicalIndex: number, text: string) => void
  onMove: (instanceId: number, offset: -1 | 1) => void
  onHighlight: (instanceId: number | null) => void
  bindPointer: (target: CompositionPointerTarget) => CompositionPointerBindings
}

export function CompositionLane({
  side,
  languageLabel,
  components,
  insertionIndex,
  dragging,
  highlightedInstanceId,
  laneRef,
  onSelectInsertion,
  onRemove,
  onMove,
  onHighlight,
  bindPointer,
}: CompositionLaneProps) {
  const sourceSide = side === 'source'
  const visibleComponents = sourceSide ? components : components.toReversed()
  const trailingIndex = sourceSide ? components.length : 0

  return (
    <div className={styles.lane} data-tone={side}>
      <span className={styles.language}>{languageLabel}</span>
      <ol
        ref={laneRef}
        className={styles.components}
        data-composition-lane={side}
        aria-label={`Composición en ${languageLabel}`}
      >
        {visibleComponents.map(({ instanceId, semordnilap }, visualIndex) => {
          const canonicalIndex = sourceSide
            ? visualIndex
            : components.length - 1 - visualIndex
          const gapIndex = sourceSide
            ? visualIndex
            : components.length - visualIndex
          const text = sourceSide
            ? semordnilap.source.text
            : semordnilap.target.text
          const moveLeft = sourceSide ? -1 : 1
          const moveRight = sourceSide ? 1 : -1
          return (
            <Fragment key={instanceId}>
              <CompositionInsertionPoint
                index={gapIndex}
                active={insertionIndex === gapIndex}
                languageLabel={languageLabel}
                onSelect={onSelectInsertion}
                dragging={Boolean(dragging)}
                dropTarget={dragging?.dropIndex === gapIndex}
              />
              <SemordnilapComponent
                text={text}
                tone={side}
                dragging={dragging?.target.instanceId === instanceId}
                highlighted={highlightedInstanceId === instanceId}
                pointerBindings={bindPointer({
                  instanceId,
                  canonicalIndex,
                  text,
                  side,
                })}
                onRemove={() => onRemove(instanceId, canonicalIndex, text)}
                onHighlightChange={(highlighted) =>
                  onHighlight(highlighted ? instanceId : null)
                }
                canMoveLeft={visualIndex > 0}
                canMoveRight={visualIndex < components.length - 1}
                onMoveLeft={() => onMove(instanceId, moveLeft)}
                onMoveRight={() => onMove(instanceId, moveRight)}
              />
            </Fragment>
          )
        })}
        <CompositionInsertionPoint
          index={trailingIndex}
          active={insertionIndex === trailingIndex}
          languageLabel={languageLabel}
          onSelect={onSelectInsertion}
          dragging={Boolean(dragging)}
          dropTarget={dragging?.dropIndex === trailingIndex}
        />
      </ol>
    </div>
  )
}
