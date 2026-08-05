import { describe, expect, it } from 'vitest'

import { DatasetLoadError } from './errors'
import { parseSemordnilapTsv } from './parse-semordnilap-tsv'

const header =
  'source_lang\tsource_corpus\tsource_text\tsource_n\tsource_count\tsource_norm_key\ttarget_lang\ttarget_corpus\ttarget_text\ttarget_n\ttarget_count\ttarget_norm_key\tpair_score'

describe('parseSemordnilapTsv', () => {
  it('convierte una fila TSV completa', () => {
    const rows = parseSemordnilapTsv(
      `${header}\nes\twikisource\tella\t1\t76529\tella\tgl\twikisource\ta lle\t2\t5\talle\t13.03\n`,
    )

    expect(rows).toEqual([
      {
        sourceLang: 'es',
        sourceCorpus: 'wikisource',
        sourceText: 'ella',
        sourceWordCount: 1,
        sourceFrequency: 76529,
        sourceNormalized: 'ella',
        targetLang: 'gl',
        targetCorpus: 'wikisource',
        targetText: 'a lle',
        targetWordCount: 2,
        targetFrequency: 5,
        targetNormalized: 'alle',
        pairScore: 13.03,
      },
    ])
  })

  it('informa de columnas ausentes', () => {
    expect(() => parseSemordnilapTsv('source_lang\tes\n')).toThrow(
      /Falta la columna requerida/u,
    )
  })

  it('informa de valores numéricos inválidos', () => {
    const content = `${header}\nes\twikisource\tella\tuno\t5\tella\tgl\twikisource\ta lle\t2\t5\talle\t1\n`

    expect(() => parseSemordnilapTsv(content)).toThrow(DatasetLoadError)
    expect(() => parseSemordnilapTsv(content)).toThrow(/fila 2/u)
  })
})
