import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { CatalogSortControl } from '@/presentation/components/CatalogSortControl'
import {
  cycleCatalogSort,
  setCatalogSort,
} from '@/presentation/components/catalog-sort'
import type {
  CatalogSort,
  CatalogSortDirection,
  CatalogSortField,
} from '@/presentation/components/catalog-view'

function CompactSortHarness() {
  const [sort, setSort] = useState<CatalogSort>([])
  const change = (
    field: CatalogSortField,
    direction: CatalogSortDirection | null,
  ) => setSort((current) => setCatalogSort(current, field, 'source', direction))

  return (
    <CatalogSortControl
      languageLabel="Español"
      layout="compact"
      side="source"
      sort={sort}
      onCycle={(field) =>
        setSort((current) => cycleCatalogSort(current, field, 'source'))
      }
      onSet={(field, _side, direction) => change(field, direction)}
    />
  )
}

describe('CatalogSortControl', () => {
  it('permite combinar criterios desde el diálogo compacto', async () => {
    const user = userEvent.setup()
    render(<CompactSortHarness />)

    await user.click(screen.getByRole('button', { name: 'Ordenar Español' }))
    const dialog = screen.getByRole('dialog', { name: 'Ordenar Español' })

    await user.click(within(dialog).getByRole('button', { name: 'A → Z' }))
    expect(within(dialog).getByText('Prioridad 1')).toBeInTheDocument()
    await user.click(
      within(dialog).getByRole('button', { name: 'Larga → corta' }),
    )
    expect(within(dialog).getByText('Prioridad 2')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Listo' }))
    expect(
      screen.queryByRole('dialog', { name: 'Ordenar Español' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })
})
