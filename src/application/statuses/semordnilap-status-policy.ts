import type {
  SemordnilapStatusRecord,
  SemordnilapStatusSelection,
} from '@/application/dto/semordnilap-status'
import type { DatasetId, SemordnilapId } from '@/domain/semordnilap'

function semordnilapKey(
  record: Pick<SemordnilapStatusRecord, 'datasetId' | 'semordnilapId'>,
): string {
  return `${record.datasetId}\u001f${record.semordnilapId}`
}

export function normalizeSemordnilapStatusRecords(
  records: readonly SemordnilapStatusRecord[],
): readonly SemordnilapStatusRecord[] {
  const discardedKeys = new Set(
    records.filter(({ status }) => status === 'discarded').map(semordnilapKey),
  )

  return records.filter(
    (record) =>
      record.status === 'discarded' ||
      !discardedKeys.has(semordnilapKey(record)),
  )
}

export function findConflictingSemordnilapStatusIds(
  records: readonly SemordnilapStatusRecord[],
  datasetId: DatasetId,
): readonly SemordnilapId[] {
  const statusesById = new Map<SemordnilapId, Set<string>>()
  for (const record of records) {
    if (record.datasetId !== datasetId) continue
    const statuses = statusesById.get(record.semordnilapId) ?? new Set()
    statuses.add(record.status)
    statusesById.set(record.semordnilapId, statuses)
  }
  return [...statusesById]
    .filter(([, statuses]) => statuses.size > 1)
    .map(([semordnilapId]) => semordnilapId)
}

export function applySemordnilapStatusSelections(
  records: readonly SemordnilapStatusRecord[],
  datasetId: DatasetId,
  selections: readonly SemordnilapStatusSelection[],
): readonly SemordnilapStatusRecord[] {
  const selectionById = new Map(
    selections.map((selection) => [selection.semordnilapId, selection]),
  )
  const retained = records.filter(
    (record) =>
      record.datasetId !== datasetId ||
      !selectionById.has(record.semordnilapId),
  )
  const selected = [...selectionById.values()].flatMap((selection) =>
    selection.status
      ? [
          {
            datasetId,
            semordnilapId: selection.semordnilapId,
            status: selection.status,
          },
        ]
      : [],
  )
  return [...retained, ...selected]
}
