import type {
  CompositeDeletionPlan,
  PersonalDataRepository,
  PersonalDataSnapshot,
} from '@/application'
import { buildCompositeDeletionPlan } from '@/application/composites/build-composite-deletion-plan'
import type { SemordnilabDatabase } from '@/infrastructure/database'
import type { SemordnilapId } from '@/domain/semordnilap'

export class DexiePersonalDataRepository implements PersonalDataRepository {
  private readonly database: SemordnilabDatabase

  constructor(database: SemordnilabDatabase) {
    this.database = database
  }

  async readAll(): Promise<PersonalDataSnapshot> {
    const [
      statuses,
      savedComposites,
      compositionDrafts,
      workspacePreferences,
      tags,
      semordnilapTags,
    ] = await this.database.transaction(
      'r',
      [
        this.database.semordnilapStatuses,
        this.database.savedComposites,
        this.database.compositionDrafts,
        this.database.workspacePreferences,
        this.database.tags,
        this.database.semordnilapTags,
      ],
      async () =>
        Promise.all([
          this.database.semordnilapStatuses.toArray(),
          this.database.savedComposites.toArray(),
          this.database.compositionDrafts.toArray(),
          this.database.workspacePreferences.get('workspace'),
          this.database.tags.toArray(),
          this.database.semordnilapTags.toArray(),
        ]),
    )

    return {
      statuses,
      savedComposites,
      compositionDrafts,
      tags,
      semordnilapTags,
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
        this.database.tags,
        this.database.semordnilapTags,
      ],
      async () => {
        await Promise.all([
          this.database.semordnilapStatuses.clear(),
          this.database.savedComposites.clear(),
          this.database.compositionDrafts.clear(),
          this.database.workspacePreferences.clear(),
          this.database.tags.clear(),
          this.database.semordnilapTags.clear(),
        ])
        await Promise.all([
          this.database.semordnilapStatuses.bulkPut([...snapshot.statuses]),
          this.database.savedComposites.bulkPut([...snapshot.savedComposites]),
          this.database.compositionDrafts.bulkPut([
            ...snapshot.compositionDrafts,
          ]),
          this.database.tags.bulkPut([...snapshot.tags]),
          this.database.semordnilapTags.bulkPut([...snapshot.semordnilapTags]),
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

  async inspectCompositeDeletion(id: SemordnilapId) {
    return this.database.transaction(
      'r',
      [this.database.savedComposites, this.database.compositionDrafts],
      async () =>
        buildCompositeDeletionPlan(
          await this.database.savedComposites.toArray(),
          await this.database.compositionDrafts.toArray(),
          id,
        ),
    )
  }

  async deleteCompositePlan(expected: CompositeDeletionPlan): Promise<void> {
    await this.database.transaction(
      'rw',
      [
        this.database.savedComposites,
        this.database.compositionDrafts,
        this.database.semordnilapStatuses,
        this.database.semordnilapTags,
      ],
      async () => {
        const current = buildCompositeDeletionPlan(
          await this.database.savedComposites.toArray(),
          await this.database.compositionDrafts.toArray(),
          expected.rootId,
        )
        if (!current.found) throw new Error('El composite ya no está guardado.')
        if (current.dependentDraftDatasetIds.length > 0) {
          throw new Error(
            'Retira los composites afectados del borrador antes de eliminarlos.',
          )
        }
        const currentIds = [...current.dependentIds].sort()
        const expectedIds = [...expected.dependentIds].sort()
        const currentDirectIds = [...current.directDependentIds].sort()
        const expectedDirectIds = [...expected.directDependentIds].sort()
        if (
          currentIds.join('\u001f') !== expectedIds.join('\u001f') ||
          currentDirectIds.join('\u001f') !== expectedDirectIds.join('\u001f')
        ) {
          throw new Error(
            'Las dependencias han cambiado. Revisa de nuevo los composites afectados.',
          )
        }
        const affectedIds = [current.rootId, ...current.dependentIds]
        await Promise.all([
          this.database.savedComposites.bulkDelete(affectedIds),
          this.database.semordnilapStatuses
            .where('semordnilapId')
            .anyOf(affectedIds)
            .delete(),
          this.database.semordnilapTags
            .where('semordnilapId')
            .anyOf(affectedIds)
            .delete(),
        ])
      },
    )
  }
}
