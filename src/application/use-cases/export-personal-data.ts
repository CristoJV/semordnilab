import { createSemordnilabBackup } from '@/application/personal-data/semordnilab-backup'
import type { PersonalDataRepository } from '@/application/ports/personal-data-repository'

export type ExportPersonalDataResult = {
  filename: string
  content: string
}

export class ExportPersonalData {
  private readonly repository: PersonalDataRepository
  private readonly now: () => Date

  constructor(
    repository: PersonalDataRepository,
    now: () => Date = () => new Date(),
  ) {
    this.repository = repository
    this.now = now
  }

  async execute(): Promise<ExportPersonalDataResult> {
    const now = this.now()
    const backup = createSemordnilabBackup(
      await this.repository.readAll(),
      now.toISOString(),
    )
    return {
      filename: `semordnilab-backup-${now.toISOString().slice(0, 10)}.json`,
      content: JSON.stringify(backup, null, 2),
    }
  }
}
