import type {
  DatasetId,
  LanguageCode,
  Semordnilap,
  SemordnilapId,
} from '@/domain/semordnilap'

export type LanguageDescriptor = {
  code: LanguageCode
  label: string
}

export type AvailableDataset = {
  id: DatasetId
  label: string
  sourceLanguage: LanguageDescriptor
  targetLanguage: LanguageDescriptor
}

export type SemordnilapCatalogMetadata = {
  sourceCorpus: string
  sourceWordCount: number
  sourceFrequency: number
  targetCorpus: string
  targetWordCount: number
  targetFrequency: number
  pairScore: number
}

export type SemordnilapCatalogItem = {
  semordnilap: Semordnilap
  metadata: SemordnilapCatalogMetadata | null
  sourceSearchText: string
  targetSearchText: string
  legacyIds: readonly SemordnilapId[]
}

export type LoadedSemordnilapDataset = {
  dataset: AvailableDataset
  items: readonly SemordnilapCatalogItem[]
}
