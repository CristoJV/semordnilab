import { describe, expect, it } from 'vitest'

import { buildCompositeDeletionPlan } from '@/application/composites/build-composite-deletion-plan'
import type { SavedCompositeSemordnilapRecord } from '@/application'

const timestamp = '2026-08-06T10:00:00.000Z'

function composite(
  id: string,
  componentIds: readonly string[],
): SavedCompositeSemordnilapRecord {
  return {
    id,
    datasetId: 'es-gl',
    components: componentIds.map((semordnilapId) => ({
      kind: 'composite',
      datasetId: 'es-gl',
      semordnilapId,
    })),
    atomicComponentIds: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

describe('plan de eliminación de composites', () => {
  it('encuentra dependencias directas, transitivas y borradores afectados', () => {
    const plan = buildCompositeDeletionPlan(
      [
        composite('A', []),
        composite('B', ['A']),
        composite('C', ['A']),
        composite('D', ['B']),
        composite('E', []),
      ],
      [
        {
          datasetId: 'es-gl',
          components: [
            {
              kind: 'composite',
              datasetId: 'es-gl',
              semordnilapId: 'D',
            },
          ],
          insertionIndex: 1,
          updatedAt: timestamp,
        },
      ],
      'A',
    )

    expect(plan).toEqual({
      found: true,
      rootId: 'A',
      directDependentIds: ['B', 'C'],
      dependentIds: ['B', 'C', 'D'],
      dependentDraftDatasetIds: ['es-gl'],
    })
  })
})
