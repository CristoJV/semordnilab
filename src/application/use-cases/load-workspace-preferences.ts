import {
  DEFAULT_WORKSPACE_PREFERENCES,
  type WorkspacePreferencesRecord,
} from '@/application/dto/workspace-preferences'
import type { WorkspacePreferencesRepository } from '@/application/ports/workspace-preferences-repository'

export class LoadWorkspacePreferences {
  private readonly repository: WorkspacePreferencesRepository

  constructor(repository: WorkspacePreferencesRepository) {
    this.repository = repository
  }

  async execute(): Promise<WorkspacePreferencesRecord> {
    return (await this.repository.get()) ?? DEFAULT_WORKSPACE_PREFERENCES
  }
}
