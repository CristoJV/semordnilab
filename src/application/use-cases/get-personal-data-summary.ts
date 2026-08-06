import { summarizePersonalData } from '@/application/personal-data/semordnilab-backup'
import type { PersonalDataRepository } from '@/application/ports/personal-data-repository'

export class GetPersonalDataSummary {
  private readonly repository: PersonalDataRepository

  constructor(repository: PersonalDataRepository) {
    this.repository = repository
  }

  async execute() {
    return summarizePersonalData(await this.repository.readAll())
  }
}
