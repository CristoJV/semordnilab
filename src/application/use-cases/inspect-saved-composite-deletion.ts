import type { PersonalDataRepository } from '@/application/ports/personal-data-repository'
import type { SemordnilapId } from '@/domain/semordnilap'

export class InspectSavedCompositeDeletion {
  private readonly repository: PersonalDataRepository

  constructor(repository: PersonalDataRepository) {
    this.repository = repository
  }

  async execute(id: SemordnilapId) {
    const plan = await this.repository.inspectCompositeDeletion(id)
    if (!plan.found) throw new Error('El composite ya no está guardado.')
    return plan
  }
}
