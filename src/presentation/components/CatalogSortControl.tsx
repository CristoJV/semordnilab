import { useState } from 'react'

import type { ResponsiveLayout } from '@/presentation/responsive/useResponsiveLayout'

import { ModalDialog } from './ModalDialog'
import type {
  CatalogSide,
  CatalogSort,
  CatalogSortDirection,
  CatalogSortField,
} from './catalog-view'
import styles from './CatalogSortControl.module.css'

type CatalogSortControlProps = {
  languageLabel: string
  layout: ResponsiveLayout
  side: CatalogSide
  sort: CatalogSort
  onCycle: (field: CatalogSortField, side: CatalogSide) => void
  onSet: (
    field: CatalogSortField,
    side: CatalogSide,
    direction: CatalogSortDirection | null,
  ) => void
}

const FIELDS = [
  'alphabetical',
  'length',
  'frequency',
  'wordCount',
  'pairScore',
] as const

function fieldName(field: CatalogSortField) {
  if (field === 'alphabetical') return 'Alfabético'
  if (field === 'length') return 'Longitud en caracteres'
  if (field === 'frequency') return 'Frecuencia'
  if (field === 'wordCount') return 'Número de palabras'
  return 'Puntuación de pareja'
}

function fieldDescription(field: CatalogSortField) {
  if (field === 'alphabetical') return 'alfabético'
  if (field === 'length') return 'por longitud'
  if (field === 'frequency') return 'por frecuencia'
  if (field === 'wordCount') return 'por número de palabras'
  return 'por puntuación de pareja'
}

function directionLabel(
  field: CatalogSortField,
  direction: CatalogSortDirection,
) {
  if (field === 'alphabetical') {
    return direction === 'ascending' ? 'A → Z' : 'Z → A'
  }
  if (field === 'length') {
    return direction === 'ascending' ? 'Corta → larga' : 'Larga → corta'
  }
  return direction === 'ascending' ? 'Menor → mayor' : 'Mayor → menor'
}

export function CatalogSortControl({
  languageLabel,
  layout,
  side,
  sort,
  onCycle,
  onSet,
}: CatalogSortControlProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const activeCriterion = (field: CatalogSortField) =>
    sort.find(
      (criterion) => criterion.field === field && criterion.side === side,
    )
  const criterionPriority = (field: CatalogSortField) =>
    sort.findIndex(
      (criterion) => criterion.field === field && criterion.side === side,
    ) + 1
  const activeCount = FIELDS.filter(activeCriterion).length

  if (layout === 'wide') {
    return (
      <div className={styles.inline} aria-label={`Ordenar ${languageLabel}`}>
        {FIELDS.map((field) => {
          const active = activeCriterion(field)
          const priority = criterionPriority(field)
          const compactLabel =
            field === 'alphabetical'
              ? active?.direction === 'descending'
                ? 'Z→A'
                : 'A→Z'
              : field === 'length'
                ? active?.direction === 'descending'
                  ? '9→1'
                  : '1→9'
                : `${field === 'frequency' ? 'Frec.' : field === 'wordCount' ? 'N-grama' : 'Score'}${active?.direction === 'descending' ? '↓' : '↑'}`
          const stateDescription = !active
            ? `Activar orden ${fieldDescription(field)} ascendente en ${languageLabel}`
            : active.direction === 'ascending'
              ? `Cambiar orden ${fieldDescription(field)} a descendente en ${languageLabel}`
              : `Desactivar orden ${fieldDescription(field)} en ${languageLabel}`

          return (
            <button
              key={field}
              type="button"
              data-active={Boolean(active)}
              onClick={() => onCycle(field, side)}
              aria-label={stateDescription}
            >
              {active ? `${priority} · ${compactLabel}` : compactLabel}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <>
      <button
        className={styles.compactTrigger}
        type="button"
        aria-label={`Ordenar ${languageLabel}`}
        onClick={() => setDialogOpen(true)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="5" r="1.7" />
          <circle cx="12" cy="12" r="1.7" />
          <circle cx="12" cy="19" r="1.7" />
        </svg>
        {activeCount > 0 && <span>{activeCount}</span>}
      </button>

      {dialogOpen && (
        <ModalDialog
          title={`Ordenar ${languageLabel}`}
          onClose={() => setDialogOpen(false)}
        >
          <div className={styles.dialogContent}>
            <p>
              Puedes combinar criterios. El número indica cuál se aplica
              primero.
            </p>
            {FIELDS.map((field) => {
              const active = activeCriterion(field)
              const priority = criterionPriority(field)
              return (
                <fieldset key={field}>
                  <legend>
                    {fieldName(field)}
                    {active && <span>Prioridad {priority}</span>}
                  </legend>
                  <div className={styles.directionGroup}>
                    <button
                      type="button"
                      data-active={!active}
                      aria-pressed={!active}
                      onClick={() => onSet(field, side, null)}
                    >
                      Sin orden
                    </button>
                    {(['ascending', 'descending'] as const).map((direction) => (
                      <button
                        key={direction}
                        type="button"
                        data-active={active?.direction === direction}
                        aria-pressed={active?.direction === direction}
                        onClick={() => onSet(field, side, direction)}
                      >
                        {directionLabel(field, direction)}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )
            })}
            <button
              className={styles.done}
              type="button"
              onClick={() => setDialogOpen(false)}
            >
              Listo
            </button>
          </div>
        </ModalDialog>
      )}
    </>
  )
}
