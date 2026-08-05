import type { AtomicSemordnilap } from '@/domain/semordnilap'
import type { AvailableDataset, SemordnilapCatalogItem } from '@/application'

export const testDataset: AvailableDataset = {
  id: 'test-es-gl',
  label: 'Español / Gallego',
  sourceLanguage: { code: 'es', label: 'Español' },
  targetLanguage: { code: 'gl', label: 'Gallego' },
}

export function createAtomicSemordnilap(
  id: string,
  sourceText: string,
  sourceNormalized: string,
  targetText: string,
  targetNormalized: string,
): AtomicSemordnilap {
  return {
    kind: 'atomic',
    id,
    datasetId: testDataset.id,
    source: {
      language: 'es',
      text: sourceText,
      normalized: sourceNormalized,
    },
    target: {
      language: 'gl',
      text: targetText,
      normalized: targetNormalized,
    },
  }
}

export function createCatalogItem(
  semordnilap: AtomicSemordnilap,
): SemordnilapCatalogItem {
  return {
    semordnilap,
    metadata: {
      sourceCorpus: 'test',
      sourceWordCount: semordnilap.source.text.split(' ').length,
      sourceFrequency: 10,
      targetCorpus: 'test',
      targetWordCount: semordnilap.target.text.split(' ').length,
      targetFrequency: 5,
      pairScore: 1,
    },
    sourceSearchText: `${semordnilap.source.text} ${semordnilap.source.normalized}`,
    targetSearchText: `${semordnilap.target.text} ${semordnilap.target.normalized}`,
  }
}
