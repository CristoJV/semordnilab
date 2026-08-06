import type { WorkspacePreferencesRecord } from '@/application/dto/workspace-preferences'

export interface WorkspacePreferencesRepository {
  get(): Promise<WorkspacePreferencesRecord | undefined>
  put(record: WorkspacePreferencesRecord): Promise<void>
}
