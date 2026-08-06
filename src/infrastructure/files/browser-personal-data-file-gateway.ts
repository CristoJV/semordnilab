import type { PersonalDataFileGateway, ReadableTextFile } from '@/application'

const MAX_BACKUP_BYTES = 10 * 1024 * 1024

export class BrowserPersonalDataFileGateway implements PersonalDataFileGateway {
  async readText(file: ReadableTextFile): Promise<string> {
    if (file.size > MAX_BACKUP_BYTES) {
      throw new Error('La copia supera el límite de 10 MB.')
    }
    return file.text()
  }

  downloadText(filename: string, content: string): void {
    const url = URL.createObjectURL(
      new Blob([content], { type: 'application/json;charset=utf-8' }),
    )
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}
