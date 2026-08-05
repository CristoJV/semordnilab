import type { SemordnilapStatusRecord } from '@/application/dto/semordnilap-status'
import type { SemordnilapStatusRepository } from '@/application/ports/semordnilap-status-repository'

export class AddSemordnilapStatus {
  private readonly repository: SemordnilapStatusRepository

  constructor(repository: SemordnilapStatusRepository) {
    this.repository = repository
  }

  execute(record: SemordnilapStatusRecord): Promise<void> {
    return this.repository.add(record)
  }
}
