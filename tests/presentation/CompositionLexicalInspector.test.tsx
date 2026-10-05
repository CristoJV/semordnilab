import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { CompositionLexicalInspector } from '@/presentation/components/CompositionLexicalInspector'

import { testDataset } from '../support/fixtures'

describe('CompositionLexicalInspector', () => {
  it('expone a la vez palabras únicas de ambos idiomas y sus diccionarios', async () => {
    const user = userEvent.setup()
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
    await user.click(within(inspector).getByText('Revisar palabras · 4'))
    expect(
      within(inspector).getByRole('region', { name: 'Español' }),
    ).toBeVisible()
    expect(
      within(inspector).getByRole('region', { name: 'Gallego' }),
    ).toBeVisible()
  })
})
