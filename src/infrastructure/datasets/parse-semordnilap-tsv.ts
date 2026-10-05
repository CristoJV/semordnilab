import { DatasetLoadError } from './errors'
import type { TsvSemordnilapRecord } from './tsv-semordnilap-record'

const requiredColumns = [
  'source_lang',
  'source_corpus',
  'source_text',
  'source_n',
  'source_count',
  'source_norm_key',
  'target_lang',
  'target_corpus',
  'target_text',
  'target_n',
  'target_count',
  'target_norm_key',
  'pair_score',
] as const

type ColumnName = (typeof requiredColumns)[number]

function parseNumber(
  value: string,
  column: ColumnName,
  rowNumber: number,
): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    throw new DatasetLoadError(
      `La fila ${rowNumber} contiene un valor numérico inválido en ${column}.`,
    )
  }
  return parsed
}

function parsePositiveInteger(
  value: string,
  column: ColumnName,
  rowNumber: number,
): number {
  const parsed = parseNumber(value, column, rowNumber)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new DatasetLoadError(
      `La fila ${rowNumber} debe contener un entero positivo en ${column}.`,
    )
  }
  return parsed
}

function parseNonNegativeNumber(
  value: string,
  column: ColumnName,
  rowNumber: number,
): number {
  const parsed = parseNumber(value, column, rowNumber)
  if (parsed < 0) {
    throw new DatasetLoadError(
      `La fila ${rowNumber} debe contener una cantidad no negativa en ${column}.`,
    )
  }
  return parsed
}

export function parseSemordnilapTsv(
  content: string,
): readonly TsvSemordnilapRecord[] {
  const lines = content
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/u)
    .filter((line) => line.trim().length > 0)

  const headerLine = lines[0]
  if (!headerLine) {
    throw new DatasetLoadError('El dataset está vacío.')
  }

  const headers = headerLine.split('\t')
  const indexes = new Map(headers.map((header, index) => [header, index]))

  for (const column of requiredColumns) {
    if (!indexes.has(column)) {
      throw new DatasetLoadError(`Falta la columna requerida ${column}.`)
    }
  }

  const read = (
    cells: readonly string[],
    column: ColumnName,
    rowNumber: number,
  ): string => {
    const index = indexes.get(column)
    const value = index === undefined ? undefined : cells[index]
    if (value === undefined || value === '') {
      throw new DatasetLoadError(
        `La fila ${rowNumber} no contiene un valor para ${column}.`,
      )
    }
    return value
  }

  return lines.slice(1).map((line, index) => {
    const rowNumber = index + 2
    const cells = line.split('\t')

    return {
      sourceLang: read(cells, 'source_lang', rowNumber),
      sourceCorpus: read(cells, 'source_corpus', rowNumber),
      sourceText: read(cells, 'source_text', rowNumber),
      sourceWordCount: parsePositiveInteger(
        read(cells, 'source_n', rowNumber),
        'source_n',
        rowNumber,
      ),
      sourceFrequency: parseNonNegativeNumber(
        read(cells, 'source_count', rowNumber),
        'source_count',
        rowNumber,
      ),
      sourceNormalized: read(cells, 'source_norm_key', rowNumber),
      targetLang: read(cells, 'target_lang', rowNumber),
      targetCorpus: read(cells, 'target_corpus', rowNumber),
      targetText: read(cells, 'target_text', rowNumber),
      targetWordCount: parsePositiveInteger(
        read(cells, 'target_n', rowNumber),
        'target_n',
        rowNumber,
      ),
      targetFrequency: parseNonNegativeNumber(
        read(cells, 'target_count', rowNumber),
        'target_count',
        rowNumber,
      ),
      targetNormalized: read(cells, 'target_norm_key', rowNumber),
      pairScore: parseNumber(
        read(cells, 'pair_score', rowNumber),
        'pair_score',
        rowNumber,
      ),
    }
  })
}
