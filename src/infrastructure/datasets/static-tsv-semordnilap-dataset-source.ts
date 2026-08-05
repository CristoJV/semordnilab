import type {
  AvailableDataset,
  LoadedSemordnilapDataset,
  SemordnilapCatalogItem,
  SemordnilapDatasetSource,
} from '@/application'
import {
  validateAtomicSemordnilap,
  type AtomicSemordnilap,
  type DatasetId,
} from '@/domain/semordnilap'

import { DatasetLoadError } from './errors'
import { parseSemordnilapTsv } from './parse-semordnilap-tsv'
import type { TsvSemordnilapRecord } from './tsv-semordnilap-record'

type DatasetDefinition = AvailableDataset & {
  fileName: string
}

export const includedDatasets: readonly DatasetDefinition[] = [
  {
    id: 'es-gl',
    label: 'Español / Gallego',
    sourceLanguage: { code: 'es', label: 'Español' },
    targetLanguage: { code: 'gl', label: 'Gallego' },
    fileName: 'es_gl.tsv',
  },
  {
    id: 'es-pt',
    label: 'Español / Portugués',
    sourceLanguage: { code: 'es', label: 'Español' },
    targetLanguage: { code: 'pt', label: 'Portugués' },
    fileName: 'es_pt.tsv',
  },
  {
    id: 'es-es',
    label: 'Español / Español',
    sourceLanguage: { code: 'es', label: 'Español' },
    targetLanguage: { code: 'es', label: 'Español' },
    fileName: 'es_es.tsv',
  },
]

type FetchText = (url: string, signal?: AbortSignal) => Promise<string>

const browserFetchText: FetchText = async (url, signal) => {
  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new DatasetLoadError(
      `No se ha podido cargar el dataset (${response.status}).`,
    )
  }
  return response.text()
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es')
}

function mapRecord(
  definition: DatasetDefinition,
  record: TsvSemordnilapRecord,
  index: number,
): SemordnilapCatalogItem {
  if (
    record.sourceLang !== definition.sourceLanguage.code ||
    record.targetLang !== definition.targetLanguage.code
  ) {
    throw new DatasetLoadError(
      `La fila ${index + 2} no coincide con los idiomas del dataset.`,
    )
  }

  const semordnilap: AtomicSemordnilap = {
    kind: 'atomic',
    id: `${definition.id}:${index + 2}`,
    datasetId: definition.id,
    source: {
      language: record.sourceLang,
      text: record.sourceText,
      normalized: record.sourceNormalized,
    },
    target: {
      language: record.targetLang,
      text: record.targetText,
      normalized: record.targetNormalized,
    },
  }

  try {
    validateAtomicSemordnilap(semordnilap)
  } catch (error) {
    throw new DatasetLoadError(
      `La fila ${index + 2} no contiene un semordnilap válido.`,
      { cause: error },
    )
  }

  return {
    semordnilap,
    metadata: {
      sourceCorpus: record.sourceCorpus,
      sourceWordCount: record.sourceWordCount,
      sourceFrequency: record.sourceFrequency,
      targetCorpus: record.targetCorpus,
      targetWordCount: record.targetWordCount,
      targetFrequency: record.targetFrequency,
      pairScore: record.pairScore,
    },
    sourceSearchText: normalizeSearchText(
      `${record.sourceText} ${record.sourceNormalized}`,
    ),
    targetSearchText: normalizeSearchText(
      `${record.targetText} ${record.targetNormalized}`,
    ),
  }
}

export class StaticTsvSemordnilapDatasetSource implements SemordnilapDatasetSource {
  private readonly baseUrl: string
  private readonly fetchText: FetchText

  constructor(baseUrl: string, fetchText: FetchText = browserFetchText) {
    this.baseUrl = baseUrl
    this.fetchText = fetchText
  }

  listAvailable(): readonly AvailableDataset[] {
    return includedDatasets.map(
      ({ id, label, sourceLanguage, targetLanguage }) => ({
        id,
        label,
        sourceLanguage,
        targetLanguage,
      }),
    )
  }

  async load(
    datasetId: DatasetId,
    signal?: AbortSignal,
  ): Promise<LoadedSemordnilapDataset> {
    const definition = includedDatasets.find(({ id }) => id === datasetId)
    if (!definition) {
      throw new DatasetLoadError('El dataset seleccionado no existe.')
    }

    const normalizedBaseUrl = this.baseUrl.endsWith('/')
      ? this.baseUrl
      : `${this.baseUrl}/`
    const content = await this.fetchText(
      `${normalizedBaseUrl}datasets/${definition.fileName}`,
      signal,
    )
    const records = parseSemordnilapTsv(content)

    return {
      dataset: {
        id: definition.id,
        label: definition.label,
        sourceLanguage: definition.sourceLanguage,
        targetLanguage: definition.targetLanguage,
      },
      items: records.map((record, index) =>
        mapRecord(definition, record, index),
      ),
    }
  }
}
