import { describe, expect, it, vi } from 'vitest'

import { StaticTsvSemordnilapDatasetSource } from './static-tsv-semordnilap-dataset-source'

const validTsv = [
  'source_lang\tsource_corpus\tsource_text\tsource_n\tsource_count\tsource_norm_key\ttarget_lang\ttarget_corpus\ttarget_text\ttarget_n\ttarget_count\ttarget_norm_key\tpair_score',
  'es\twikisource\tella\t1\t76529\tella\tgl\twikisource\ta lle\t2\t5\talle\t13.03',
].join('\n')

describe('StaticTsvSemordnilapDatasetSource', () => {
  it('carga, valida y mapea un dataset estático', async () => {
    const fetchText = vi.fn().mockResolvedValue(validTsv)
    const source = new StaticTsvSemordnilapDatasetSource('/base/', fetchText)

    const result = await source.load('es-gl')

    expect(fetchText).toHaveBeenCalledWith(
      '/base/datasets/es_gl.tsv',
      undefined,
    )
    expect(result.dataset.label).toBe('Español / Gallego')
    expect(result.items).toHaveLength(1)
    expect(result.items[0]?.semordnilap).toMatchObject({
      id: 'es-gl:2',
      source: { text: 'ella', normalized: 'ella' },
      target: { text: 'a lle', normalized: 'alle' },
    })
    expect(result.items[0]?.metadata.sourceFrequency).toBe(76529)
  })

  it('rechaza un identificador desconocido', async () => {
    const source = new StaticTsvSemordnilapDatasetSource('/', vi.fn())

    await expect(source.load('unknown')).rejects.toThrow(
      'El dataset seleccionado no existe.',
    )
  })

  it('rechaza filas que no cumplen la relación inversa', async () => {
    const invalidTsv = validTsv.replace('\talle\t', '\totra\t')
    const source = new StaticTsvSemordnilapDatasetSource(
      '/',
      vi.fn().mockResolvedValue(invalidTsv),
    )

    await expect(source.load('es-gl')).rejects.toThrow(
      'no contiene un semordnilap válido',
    )
  })
})
