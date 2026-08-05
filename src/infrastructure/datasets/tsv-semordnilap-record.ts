export type TsvSemordnilapRecord = {
  sourceLang: string
  sourceCorpus: string
  sourceText: string
  sourceWordCount: number
  sourceFrequency: number
  sourceNormalized: string
  targetLang: string
  targetCorpus: string
  targetText: string
  targetWordCount: number
  targetFrequency: number
  targetNormalized: string
  pairScore: number
}
