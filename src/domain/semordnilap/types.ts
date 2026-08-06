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

export type AtomicSemordnilapReference = {
  kind: 'atomic'
  datasetId: DatasetId
  semordnilapId: SemordnilapId
}

export type CompositeSemordnilapReference = {
  kind: 'composite'
  datasetId: DatasetId
  semordnilapId: SemordnilapId
}

export type SemordnilapReference =
  AtomicSemordnilapReference | CompositeSemordnilapReference

export type CompositeSemordnilap = {
  kind: 'composite'
  id: SemordnilapId
  datasetId: DatasetId
  components: readonly SemordnilapReference[]
  atomicComponents: readonly AtomicSemordnilapReference[]
  source: SemordnilapExpression
  target: SemordnilapExpression
  title?: string
  createdAt: string
  updatedAt: string
}

export type Semordnilap = AtomicSemordnilap | CompositeSemordnilap

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
