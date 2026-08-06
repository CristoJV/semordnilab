import type {
  WorkspacePreferencesRecord,
  WorkspacePreferencesRepository,
} from '@/application'
import type { SemordnilabDatabase } from '@/infrastructure/database'

export class DexieWorkspacePreferencesRepository implements WorkspacePreferencesRepository {
  private readonly database: SemordnilabDatabase

  constructor(database: SemordnilabDatabase) {
    this.database = database
  }

  get() {
    return this.database.workspacePreferences.get('workspace')
  }

  async put(record: WorkspacePreferencesRecord): Promise<void> {
    await this.database.workspacePreferences.put(record)
  }
}
