import type { DatasetId, SemordnilapId } from '@/domain/semordnilap'

export const TAG_COLORS = [
  'violet',
  'mustard',
  'terracotta',
  'green',
  'blue',
  'rose',
] as const

export const TAG_ICONS = [
  'tag',
  'star',
  'heart',
  'bookmark',
  'flag',
  'sparkles',
  'lightbulb',
  'book',
  'person',
  'place',
  'language',
  'puzzle',
] as const

export type TagColor = (typeof TAG_COLORS)[number]
export type TagIcon = (typeof TAG_ICONS)[number]
export type TagId = string

export type SemordnilapTag = {
  id: TagId
  name: string
  normalizedName: string
  color: TagColor
  icon: TagIcon
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

export type SemordnilapTagChange = {
  tagId: TagId
  assigned: boolean
}
