import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { StaticTsvSemordnilapDatasetSource } from '@/infrastructure/datasets'

const expectedSizes = {
  'es-es': 6642,
  'es-gl': 1091,
  'es-pt': 4513,
} as const

const datasetFiles = {
  'es_es.tsv': resolve(process.cwd(), 'public/datasets/es_es.tsv'),
  'es_gl.tsv': resolve(process.cwd(), 'public/datasets/es_gl.tsv'),
  'es_pt.tsv': resolve(process.cwd(), 'public/datasets/es_pt.tsv'),
} as const

describe('datasets incluidos', () => {
  it.each(Object.entries(expectedSizes))(
    'carga y valida todos los semordnilaps de %s',
    async (datasetId, expectedSize) => {
      const source = new StaticTsvSemordnilapDatasetSource('/', async (url) => {
        const fileName = url.split('/').at(-1)
        if (!fileName || !(fileName in datasetFiles)) {
          throw new Error(`Archivo inesperado: ${url}`)
        }
        return readFile(
          datasetFiles[fileName as keyof typeof datasetFiles],
          'utf8',
        )
      })

      const result = await source.load(datasetId)

      expect(result.items).toHaveLength(expectedSize)
      expect(
        result.items.every(({ semordnilap }) => semordnilap.kind === 'atomic'),
      ).toBe(true)
    },
  )
})
