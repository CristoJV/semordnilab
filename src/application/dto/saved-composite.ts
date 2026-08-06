import type {
  DatasetId,
  SemordnilapId,
  SemordnilapReference,
} from '@/domain/semordnilap'

export type SavedCompositeSemordnilapRecord = {
  id: SemordnilapId
  datasetId: DatasetId
  components: readonly SemordnilapReference[]
  atomicComponentIds: readonly SemordnilapId[]
  title?: string
  createdAt: string
  updatedAt: string
}
