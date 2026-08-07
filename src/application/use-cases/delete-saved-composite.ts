import type { PersonalDataRepository } from '@/application/ports/personal-data-repository'
import type { SemordnilapId } from '@/domain/semordnilap'
import type { CompositeDeletionPlan } from '@/application/ports/personal-data-repository'

export class DeleteSavedComposite {
  private readonly repository: PersonalDataRepository

  constructor(repository: PersonalDataRepository) {
    this.repository = repository
  }

  async execute(
    planOrId: CompositeDeletionPlan | SemordnilapId,
  ): Promise<void> {
    const plan =
      typeof planOrId === 'string'
        ? await this.repository.inspectCompositeDeletion(planOrId)
        : planOrId
    if (!plan.found) throw new Error('El composite ya no está guardado.')
    if (plan.dependentIds.length > 0) {
      throw new Error(
        'Elimina primero los composites derivados antes de eliminar este composite.',
      )
    }
    if (plan.dependentDraftDatasetIds.length > 0) {
      throw new Error(
        'Retira los composites afectados del borrador antes de eliminarlos.',
      )
    }
    await this.repository.deleteCompositePlan(plan)
  }
}
