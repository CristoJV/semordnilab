import type { DatasetId, SemordnilapId } from '@/domain/semordnilap'

export const TAG_COLORS = [
  'violet',
  'mustard',
  'terracotta',
  'green',
  'blue',
  'rose',
] as const

export type TagColor = (typeof TAG_COLORS)[number]
export type TagId = string

export type SemordnilapTag = {
  id: TagId
  name: string
  normalizedName: string
  color: TagColor
  createdAt: string
  updatedAt: string
}

export type SemordnilapTagAssignment = {
  datasetId: DatasetId
  semordnilapId: SemordnilapId
  tagId: TagId
  createdAt: string
}

export type SemordnilapTagCollection = {
  tags: readonly SemordnilapTag[]
  assignments: readonly SemordnilapTagAssignment[]
}
