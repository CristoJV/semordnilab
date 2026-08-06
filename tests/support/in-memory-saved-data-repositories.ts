import type {
  CompositionDraftRecord,
  CompositionDraftRepository,
  SavedCompositeSemordnilapRecord,
  SavedCompositeSemordnilapRepository,
  PersonalDataRepository,
  PersonalDataSnapshot,
  WorkspacePreferencesRecord,
  WorkspacePreferencesRepository,
} from '@/application'

import type { InMemorySemordnilapStatusRepository } from './in-memory-semordnilap-status-repository'
import type { DatasetId, SemordnilapId } from '@/domain/semordnilap'

export class InMemorySavedCompositeSemordnilapRepository implements SavedCompositeSemordnilapRepository {
  private readonly records = new Map<
    SemordnilapId,
    SavedCompositeSemordnilapRecord
  >()

  async listByDataset(
    datasetId: DatasetId,
  ): Promise<readonly SavedCompositeSemordnilapRecord[]> {
    return [...this.records.values()].filter(
      (record) => record.datasetId === datasetId,
    )
  }

  async get(id: SemordnilapId) {
    return this.records.get(id)
  }

  async add(record: SavedCompositeSemordnilapRecord): Promise<void> {
    if (this.records.has(record.id)) throw new Error('Composite duplicado')
    this.records.set(record.id, record)
  }

  readAllRecords(): readonly SavedCompositeSemordnilapRecord[] {
    return [...this.records.values()]
  }

  replaceAllRecords(records: readonly SavedCompositeSemordnilapRecord[]): void {
    this.records.clear()
    for (const record of records) this.records.set(record.id, record)
  }
}

export class InMemoryCompositionDraftRepository implements CompositionDraftRepository {
  private readonly records = new Map<DatasetId, CompositionDraftRecord>()

  async get(datasetId: DatasetId) {
    return this.records.get(datasetId)
  }

  async put(record: CompositionDraftRecord): Promise<void> {
    this.records.set(record.datasetId, record)
  }

  async remove(datasetId: DatasetId): Promise<void> {
    this.records.delete(datasetId)
  }

  readAllRecords(): readonly CompositionDraftRecord[] {
    return [...this.records.values()]
  }

  replaceAllRecords(records: readonly CompositionDraftRecord[]): void {
    this.records.clear()
    for (const record of records) this.records.set(record.datasetId, record)
  }
}

export class InMemoryWorkspacePreferencesRepository implements WorkspacePreferencesRepository {
  private record: WorkspacePreferencesRecord | undefined

  async get() {
    return this.record
  }

  async put(record: WorkspacePreferencesRecord): Promise<void> {
    this.record = record
  }

  replace(record: WorkspacePreferencesRecord | undefined): void {
    this.record = record
  }
}

export class InMemoryPersonalDataRepository implements PersonalDataRepository {
  private readonly statuses: InMemorySemordnilapStatusRepository
  private readonly composites: InMemorySavedCompositeSemordnilapRepository
  private readonly drafts: InMemoryCompositionDraftRepository
  private readonly preferences: InMemoryWorkspacePreferencesRepository

  constructor(
    statuses: InMemorySemordnilapStatusRepository,
    composites: InMemorySavedCompositeSemordnilapRepository,
    drafts: InMemoryCompositionDraftRepository,
    preferences: InMemoryWorkspacePreferencesRepository,
  ) {
    this.statuses = statuses
    this.composites = composites
    this.drafts = drafts
    this.preferences = preferences
  }

  async readAll(): Promise<PersonalDataSnapshot> {
    const workspacePreferences = await this.preferences.get()
    return {
      statuses: this.statuses.readAllRecords(),
      savedComposites: this.composites.readAllRecords(),
      compositionDrafts: this.drafts.readAllRecords(),
      ...(workspacePreferences ? { workspacePreferences } : {}),
    }
  }

  async replaceAll(snapshot: PersonalDataSnapshot): Promise<void> {
    this.statuses.replaceAllRecords(snapshot.statuses)
    this.composites.replaceAllRecords(snapshot.savedComposites)
    this.drafts.replaceAllRecords(snapshot.compositionDrafts)
    this.preferences.replace(snapshot.workspacePreferences)
  }

  async updateCompositeTitle(
    id: SemordnilapId,
    title: string | undefined,
    updatedAt: string,
  ): Promise<boolean> {
    const records = this.composites.readAllRecords()
    if (!records.some((record) => record.id === id)) return false
    this.composites.replaceAllRecords(
      records.map((record) =>
        record.id === id ? { ...record, title, updatedAt } : record,
      ),
    )
    return true
  }

  async deleteCompositeIfUnreferenced(id: SemordnilapId) {
    const records = this.composites.readAllRecords()
    const existing = records.find((record) => record.id === id)
    if (!existing) {
      return {
        found: false,
        removed: false,
        dependentComposites: 0,
        dependentDrafts: 0,
      }
    }
    const dependentComposites = records.filter(
      (record) =>
        record.id !== id &&
        record.components.some(
          (reference) =>
            reference.kind === 'composite' && reference.semordnilapId === id,
        ),
    ).length
    const dependentDrafts = this.drafts
      .readAllRecords()
      .filter((record) =>
        record.components.some(
          (reference) =>
            reference.kind === 'composite' && reference.semordnilapId === id,
        ),
      ).length
    if (dependentComposites > 0 || dependentDrafts > 0) {
      return {
        found: true,
        removed: false,
        dependentComposites,
        dependentDrafts,
      }
    }
    this.composites.replaceAllRecords(
      records.filter((record) => record.id !== id),
    )
    this.statuses.replaceAllRecords(
      this.statuses
        .readAllRecords()
        .filter((record) => record.semordnilapId !== id),
    )
    return {
      found: true,
      removed: true,
      dependentComposites: 0,
      dependentDrafts: 0,
    }
  }
}
