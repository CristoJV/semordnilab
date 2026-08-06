import { describe, expect, it, vi } from 'vitest'

import { StaticTsvSemordnilapDatasetSource } from '@/infrastructure/datasets'

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
      id: expect.stringMatching(/^atomic:es-gl:/),
      source: { text: 'ella', normalized: 'ella' },
      target: { text: 'a lle', normalized: 'alle' },
    })
    expect(result.items[0]?.legacyIds).toEqual(['es-gl:2'])
    expect(result.items[0]?.metadata?.sourceFrequency).toBe(76529)
  })

  it('mantiene el identificador cuando una fila cambia de posición', async () => {
    const secondRow =
      'es\twikisource\tno se\t2\t57928\tnose\tgl\twikisource\te son\t2\t65\teson\t15.15'
    const firstOrder = `${validTsv}\n${secondRow}`
    const lines = firstOrder.split('\n')
    const secondOrder = [lines[0], lines[2], lines[1]].join('\n')
    const source = new StaticTsvSemordnilapDatasetSource(
      '/',
      vi
        .fn()
        .mockResolvedValueOnce(firstOrder)
        .mockResolvedValueOnce(secondOrder),
    )

    const first = await source.load('es-gl')
    const second = await source.load('es-gl')
    const idByText = (items: typeof first.items) =>
      new Map(
        items.map(({ semordnilap }) => [
          semordnilap.source.text,
          semordnilap.id,
        ]),
      )

    expect(idByText(second.items)).toEqual(idByText(first.items))
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
