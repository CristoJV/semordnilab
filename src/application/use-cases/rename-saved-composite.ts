import type { PersonalDataRepository } from '@/application/ports/personal-data-repository'
import type { SemordnilapId } from '@/domain/semordnilap'

export class RenameSavedComposite {
  private readonly repository: PersonalDataRepository
  private readonly now: () => Date

  constructor(
    repository: PersonalDataRepository,
    now: () => Date = () => new Date(),
  ) {
    this.repository = repository
    this.now = now
  }

  async execute(id: SemordnilapId, requestedTitle: string): Promise<void> {
    const title = requestedTitle.trim()
    if (title.length > 120) {
      throw new Error('El nombre no puede superar los 120 caracteres.')
    }
    const updated = await this.repository.updateCompositeTitle(
      id,
      title || undefined,
      this.now().toISOString(),
    )
    if (!updated) throw new Error('El composite ya no está guardado.')
  }
}
