import { useState, type FormEvent } from 'react'

import {
  TAG_COLORS,
  type SemordnilapTag,
  type TagColor,
  type TagId,
} from '@/application'
import type { SemordnilapTagState } from '@/presentation/hooks/useSemordnilapTags'

import { ModalDialog } from './ModalDialog'
import styles from './TagManagerDialog.module.css'

const COLOR_LABELS: Record<TagColor, string> = {
  violet: 'Violeta',
  mustard: 'Mostaza',
  terracotta: 'Terracota',
  green: 'Verde',
  blue: 'Azul',
  rose: 'Rosa',
}

function ColorSelect({
  value,
  onChange,
}: {
  value: TagColor
  onChange: (color: TagColor) => void
}) {
  return (
    <select
      value={value}
      aria-label="Color"
      onChange={(event) => onChange(event.target.value as TagColor)}
    >
      {TAG_COLORS.map((color) => (
        <option key={color} value={color}>
          {COLOR_LABELS[color]}
        </option>
      ))}
    </select>
  )
}

function TagEditor({
  tag,
  usage,
  onUpdate,
  onDelete,
}: {
  tag: SemordnilapTag
  usage: number
  onUpdate: (
    tag: SemordnilapTag,
    name: string,
    color: TagColor,
  ) => Promise<void>
  onDelete: (tagId: TagId) => Promise<void>
}) {
  const [name, setName] = useState(tag.name)
  const [color, setColor] = useState(tag.color)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const changed = name.trim() !== tag.name || color !== tag.color

  const run = async (operation: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await operation()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo guardar.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className={styles.tagRow}>
      <i data-color={color} aria-hidden="true" />
      <input
        value={name}
        maxLength={40}
        aria-label={`Nombre de ${tag.name}`}
        onChange={(event) => setName(event.target.value)}
      />
      <ColorSelect value={color} onChange={setColor} />
      <small>{usage} en esta colección</small>
      <button
        type="button"
        disabled={busy || !changed}
        onClick={() => void run(() => onUpdate(tag, name, color))}
      >
        Guardar
      </button>
      {!confirming ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => setConfirming(true)}
        >
          Eliminar
        </button>
      ) : (
        <span className={styles.confirmation}>
          <button
            type="button"
            disabled={busy}
            onClick={() => void run(() => onDelete(tag.id))}
          >
            Confirmar
          </button>
          <button type="button" onClick={() => setConfirming(false)}>
            Cancelar
          </button>
        </span>
      )}
      {error && <p role="alert">{error}</p>}
    </li>
  )
}

type TagManagerDialogProps = {
  state: SemordnilapTagState
  onClose: () => void
}

export function TagManagerDialog({ state, onClose }: TagManagerDialogProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState<TagColor>('violet')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const usage = new Map<TagId, number>()
  for (const tagIds of state.assignments.values()) {
    for (const tagId of tagIds) usage.set(tagId, (usage.get(tagId) ?? 0) + 1)
  }

  const create = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setMessage(null)
    try {
      await state.create(name, color)
      setName('')
      setMessage('Etiqueta creada.')
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'No se pudo crear la etiqueta.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <ModalDialog title="Gestionar etiquetas" onClose={onClose} wide>
      <p className={styles.intro}>
        Las etiquetas se comparten entre colecciones. Eliminarlas retira sus
        asignaciones de todas ellas, pero no modifica los semordnilaps.
      </p>

      <form className={styles.create} onSubmit={(event) => void create(event)}>
        <label>
          Nueva etiqueta
          <input
            value={name}
            maxLength={40}
            placeholder="Por ejemplo, revisar"
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <ColorSelect value={color} onChange={setColor} />
        <button type="submit" disabled={busy || !name.trim()}>
          Crear
        </button>
      </form>

      {state.tags.length === 0 ? (
        <p className={styles.empty}>Todavía no has creado etiquetas.</p>
      ) : (
        <ul className={styles.list}>
          {state.tags.map((tag) => (
            <TagEditor
              key={tag.id}
              tag={tag}
              usage={usage.get(tag.id) ?? 0}
              onUpdate={state.update}
              onDelete={state.remove}
            />
          ))}
        </ul>
      )}
      {(message || state.errorMessage) && (
        <p className={styles.message} role="status">
          {message ?? state.errorMessage}
        </p>
      )}
    </ModalDialog>
  )
}
