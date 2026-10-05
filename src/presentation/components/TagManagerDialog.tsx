import { useState, type FormEvent } from 'react'

import {
  TAG_COLORS,
  TAG_ICONS,
  type SemordnilapTag,
  type TagColor,
  type TagIcon,
  type TagId,
} from '@/application'
import type { SemordnilapTagState } from '@/presentation/hooks/useSemordnilapTags'

import { TagIconGlyph } from './TagIconGlyph'
import styles from './TagManagerDialog.module.css'

const COLOR_LABELS: Record<TagColor, string> = {
  violet: 'Violeta',
  mustard: 'Mostaza',
  terracotta: 'Terracota',
  green: 'Verde',
  blue: 'Azul',
  rose: 'Rosa',
}

const ICON_LABELS: Record<TagIcon, string> = {
  tag: 'Etiqueta',
  star: 'Estrella',
  heart: 'Corazón',
  bookmark: 'Marcador',
  flag: 'Bandera',
  sparkles: 'Destellos',
  lightbulb: 'Idea',
  book: 'Libro',
  person: 'Persona',
  place: 'Lugar',
  language: 'Idioma',
  puzzle: 'Pieza',
}

type Appearance = {
  color: TagColor
  icon: TagIcon
}

function AppearancePicker({
  value,
  onChange,
}: {
  value: Appearance
  onChange: (appearance: Appearance) => void
}) {
  return (
    <div className={styles.appearancePicker}>
      <fieldset>
        <legend>Color</legend>
        <div className={styles.colorGrid}>
          {TAG_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={styles.colorChoice}
              data-color={color}
              aria-label={COLOR_LABELS[color]}
              aria-pressed={value.color === color}
              title={COLOR_LABELS[color]}
              onClick={() => onChange({ ...value, color })}
            >
              <span />
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Icono</legend>
        <div className={styles.iconGrid}>
          {TAG_ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              data-selected={value.icon === icon}
              aria-label={ICON_LABELS[icon]}
              aria-pressed={value.icon === icon}
              title={ICON_LABELS[icon]}
              onClick={() => onChange({ ...value, icon })}
            >
              <TagIconGlyph icon={icon} color={value.color} />
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  )
}

function AppearanceEditor({
  tag,
  onSave,
  onCancel,
}: {
  tag?: SemordnilapTag
  onSave: (name: string, color: TagColor, icon: TagIcon) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(tag?.name ?? '')
  const [appearance, setAppearance] = useState<Appearance>({
    color: tag?.color ?? 'violet',
    icon: tag?.icon ?? 'tag',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await onSave(name, appearance.color, appearance.icon)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo guardar.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className={styles.editor} onSubmit={(event) => void save(event)}>
      <div className={styles.editorHeading}>
        <TagIconGlyph
          className={styles.preview}
          icon={appearance.icon}
          color={appearance.color}
        />
        <div>
          <strong>{tag ? 'Editar etiqueta' : 'Nueva etiqueta'}</strong>
          <span>
            Combina un icono y un color para reconocerla de un vistazo.
          </span>
        </div>
      </div>
      <label className={styles.nameField}>
        Nombre
        <input
          autoFocus
          value={name}
          maxLength={40}
          placeholder="Por ejemplo, revisar"
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <AppearancePicker value={appearance} onChange={setAppearance} />
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.editorActions}>
        <button type="button" disabled={busy} onClick={onCancel}>
          Volver
        </button>
        <button type="submit" disabled={busy || !name.trim()}>
          {tag ? 'Aplicar cambios' : 'Crear etiqueta'}
        </button>
      </div>
    </form>
  )
}

function TagRow({
  tag,
  usage,
  onEdit,
  onDelete,
}: {
  tag: SemordnilapTag
  usage: number
  onEdit: () => void
  onDelete: (tagId: TagId) => Promise<void>
}) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remove = async () => {
    setBusy(true)
    setError(null)
    try {
      await onDelete(tag.id)
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'No se pudo eliminar.',
      )
      setBusy(false)
    }
  }

  return (
    <li className={styles.tagRow}>
      <TagIconGlyph
        className={styles.rowIcon}
        icon={tag.icon}
        color={tag.color}
      />
      <span className={styles.tagName}>
        <strong>{tag.name}</strong>
        <small>{usage} en esta colección</small>
      </span>
      <button type="button" disabled={busy} onClick={onEdit}>
        Editar
      </button>
      {confirming ? (
        <span className={styles.confirmation}>
          <button type="button" disabled={busy} onClick={() => void remove()}>
            Confirmar
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirming(false)}
          >
            Cancelar
          </button>
        </span>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => setConfirming(true)}
        >
          Eliminar
        </button>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </li>
  )
}

type TagManagerPageProps = {
  state: SemordnilapTagState
}

export function TagManagerPage({ state }: TagManagerPageProps) {
  const [editing, setEditing] = useState<SemordnilapTag | 'new' | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const usage = new Map<TagId, number>()
  for (const tagIds of state.assignments.values()) {
    for (const tagId of tagIds) usage.set(tagId, (usage.get(tagId) ?? 0) + 1)
  }

  const complete = (messageText: string) => {
    setEditing(null)
    setMessage(messageText)
  }

  return (
    <main className={styles.page} aria-labelledby="tag-manager-title">
      <header className={styles.pageHeading}>
        <div>
          <p>Organización personal</p>
          <h1 id="tag-manager-title">Gestionar etiquetas</h1>
        </div>
      </header>
      <div className={styles.content}>
        {editing ? (
          <AppearanceEditor
            key={editing === 'new' ? 'new' : editing.id}
            tag={editing === 'new' ? undefined : editing}
            onCancel={() => setEditing(null)}
            onSave={async (name, color, icon) => {
              if (editing === 'new') {
                await state.create(name, color, icon)
                complete('Etiqueta creada.')
              } else {
                await state.update(editing, name, color, icon)
                complete('Etiqueta actualizada.')
              }
            }}
          />
        ) : (
          <>
            <div className={styles.overviewHeading}>
              <p className={styles.intro}>
                Las etiquetas se comparten entre colecciones. Eliminarlas retira
                sus asignaciones, pero no modifica los semordnilaps.
              </p>
              <button type="button" onClick={() => setEditing('new')}>
                Nueva etiqueta
              </button>
            </div>
            {state.tags.length === 0 ? (
              <p className={styles.empty}>Todavía no has creado etiquetas.</p>
            ) : (
              <ul className={styles.list}>
                {state.tags.map((tag) => (
                  <TagRow
                    key={tag.id}
                    tag={tag}
                    usage={usage.get(tag.id) ?? 0}
                    onEdit={() => setEditing(tag)}
                    onDelete={state.remove}
                  />
                ))}
              </ul>
            )}
          </>
        )}
        {(message || state.errorMessage) && (
          <p className={styles.message} role="status">
            {message ?? state.errorMessage}
          </p>
        )}
      </div>
    </main>
  )
}
