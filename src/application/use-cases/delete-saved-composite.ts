import type { PersonalDataRepository } from '@/application/ports/personal-data-repository'
import type { SemordnilapId } from '@/domain/semordnilap'

export class DeleteSavedComposite {
  private readonly repository: PersonalDataRepository

  constructor(repository: PersonalDataRepository) {
    this.repository = repository
  }

  async execute(id: SemordnilapId): Promise<void> {
    const result = await this.repository.deleteCompositeIfUnreferenced(id)
    if (!result.found) throw new Error('El composite ya no está guardado.')
    if (result.removed) return

    const dependencies = [
      result.dependentComposites > 0
        ? `${result.dependentComposites} ${result.dependentComposites === 1 ? 'composite' : 'composites'}`
        : '',
      result.dependentDrafts > 0
        ? `${result.dependentDrafts} ${result.dependentDrafts === 1 ? 'borrador' : 'borradores'}`
        : '',
    ].filter(Boolean)
    throw new Error(
      `No se puede eliminar porque lo usan ${dependencies.join(' y ')}.`,
    )
  }
}
