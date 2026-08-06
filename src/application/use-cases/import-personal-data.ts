import type { PersonalDataImportOptions } from '@/application/dto/personal-data'
import {
  buildImportedSnapshot,
  parseSemordnilabBackup,
  validatePersonalDataSnapshot,
} from '@/application/personal-data/semordnilab-backup'
import type { PersonalDataRepository } from '@/application/ports/personal-data-repository'
import type { SemordnilapDatasetSource } from '@/application/ports/semordnilap-dataset-source'

export class ImportPersonalData {
  private readonly repository: PersonalDataRepository
  private readonly datasetSource: SemordnilapDatasetSource

  constructor(
    repository: PersonalDataRepository,
    datasetSource: SemordnilapDatasetSource,
  ) {
    this.repository = repository
    this.datasetSource = datasetSource
  }

  async execute(
    content: string,
    options: PersonalDataImportOptions,
  ): Promise<void> {
    const backup = parseSemordnilabBackup(content)
    const current = await this.repository.readAll()
    const candidate = buildImportedSnapshot(current, backup.data, options)
    await validatePersonalDataSnapshot(candidate, this.datasetSource)
    await this.repository.replaceAll(candidate)
  }
}
