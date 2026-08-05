import type { SemordnilapStatusReference } from '@/application/dto/semordnilap-status'
import type { SemordnilapStatusRepository } from '@/application/ports/semordnilap-status-repository'

export class RemoveSemordnilapStatus {
  private readonly repository: SemordnilapStatusRepository

  constructor(repository: SemordnilapStatusRepository) {
    this.repository = repository
  }

  execute(reference: SemordnilapStatusReference): Promise<void> {
    return this.repository.remove(reference)
  }
}
