import { describe, expect, it } from 'vitest'

import {
  parseWorkspaceHash,
  workspaceHashFor,
} from '@/presentation/pages/workspace-route'

describe('ruta del espacio de trabajo', () => {
  it('recupera cada colección de revisión desde un enlace directo', () => {
    expect(parseWorkspaceHash('#/words/pending')).toEqual({
      view: 'word-filters',
      mode: 'pending',
    })
    expect(parseWorkspaceHash('#/words/verified')).toEqual({
      view: 'word-filters',
      mode: 'verified',
    })
    expect(parseWorkspaceHash('#/words/excluded')).toEqual({
      view: 'word-filters',
      mode: 'excluded',
    })
  })

  it('cae en composición ante rutas desconocidas y genera hashes canónicos', () => {
    expect(parseWorkspaceHash('')).toEqual({ view: 'workspace' })
    expect(parseWorkspaceHash('#/words/other')).toEqual({ view: 'workspace' })
    expect(workspaceHashFor({ view: 'workspace' })).toBe('#/')
    expect(workspaceHashFor({ view: 'word-filters', mode: 'verified' })).toBe(
      '#/words/verified',
    )
  })
})
