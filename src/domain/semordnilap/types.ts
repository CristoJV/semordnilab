export type DatasetId = string
export type SemordnilapId = string
export type LanguageCode = string

export type SemordnilapExpression = {
  language: LanguageCode
  text: string
  normalized: string
}

export type AtomicSemordnilap = {
  kind: 'atomic'
  id: SemordnilapId
  datasetId: DatasetId
  source: SemordnilapExpression
  target: SemordnilapExpression
}

export type SemordnilapReference = {
  kind: 'atomic'
  datasetId: DatasetId
  semordnilapId: SemordnilapId
}

export type CompositionSnapshot = {
  source: readonly SemordnilapExpression[]
  target: readonly SemordnilapExpression[]
  sourceText: string
  targetText: string
  sourceNormalized: string
  targetNormalized: string
  isSemordnilap: boolean
  isComposite: boolean
}
