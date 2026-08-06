import type {
  PersonalDataImportOptions,
  PersonalDataImportPreview,
} from '@/application/dto/personal-data'
import {
  buildImportedSnapshot,
  createImportPreview,
  parseSemordnilabBackup,
  validatePersonalDataSnapshot,
} from '@/application/personal-data/semordnilab-backup'
import type { PersonalDataRepository } from '@/application/ports/personal-data-repository'
import type { SemordnilapDatasetSource } from '@/application/ports/semordnilap-dataset-source'

export class PreviewPersonalDataImport {
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
  ): Promise<PersonalDataImportPreview> {
    const backup = parseSemordnilabBackup(content)
    const current = await this.repository.readAll()
    const candidate = buildImportedSnapshot(current, backup.data, options)
    await validatePersonalDataSnapshot(candidate, this.datasetSource)
    return createImportPreview(backup, current, options)
  }
}
