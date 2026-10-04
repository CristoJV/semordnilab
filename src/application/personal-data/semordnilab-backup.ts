import { resolveSavedComposites } from '@/application/composites/resolve-saved-composites'
import type {
  PersonalDataImportOptions,
  PersonalDataImportPreview,
  PersonalDataSnapshot,
  PersonalDataSummary,
  SemordnilabBackup,
} from '@/application/dto/personal-data'
import { normalizeSemordnilapStatusRecords } from '@/application/statuses/semordnilap-status-policy'
import {
  TAG_COLORS,
  TAG_ICONS,
  type TagColor,
  type TagIcon,
} from '@/application/dto/semordnilap-tag'
import type { SemordnilapDatasetSource } from '@/application/ports/semordnilap-dataset-source'
import {
  cleanTagName,
  normalizeTagName,
} from '@/application/tags/tag-validation'
import { normalizeWordFilterKey } from '@/application/word-filters/word-filter-policy'
import type {
  DatasetId,
  SemordnilapId,
  SemordnilapReference,
} from '@/domain/semordnilap'

const BACKUP_FORMAT = 'semordnilab-personal-data'
const BACKUP_VERSION = 4
const LEGACY_BACKUP_VERSIONS = [1, 2, 3] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requiredString(
  record: Record<string, unknown>,
  key: string,
  context: string,
): string {
  const value = record[key]
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${context}: ${key} debe ser un texto no vacío.`)
  }
  return value
}

function plainString(
  record: Record<string, unknown>,
  key: string,
  context: string,
): string {
  const value = record[key]
  if (typeof value !== 'string') {
    throw new Error(`${context}: ${key} debe ser un texto.`)
  }
  return value
}

function timestamp(value: string, context: string): string {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`${context}: la fecha no es válida.`)
  }
  return value
}

function parseReference(value: unknown, context: string): SemordnilapReference {
  if (!isRecord(value)) throw new Error(`${context}: referencia no válida.`)
  const kind = requiredString(value, 'kind', context)
  if (kind !== 'atomic' && kind !== 'composite') {
    throw new Error(`${context}: tipo de referencia desconocido.`)
  }
  return {
    kind,
    datasetId: requiredString(value, 'datasetId', context),
    semordnilapId: requiredString(value, 'semordnilapId', context),
  }
}

function parseSnapshot(
  value: unknown,
  version: 1 | 2 | 3 | 4,
): PersonalDataSnapshot {
  if (!isRecord(value)) throw new Error('La copia no contiene datos válidos.')
  const statusesValue = value.statuses
  const compositesValue = value.savedComposites
  const draftsValue = value.compositionDrafts
  if (
    !Array.isArray(statusesValue) ||
    !Array.isArray(compositesValue) ||
    !Array.isArray(draftsValue)
  ) {
    throw new Error('La copia no contiene todas las colecciones requeridas.')
  }

  if (
    version >= 2 &&
    (!Array.isArray(value.tags) || !Array.isArray(value.semordnilapTags))
  ) {
    throw new Error('La copia no contiene las colecciones de etiquetas.')
  }
  const tagsValue = value.tags ?? []
  const semordnilapTagsValue = value.semordnilapTags ?? []
  if (!Array.isArray(tagsValue) || !Array.isArray(semordnilapTagsValue)) {
    throw new Error('Las colecciones de etiquetas no son válidas.')
  }
  if (version >= 4 && !Array.isArray(value.wordFilters)) {
    throw new Error('La copia no contiene la colección de filtros de palabras.')
  }
  const wordFiltersValue = value.wordFilters ?? []
  if (!Array.isArray(wordFiltersValue)) {
    throw new Error('La colección de filtros de palabras no es válida.')
  }

  const statuses = statusesValue.map((entry, index) => {
    const context = `Estado ${index + 1}`
    if (!isRecord(entry)) throw new Error(`${context}: registro no válido.`)
    const status = requiredString(entry, 'status', context)
    if (status !== 'favorite' && status !== 'discarded') {
      throw new Error(`${context}: estado desconocido.`)
    }
    return {
      datasetId: requiredString(entry, 'datasetId', context),
      semordnilapId: requiredString(entry, 'semordnilapId', context),
      status: status as 'favorite' | 'discarded',
    }
  })

  const savedComposites = compositesValue.map((entry, index) => {
    const context = `Composite ${index + 1}`
    if (!isRecord(entry)) throw new Error(`${context}: registro no válido.`)
    if (
      !Array.isArray(entry.components) ||
      !Array.isArray(entry.atomicComponentIds)
    ) {
      throw new Error(`${context}: componentes no válidos.`)
    }
    const title = entry.title
    if (
      title !== undefined &&
      (typeof title !== 'string' || title.length > 120)
    ) {
      throw new Error(`${context}: título no válido.`)
    }
    const record = {
      id: requiredString(entry, 'id', context),
      datasetId: requiredString(entry, 'datasetId', context),
      components: entry.components.map((reference, referenceIndex) =>
        parseReference(
          reference,
          `${context}, referencia ${referenceIndex + 1}`,
        ),
      ),
      atomicComponentIds: entry.atomicComponentIds.map((id, idIndex) => {
        if (typeof id !== 'string' || id.length === 0) {
          throw new Error(
            `${context}: identificador atómico ${idIndex + 1} no válido.`,
          )
        }
        return id
      }),
      createdAt: timestamp(
        requiredString(entry, 'createdAt', context),
        context,
      ),
      updatedAt: timestamp(
        requiredString(entry, 'updatedAt', context),
        context,
      ),
      ...(title ? { title: title.trim() } : {}),
    }
    return record
  })

  const compositionDrafts = draftsValue.map((entry, index) => {
    const context = `Borrador ${index + 1}`
    if (!isRecord(entry) || !Array.isArray(entry.components)) {
      throw new Error(`${context}: registro no válido.`)
    }
    if (
      !Number.isInteger(entry.insertionIndex) ||
      Number(entry.insertionIndex) < 0
    ) {
      throw new Error(`${context}: posición de inserción no válida.`)
    }
    return {
      datasetId: requiredString(entry, 'datasetId', context),
      components: entry.components.map((reference, referenceIndex) =>
        parseReference(
          reference,
          `${context}, referencia ${referenceIndex + 1}`,
        ),
      ),
      insertionIndex: Number(entry.insertionIndex),
      updatedAt: timestamp(
        requiredString(entry, 'updatedAt', context),
        context,
      ),
    }
  })

  const tags = tagsValue.map((entry, index) => {
    const context = `Etiqueta ${index + 1}`
    if (!isRecord(entry)) throw new Error(`${context}: registro no válido.`)
    const name = cleanTagName(requiredString(entry, 'name', context))
    const normalizedName = normalizeTagName(name)
    if (entry.normalizedName !== normalizedName) {
      throw new Error(`${context}: nombre normalizado no válido.`)
    }
    const color = requiredString(entry, 'color', context)
    if (!TAG_COLORS.includes(color as TagColor)) {
      throw new Error(`${context}: color desconocido.`)
    }
    const icon = version >= 3 ? requiredString(entry, 'icon', context) : 'tag'
    if (!TAG_ICONS.includes(icon as TagIcon)) {
      throw new Error(`${context}: icono desconocido.`)
    }
    return {
      id: requiredString(entry, 'id', context),
      name,
      normalizedName,
      color: color as TagColor,
      icon: icon as TagIcon,
      createdAt: timestamp(
        requiredString(entry, 'createdAt', context),
        context,
      ),
      updatedAt: timestamp(
        requiredString(entry, 'updatedAt', context),
        context,
      ),
    }
  })

  const semordnilapTags = semordnilapTagsValue.map((entry, index) => {
    const context = `Asignación de etiqueta ${index + 1}`
    if (!isRecord(entry)) throw new Error(`${context}: registro no válido.`)
    return {
      datasetId: requiredString(entry, 'datasetId', context),
      semordnilapId: requiredString(entry, 'semordnilapId', context),
      tagId: requiredString(entry, 'tagId', context),
      createdAt: timestamp(
        requiredString(entry, 'createdAt', context),
        context,
      ),
    }
  })

  const wordFilters = wordFiltersValue.map((entry, index) => {
    const context = `Filtro de palabra ${index + 1}`
    if (!isRecord(entry)) throw new Error(`${context}: registro no válido.`)
    const language = requiredString(entry, 'language', context)
    const displayWord = requiredString(entry, 'displayWord', context).trim()
    const normalizedWord = requiredString(entry, 'normalizedWord', context)
    if (normalizeWordFilterKey(displayWord) !== normalizedWord) {
      throw new Error(`${context}: palabra normalizada no válida.`)
    }
    return {
      language,
      displayWord,
      normalizedWord,
      createdAt: timestamp(
        requiredString(entry, 'createdAt', context),
        context,
      ),
    }
  })

  let workspacePreferences
  if (value.workspacePreferences !== undefined) {
    const entry = value.workspacePreferences
    if (!isRecord(entry) || entry.id !== 'workspace') {
      throw new Error('Las preferencias de la copia no son válidas.')
    }
    if (
      typeof entry.rememberCatalogView !== 'boolean' ||
      typeof entry.rememberCompositionCollapsed !== 'boolean' ||
      typeof entry.compositionCollapsed !== 'boolean' ||
      !Array.isArray(entry.catalogViews)
    ) {
      throw new Error('Las preferencias de la copia están incompletas.')
    }
    const catalogViews = entry.catalogViews.map((view, index) => {
      const context = `Vista de catálogo ${index + 1}`
      if (!isRecord(view) || !Array.isArray(view.sort)) {
        throw new Error(`${context}: registro no válido.`)
      }
      const viewMode = requiredString(view, 'viewMode', context)
      if (!['active', 'saved', 'favorites', 'discarded'].includes(viewMode)) {
        throw new Error(`${context}: modo de vista desconocido.`)
      }
      const sort = view.sort.map((criterion, criterionIndex) => {
        if (!isRecord(criterion)) {
          throw new Error(
            `${context}: criterio ${criterionIndex + 1} no válido.`,
          )
        }
        const field = requiredString(criterion, 'field', context)
        const side = requiredString(criterion, 'side', context)
        const direction = requiredString(criterion, 'direction', context)
        if (
          !['alphabetical', 'length'].includes(field) ||
          !['source', 'target'].includes(side) ||
          !['ascending', 'descending'].includes(direction)
        ) {
          throw new Error(`${context}: criterio de ordenación desconocido.`)
        }
        return {
          field: field as 'alphabetical' | 'length',
          side: side as 'source' | 'target',
          direction: direction as 'ascending' | 'descending',
        }
      })
      if (sort.length > 4) {
        throw new Error(`${context}: contiene demasiados criterios.`)
      }
      const sourceQuery = plainString(view, 'sourceQuery', context)
      const targetQuery = plainString(view, 'targetQuery', context)
      if (sourceQuery.length > 500 || targetQuery.length > 500) {
        throw new Error(`${context}: la búsqueda es demasiado larga.`)
      }
      return {
        datasetId: requiredString(view, 'datasetId', context),
        sourceQuery,
        targetQuery,
        viewMode: viewMode as 'active' | 'saved' | 'favorites' | 'discarded',
        sort,
      }
    })
    workspacePreferences = {
      id: 'workspace' as const,
      rememberCatalogView: entry.rememberCatalogView,
      rememberCompositionCollapsed: entry.rememberCompositionCollapsed,
      compositionCollapsed: entry.compositionCollapsed,
      catalogViews,
      updatedAt: timestamp(
        requiredString(entry, 'updatedAt', 'Preferencias'),
        'Preferencias',
      ),
    }
  }

  return {
    statuses,
    savedComposites,
    compositionDrafts,
    tags,
    semordnilapTags,
    wordFilters,
    ...(workspacePreferences ? { workspacePreferences } : {}),
  }
}

function assertUnique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`La copia contiene ${label} duplicados.`)
  }
}

export function parseSemordnilabBackup(input: string): SemordnilabBackup {
  let value: unknown
  try {
    value = JSON.parse(input)
  } catch {
    throw new Error('El archivo no contiene JSON válido.')
  }
  if (!isRecord(value) || value.format !== BACKUP_FORMAT) {
    throw new Error('El archivo no es una copia de SemordniLAB.')
  }
  if (
    value.version !== BACKUP_VERSION &&
    !LEGACY_BACKUP_VERSIONS.includes(value.version as 1 | 2 | 3)
  ) {
    throw new Error('La versión de la copia no es compatible.')
  }
  const version = value.version as 1 | 2 | 3 | 4
  const exportedAt = timestamp(
    requiredString(value, 'exportedAt', 'Copia'),
    'Copia',
  )
  const data = parseSnapshot(value.data, version)
  assertUnique(
    data.statuses.map(
      ({ datasetId, semordnilapId, status }) =>
        `${datasetId}\u001f${semordnilapId}\u001f${status}`,
    ),
    'estados',
  )
  assertUnique(
    data.savedComposites.map(({ id }) => id),
    'composites',
  )
  assertUnique(
    data.compositionDrafts.map(({ datasetId }) => datasetId),
    'borradores',
  )
  assertUnique(
    data.workspacePreferences?.catalogViews.map(({ datasetId }) => datasetId) ??
      [],
    'preferencias de catálogo',
  )
  assertUnique(
    data.tags.map(({ id }) => id),
    'identificadores de etiquetas',
  )
  assertUnique(
    data.tags.map(({ normalizedName }) => normalizedName),
    'nombres de etiquetas',
  )
  assertUnique(
    data.semordnilapTags.map(
      ({ datasetId, semordnilapId, tagId }) =>
        `${datasetId}\u001f${semordnilapId}\u001f${tagId}`,
    ),
    'asignaciones de etiquetas',
  )
  assertUnique(
    data.wordFilters.map(
      ({ language, normalizedWord }) => `${language}\u001f${normalizedWord}`,
    ),
    'filtros de palabras',
  )
  return { format: BACKUP_FORMAT, version, exportedAt, data }
}

export function createSemordnilabBackup(
  data: PersonalDataSnapshot,
  exportedAt: string,
): SemordnilabBackup {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt,
    data: {
      ...data,
      statuses: normalizeSemordnilapStatusRecords(data.statuses),
    },
  }
}

export function summarizePersonalData(
  data: PersonalDataSnapshot,
): PersonalDataSummary {
  const statuses = normalizeSemordnilapStatusRecords(data.statuses)
  return {
    statuses: statuses.length,
    favorites: statuses.filter(({ status }) => status === 'favorite').length,
    discarded: statuses.filter(({ status }) => status === 'discarded').length,
    savedComposites: data.savedComposites.length,
    compositionDrafts: data.compositionDrafts.length,
    tags: data.tags.length,
    taggedSemordnilaps: new Set(
      data.semordnilapTags.map(
        ({ datasetId, semordnilapId }) => `${datasetId}\u001f${semordnilapId}`,
      ),
    ).size,
    wordFilters: data.wordFilters.length,
    includesPreferences: Boolean(data.workspacePreferences),
  }
}

function statusKey(record: PersonalDataSnapshot['statuses'][number]): string {
  return `${record.datasetId}\u001f${record.semordnilapId}\u001f${record.status}`
}

export function buildImportedSnapshot(
  current: PersonalDataSnapshot,
  imported: PersonalDataSnapshot,
  options: PersonalDataImportOptions,
): PersonalDataSnapshot {
  if (options.mode === 'replace') {
    const snapshot: PersonalDataSnapshot = {
      statuses: normalizeSemordnilapStatusRecords(imported.statuses),
      savedComposites: imported.savedComposites,
      compositionDrafts: imported.compositionDrafts,
      tags: imported.tags,
      semordnilapTags: imported.semordnilapTags,
      wordFilters: imported.wordFilters,
    }
    const preferences = options.importPreferences
      ? imported.workspacePreferences
      : current.workspacePreferences
    return preferences
      ? { ...snapshot, workspacePreferences: preferences }
      : snapshot
  }

  const statuses = new Map(
    current.statuses.map((record) => [statusKey(record), record]),
  )
  for (const record of imported.statuses)
    statuses.set(statusKey(record), record)

  const composites = new Map(
    current.savedComposites.map((record) => [record.id, record]),
  )
  for (const record of imported.savedComposites) {
    if (!composites.has(record.id)) composites.set(record.id, record)
  }

  const drafts = new Map(
    current.compositionDrafts.map((record) => [record.datasetId, record]),
  )
  for (const record of imported.compositionDrafts) {
    if (
      options.draftConflicts === 'use-imported' ||
      !drafts.has(record.datasetId)
    ) {
      drafts.set(record.datasetId, record)
    }
  }

  const tags = new Map(current.tags.map((tag) => [tag.id, tag]))
  const tagsByName = new Map(
    current.tags.map((tag) => [tag.normalizedName, tag.id]),
  )
  const importedTagIds = new Map<string, string>()
  for (const tag of imported.tags) {
    const existingById = tags.get(tag.id)
    const existingByName = tagsByName.get(tag.normalizedName)
    const resultingId = existingById?.id ?? existingByName ?? tag.id
    importedTagIds.set(tag.id, resultingId)
    if (!existingById && !existingByName) {
      tags.set(tag.id, tag)
      tagsByName.set(tag.normalizedName, tag.id)
    }
  }

  const tagAssignments = new Map(
    current.semordnilapTags.map((assignment) => [
      `${assignment.datasetId}\u001f${assignment.semordnilapId}\u001f${assignment.tagId}`,
      assignment,
    ]),
  )
  for (const assignment of imported.semordnilapTags) {
    const mapped = {
      ...assignment,
      tagId: importedTagIds.get(assignment.tagId) ?? assignment.tagId,
    }
    tagAssignments.set(
      `${mapped.datasetId}\u001f${mapped.semordnilapId}\u001f${mapped.tagId}`,
      mapped,
    )
  }

  const wordFilters = new Map(
    current.wordFilters.map((record) => [
      `${record.language}\u001f${record.normalizedWord}`,
      record,
    ]),
  )
  for (const record of imported.wordFilters) {
    wordFilters.set(`${record.language}\u001f${record.normalizedWord}`, record)
  }

  return {
    statuses: normalizeSemordnilapStatusRecords([...statuses.values()]),
    savedComposites: [...composites.values()],
    compositionDrafts: [...drafts.values()],
    tags: [...tags.values()],
    semordnilapTags: [...tagAssignments.values()],
    wordFilters: [...wordFilters.values()],
    ...(options.importPreferences && imported.workspacePreferences
      ? { workspacePreferences: imported.workspacePreferences }
      : current.workspacePreferences
        ? { workspacePreferences: current.workspacePreferences }
        : {}),
  }
}

export async function validatePersonalDataSnapshot(
  data: PersonalDataSnapshot,
  source: SemordnilapDatasetSource,
): Promise<void> {
  const knownDatasets = new Set(source.listAvailable().map(({ id }) => id))
  const referencedDatasets = new Set<DatasetId>([
    ...data.statuses.map(({ datasetId }) => datasetId),
    ...data.savedComposites.map(({ datasetId }) => datasetId),
    ...data.compositionDrafts.map(({ datasetId }) => datasetId),
    ...data.semordnilapTags.map(({ datasetId }) => datasetId),
    ...(data.workspacePreferences?.catalogViews.map(
      ({ datasetId }) => datasetId,
    ) ?? []),
  ])
  const knownTagIds = new Set(data.tags.map(({ id }) => id))
  for (const assignment of data.semordnilapTags) {
    if (!knownTagIds.has(assignment.tagId)) {
      throw new Error(
        `La asignación hace referencia a la etiqueta ${assignment.tagId}, que no existe.`,
      )
    }
  }

  for (const datasetId of referencedDatasets) {
    if (!knownDatasets.has(datasetId)) {
      throw new Error(
        `El dataset ${datasetId} no está disponible en esta aplicación.`,
      )
    }
    const loaded = await source.load(datasetId)
    const atomics = loaded.items
      .map(({ semordnilap }) => semordnilap)
      .filter((item) => item.kind === 'atomic')
    const compositeRecords = data.savedComposites.filter(
      (record) => record.datasetId === datasetId,
    )
    const composites = resolveSavedComposites(compositeRecords, atomics)
    const knownIds = new Set<SemordnilapId>([
      ...atomics.map(({ id }) => id),
      ...composites.map(({ id }) => id),
    ])
    const knownReferences = new Set([
      ...atomics.map(({ id }) => `atomic:${id}`),
      ...composites.map(({ id }) => `composite:${id}`),
    ])
    for (const record of data.statuses.filter(
      (status) => status.datasetId === datasetId,
    )) {
      if (!knownIds.has(record.semordnilapId)) {
        throw new Error(
          `El estado hace referencia a ${record.semordnilapId}, que no existe.`,
        )
      }
    }
    for (const assignment of data.semordnilapTags.filter(
      (record) => record.datasetId === datasetId,
    )) {
      if (!knownIds.has(assignment.semordnilapId)) {
        throw new Error(
          `La etiqueta hace referencia a ${assignment.semordnilapId}, que no existe.`,
        )
      }
    }
    for (const draft of data.compositionDrafts.filter(
      (record) => record.datasetId === datasetId,
    )) {
      if (draft.insertionIndex > draft.components.length) {
        throw new Error(
          `El borrador de ${datasetId} tiene una posición no válida.`,
        )
      }
      for (const reference of draft.components) {
        if (
          reference.datasetId !== datasetId ||
          !knownReferences.has(`${reference.kind}:${reference.semordnilapId}`)
        ) {
          throw new Error(
            `El borrador de ${datasetId} contiene una referencia ausente.`,
          )
        }
      }
    }
  }
}

export function createImportPreview(
  backup: SemordnilabBackup,
  current: PersonalDataSnapshot,
  options: PersonalDataImportOptions,
): PersonalDataImportPreview {
  const snapshot = buildImportedSnapshot(current, backup.data, options)
  const currentCompositeIds = new Set(
    current.savedComposites.map(({ id }) => id),
  )
  const currentDraftIds = new Set(
    current.compositionDrafts.map(({ datasetId }) => datasetId),
  )
  return {
    backup,
    imported: summarizePersonalData(backup.data),
    resulting: summarizePersonalData(snapshot),
    duplicateComposites: backup.data.savedComposites.filter(({ id }) =>
      currentCompositeIds.has(id),
    ).length,
    draftConflicts: backup.data.compositionDrafts.filter(({ datasetId }) =>
      currentDraftIds.has(datasetId),
    ).length,
  }
}
