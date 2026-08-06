import { describe, expect, it } from 'vitest'

import {
  composeAtomicSemordnilaps,
  createStableSemordnilapId,
  InvalidSemordnilapError,
  reverseUnicode,
  validateAtomicSemordnilap,
} from '@/domain/semordnilap'

import { createAtomicSemordnilap } from '../support/fixtures'

describe('reverseUnicode', () => {
  it('invierte grafemas completos', () => {
    expect(reverseUnicode('a👩‍💻b')).toBe('b👩‍💻a')
    expect(reverseUnicode('áb')).toBe('bá')
  })
})

describe('createStableSemordnilapId', () => {
  it('conserva la identidad cuando cambia la posición del registro', () => {
    const parts = ['es', 'amor', 'amor', 'gl', 'roma', 'roma']

    expect(createStableSemordnilapId('atomic', 'es-gl', parts)).toBe(
      createStableSemordnilapId('atomic', 'es-gl', [...parts]),
    )
    expect(createStableSemordnilapId('atomic', 'es-gl', parts)).toMatch(
      /^atomic:es-gl:/,
    )
  })
})

describe('validateAtomicSemordnilap', () => {
  it('acepta dos expresiones normalizadas inversas', () => {
    const semordnilap = createAtomicSemordnilap(
      'ella',
      'ella',
      'ella',
      'a lle',
      'alle',
    )

    expect(() => validateAtomicSemordnilap(semordnilap)).not.toThrow()
  })

  it('rechaza expresiones que no son inversas', () => {
    const semordnilap = createAtomicSemordnilap(
      'invalid',
      'hola',
      'hola',
      'adeus',
      'adeus',
    )

    expect(() => validateAtomicSemordnilap(semordnilap)).toThrow(
      InvalidSemordnilapError,
    )
  })
})

describe('composeAtomicSemordnilaps', () => {
  const ella = createAtomicSemordnilap('ella', 'ella', 'ella', 'a lle', 'alle')
  const noSe = createAtomicSemordnilap(
    'no-se',
    'no se',
    'nose',
    'e son',
    'eson',
  )

  it('deriva el destino en orden inverso desde una única secuencia', () => {
    const result = composeAtomicSemordnilaps([ella, noSe])

    expect(result.source.map(({ text }) => text)).toEqual(['ella', 'no se'])
    expect(result.target.map(({ text }) => text)).toEqual(['e son', 'a lle'])
    expect(result.sourceNormalized).toBe('ellanose')
    expect(result.targetNormalized).toBe('esonalle')
    expect(result.isSemordnilap).toBe(true)
    expect(result.isComposite).toBe(true)
  })

  it('admite repeticiones intencionadas', () => {
    const result = composeAtomicSemordnilaps([ella, ella])

    expect(result.isSemordnilap).toBe(true)
    expect(result.sourceText).toBe('ella ella')
    expect(result.targetText).toBe('a lle a lle')
  })

  it('diferencia una selección individual de una composición', () => {
    expect(composeAtomicSemordnilaps([]).isSemordnilap).toBe(false)
    expect(composeAtomicSemordnilaps([ella]).isComposite).toBe(false)
  })
})
