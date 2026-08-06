export type ReadableTextFile = {
  name: string
  size: number
  text(): Promise<string>
}

export interface PersonalDataFileGateway {
  readText(file: ReadableTextFile): Promise<string>
  downloadText(filename: string, content: string): void
}
