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

    const trigger = screen.getByRole('button', {
      name: 'Revisar palabras · 4',
    })
    expect(
      screen.queryByRole('dialog', {
        name: 'Inspector léxico de la composición',
      }),
    ).not.toBeInTheDocument()
    await user.click(trigger)
    const inspector = screen.getByRole('dialog', {
      name: 'Inspector léxico de la composición',
    })
    expect(inspector.parentElement).toBe(document.body)
    expect(within(inspector).getAllByRole('link')).toHaveLength(4)
    expect(
      within(inspector).getByRole('link', { name: /ella en RAE/u }),
    ).toHaveAttribute('href', 'https://dle.rae.es/ella')
    expect(within(inspector).getAllByText('ella')).toHaveLength(1)
    expect(
      within(inspector).getByRole('region', { name: 'Español' }),
    ).toBeVisible()
    expect(
      within(inspector).getByRole('region', { name: 'Gallego' }),
    ).toBeVisible()
    const spanishWords = within(inspector).getByRole('list', {
      name: 'Palabras en Español',
    })
    expect(getComputedStyle(spanishWords).overflowY).toBe('auto')
    expect(getComputedStyle(spanishWords).maxHeight).toBe('192px')
    expect(
      getComputedStyle(spanishWords.parentElement?.parentElement as Element)
        .gridTemplateColumns,
    ).toBe('repeat(2, minmax(0, 1fr))')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })
})
