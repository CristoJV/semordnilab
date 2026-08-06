import type { DatasetId, SemordnilapReference } from '@/domain/semordnilap'

export type CompositionDraftRecord = {
  datasetId: DatasetId
  components: readonly SemordnilapReference[]
  insertionIndex: number
  updatedAt: string
}
