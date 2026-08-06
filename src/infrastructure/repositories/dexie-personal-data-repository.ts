import type {
  PersonalDataRepository,
  PersonalDataSnapshot,
} from '@/application'
import type { SemordnilabDatabase } from '@/infrastructure/database'
import type { SemordnilapId } from '@/domain/semordnilap'

export class DexiePersonalDataRepository implements PersonalDataRepository {
  private readonly database: SemordnilabDatabase

  constructor(database: SemordnilabDatabase) {
    this.database = database
  }

  async readAll(): Promise<PersonalDataSnapshot> {
    const [statuses, savedComposites, compositionDrafts, workspacePreferences] =
      await this.database.transaction(
        'r',
        [
          this.database.semordnilapStatuses,
          this.database.savedComposites,
          this.database.compositionDrafts,
          this.database.workspacePreferences,
        ],
        async () =>
          Promise.all([
            this.database.semordnilapStatuses.toArray(),
            this.database.savedComposites.toArray(),
            this.database.compositionDrafts.toArray(),
            this.database.workspacePreferences.get('workspace'),
          ]),
      )

    return {
      statuses,
      savedComposites,
      compositionDrafts,
      ...(workspacePreferences ? { workspacePreferences } : {}),
    }
  }

  async replaceAll(snapshot: PersonalDataSnapshot): Promise<void> {
    await this.database.transaction(
      'rw',
      [
        this.database.semordnilapStatuses,
        this.database.savedComposites,
        this.database.compositionDrafts,
        this.database.workspacePreferences,
      ],
      async () => {
        await Promise.all([
          this.database.semordnilapStatuses.clear(),
          this.database.savedComposites.clear(),
          this.database.compositionDrafts.clear(),
          this.database.workspacePreferences.clear(),
        ])
        await Promise.all([
          this.database.semordnilapStatuses.bulkPut([...snapshot.statuses]),
          this.database.savedComposites.bulkPut([...snapshot.savedComposites]),
          this.database.compositionDrafts.bulkPut([
            ...snapshot.compositionDrafts,
          ]),
          snapshot.workspacePreferences
            ? this.database.workspacePreferences.put(
                snapshot.workspacePreferences,
              )
            : Promise.resolve(),
        ])
      },
    )
  }

  async updateCompositeTitle(
    id: SemordnilapId,
    title: string | undefined,
    updatedAt: string,
  ): Promise<boolean> {
    const updated = await this.database.savedComposites.update(id, {
      title,
      updatedAt,
    })
    return updated > 0
  }

  async deleteCompositeIfUnreferenced(id: SemordnilapId) {
    return this.database.transaction(
      'rw',
      [
        this.database.savedComposites,
        this.database.compositionDrafts,
        this.database.semordnilapStatuses,
      ],
      async () => {
        const existing = await this.database.savedComposites.get(id)
        if (!existing) {
          return {
            found: false,
            removed: false,
            dependentComposites: 0,
            dependentDrafts: 0,
          }
        }
        const [composites, draft] = await Promise.all([
          this.database.savedComposites
            .where('datasetId')
            .equals(existing.datasetId)
            .toArray(),
          this.database.compositionDrafts.get(existing.datasetId),
        ])
        const dependentComposites = composites.filter(
          (record) =>
            record.id !== id &&
            record.components.some(
              (reference) =>
                reference.kind === 'composite' &&
                reference.semordnilapId === id,
            ),
        ).length
        const dependentDrafts =
          draft?.components.some(
            (reference) =>
              reference.kind === 'composite' && reference.semordnilapId === id,
          ) === true
            ? 1
            : 0
        if (dependentComposites > 0 || dependentDrafts > 0) {
          return {
            found: true,
            removed: false,
            dependentComposites,
            dependentDrafts,
          }
        }
        await Promise.all([
          this.database.savedComposites.delete(id),
          this.database.semordnilapStatuses
            .where('semordnilapId')
            .equals(id)
            .delete(),
        ])
        return {
          found: true,
          removed: true,
          dependentComposites: 0,
          dependentDrafts: 0,
        }
      },
    )
  }
}
