import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CompositionLexicalInspector } from '@/presentation/components/CompositionLexicalInspector'

import { testDataset } from '../support/fixtures'

describe('CompositionLexicalInspector', () => {
  it('expone palabras únicas de ambos idiomas y sus diccionarios', () => {
    render(
      <CompositionLexicalInspector
        dataset={testDataset}
        snapshot={{
          source: [],
          target: [],
          sourceText: 'ella y ella',
          targetText: 'a lle',
          sourceNormalized: 'ellayella',
          targetNormalized: 'alle',
          isSemordnilap: true,
          isComposite: true,
        }}
      />,
    )

    const inspector = screen.getByRole('group', {
      name: 'Inspector léxico de la composición',
    })
    expect(within(inspector).getAllByRole('link')).toHaveLength(4)
    expect(
      within(inspector).getByRole('link', { name: /ella en DLE/u }),
    ).toHaveAttribute('href', 'https://dle.rae.es/ella')
    expect(within(inspector).getAllByText('ella')).toHaveLength(1)
  })
})
