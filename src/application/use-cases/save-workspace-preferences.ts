import type { WorkspacePreferencesRecord } from '@/application/dto/workspace-preferences'
import type { WorkspacePreferencesRepository } from '@/application/ports/workspace-preferences-repository'

export class SaveWorkspacePreferences {
  private readonly repository: WorkspacePreferencesRepository

  constructor(repository: WorkspacePreferencesRepository) {
    this.repository = repository
  }

  execute(record: WorkspacePreferencesRecord): Promise<void> {
    return this.repository.put(record)
  }
}
