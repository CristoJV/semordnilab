import type { SemordnilapTag, TagId } from '@/application'
import type { SemordnilapId } from '@/domain/semordnilap'

export function tagsForSemordnilap(
  semordnilapId: SemordnilapId,
  tags: readonly SemordnilapTag[],
  assignments: ReadonlyMap<SemordnilapId, ReadonlySet<TagId>>,
) {
  const assigned = assignments.get(semordnilapId)
  return assigned ? tags.filter(({ id }) => assigned.has(id)) : []
}
