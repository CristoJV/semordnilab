import { useEffect, useState, type ChangeEvent } from 'react'

import type {
  ExportPersonalData,
  GetPersonalDataSummary,
  ImportPersonalData,
  PersonalDataFileGateway,
  PersonalDataImportOptions,
  PersonalDataImportPreview,
  PersonalDataSummary,
  PreviewPersonalDataImport,
  SemordnilapTag,
} from '@/application'
import type { WorkspacePreferencesState } from '@/presentation/hooks/useWorkspacePreferences'

import { ModalDialog } from './ModalDialog'
import { TagIconGlyph } from './TagIconGlyph'
import styles from './AppMenuDialog.module.css'

type AppMenuUseCases = {
  exportPersonalData: ExportPersonalData
  previewPersonalDataImport: PreviewPersonalDataImport
  importPersonalData: ImportPersonalData
  getPersonalDataSummary: GetPersonalDataSummary
  personalDataFileGateway: PersonalDataFileGateway
}

type AppMenuDialogProps = {
  useCases: AppMenuUseCases
  preferences: WorkspacePreferencesState
  currentView: 'workspace' | 'word-filters' | 'tags'
  tags: readonly SemordnilapTag[]
  canNavigateWordFilters: boolean
  onClose: () => void
  onImported: () => void
  onNavigateWorkspace: () => void
  onNavigateWordFilters: () => void
  onManageTags: () => void
}

const DEFAULT_IMPORT_OPTIONS: PersonalDataImportOptions = {
  mode: 'merge',
  draftConflicts: 'keep-current',
  importPreferences: true,
}

function Summary({ summary }: { summary: PersonalDataSummary }) {
  return (
    <dl className={styles.summary}>
      <div>
        <dt>Favoritos</dt>
        <dd>{summary.favorites}</dd>
      </div>
      <div>
        <dt>Descartados</dt>
        <dd>{summary.discarded}</dd>
      </div>
      <div>
        <dt>Composites</dt>
        <dd>{summary.savedComposites}</dd>
      </div>
      <div>
        <dt>Borradores</dt>
        <dd>{summary.compositionDrafts}</dd>
      </div>
      <div>
        <dt>Etiquetas</dt>
        <dd>{summary.tags}</dd>
      </div>
      <div>
        <dt>Etiquetados</dt>
        <dd>{summary.taggedSemordnilaps}</dd>
      </div>
      <div>
        <dt>Palabras filtradas</dt>
        <dd>{summary.wordFilters}</dd>
      </div>
      <div>
        <dt>Palabras verificadas</dt>
        <dd>{summary.verifiedWords}</dd>
      </div>
    </dl>
  )
}

export function AppMenuDialog({
  useCases,
  preferences,
  currentView,
  tags,
  canNavigateWordFilters,
  onClose,
  onImported,
  onNavigateWorkspace,
  onNavigateWordFilters,
  onManageTags,
}: AppMenuDialogProps) {
  const [summary, setSummary] = useState<PersonalDataSummary | null>(null)
  const [content, setContent] = useState<string | null>(null)
  const [filename, setFilename] = useState('')
  const [options, setOptions] = useState(DEFAULT_IMPORT_OPTIONS)
  const [preview, setPreview] = useState<PersonalDataImportPreview | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void useCases.getPersonalDataSummary
      .execute()
      .then((result) => {
        if (active) setSummary(result)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [useCases.getPersonalDataSummary])

  useEffect(() => {
    if (!content) return undefined
    let active = true
    const timeout = window.setTimeout(() => {
      setBusy(true)
      setMessage(null)
      void useCases.previewPersonalDataImport
        .execute(content, options)
        .then((result) => {
          if (!active) return
          setPreview(result)
          setMessage(null)
        })
        .catch((error: unknown) => {
          if (!active) return
          setPreview(null)
          setMessage(
            error instanceof Error
              ? error.message
              : 'No se ha podido validar la copia.',
          )
        })
        .finally(() => {
          if (active) setBusy(false)
        })
    }, 0)
    return () => {
      active = false
      window.clearTimeout(timeout)
    }
  }, [content, options, useCases.previewPersonalDataImport])

  const exportBackup = async () => {
    setBusy(true)
    setMessage(null)
    try {
      const result = await useCases.exportPersonalData.execute()
      useCases.personalDataFileGateway.downloadText(
        result.filename,
        result.content,
      )
      setMessage('Copia exportada correctamente.')
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'No se ha podido exportar la copia.',
      )
    } finally {
      setBusy(false)
    }
  }

  const readFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setPreview(null)
    setMessage(null)
    setFilename(file.name)
    try {
      setContent(await useCases.personalDataFileGateway.readText(file))
    } catch (error) {
      setContent(null)
      setMessage(
        error instanceof Error
          ? error.message
          : 'No se ha podido leer el archivo.',
      )
    } finally {
      event.target.value = ''
    }
  }

  const importBackup = async () => {
    if (!content || !preview) return
    setBusy(true)
    setMessage(null)
    try {
      const safetyBackup = await useCases.exportPersonalData.execute()
      useCases.personalDataFileGateway.downloadText(
        safetyBackup.filename.replace('.json', '-antes-de-importar.json'),
        safetyBackup.content,
      )
      await useCases.importPersonalData.execute(content, options)
      setMessage('Copia importada. La aplicación se actualizará ahora.')
      onImported()
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'No se ha podido importar la copia.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <ModalDialog
      title={
        <span className={styles.drawerTitle}>
          <span className={styles.drawerMark} aria-hidden="true">
            S
          </span>
          <span>SemordniLAB</span>
        </span>
      }
      accessibleLabel="Menú"
      onClose={onClose}
      drawer
    >
      <nav className={styles.navigation} aria-label="Navegación principal">
        <button
          type="button"
          data-active={currentView === 'workspace'}
          aria-current={currentView === 'workspace' ? 'page' : undefined}
          onClick={onNavigateWorkspace}
        >
          Composición
        </button>
        <button
          type="button"
          disabled={!canNavigateWordFilters}
          data-active={currentView === 'word-filters'}
          aria-current={currentView === 'word-filters' ? 'page' : undefined}
          onClick={onNavigateWordFilters}
        >
          Filtrado
        </button>
      </nav>

      <section className={styles.menuSection} aria-labelledby="menu-data-title">
        <h3 id="menu-data-title">Datos</h3>
        <p>
          Estados, composites, borradores, etiquetas y preferencias guardados
          localmente.
        </p>
        {summary && <Summary summary={summary} />}
        <div className={styles.dataActions}>
          <button
            type="button"
            disabled={busy}
            onClick={() => void exportBackup()}
          >
            Exportar
          </button>
          <label className={styles.fileButton}>
            <span>Importar</span>
            <input
              type="file"
              accept="application/json,.json"
              disabled={busy}
              aria-label="Importar copia"
              onChange={(event) => void readFile(event)}
            />
          </label>
        </div>

        {content && (
          <div className={styles.importPanel}>
            <h3>Importar {filename}</h3>
            <fieldset disabled={busy}>
              <legend>Cómo combinar la copia</legend>
              <label>
                <input
                  type="radio"
                  name="import-mode"
                  checked={options.mode === 'merge'}
                  onChange={() =>
                    setOptions((current) => ({ ...current, mode: 'merge' }))
                  }
                />
                Combinar con los datos actuales
              </label>
              <label>
                <input
                  type="radio"
                  name="import-mode"
                  checked={options.mode === 'replace'}
                  onChange={() =>
                    setOptions((current) => ({ ...current, mode: 'replace' }))
                  }
                />
                Sustituir todos los datos actuales
              </label>
              {preview &&
                preview.draftConflicts > 0 &&
                options.mode === 'merge' && (
                  <label>
                    Borradores con conflicto
                    <select
                      value={options.draftConflicts}
                      onChange={(event) =>
                        setOptions((current) => ({
                          ...current,
                          draftConflicts: event.target.value as
                            'keep-current' | 'use-imported',
                        }))
                      }
                    >
                      <option value="keep-current">
                        Conservar los actuales
                      </option>
                      <option value="use-imported">Usar los importados</option>
                    </select>
                  </label>
                )}
              <label>
                <input
                  type="checkbox"
                  checked={options.importPreferences}
                  onChange={(event) =>
                    setOptions((current) => ({
                      ...current,
                      importPreferences: event.target.checked,
                    }))
                  }
                />
                Importar también las preferencias
              </label>
            </fieldset>
            {preview && (
              <>
                <p className={styles.previewDate}>
                  Copia del{' '}
                  {new Date(preview.backup.exportedAt).toLocaleString('es-ES')}
                </p>
                <h4>Contenido de la copia</h4>
                <Summary summary={preview.imported} />
                <h4>Resultado previsto</h4>
                <Summary summary={preview.resulting} />
                {(preview.duplicateComposites > 0 ||
                  preview.draftConflicts > 0) && (
                  <p>
                    {preview.duplicateComposites} composites ya existentes y{' '}
                    {preview.draftConflicts} borradores con conflicto.
                  </p>
                )}
                <button
                  className={styles.importButton}
                  type="button"
                  disabled={busy}
                  onClick={() => void importBackup()}
                >
                  Confirmar importación
                </button>
              </>
            )}
            {busy && !preview && <p role="status">Validando copia...</p>}
          </div>
        )}
      </section>

      <section
        className={styles.menuSection}
        aria-labelledby="menu-preferences-title"
      >
        <h3 id="menu-preferences-title">Preferencias</h3>
        <label className={styles.preference}>
          <span>
            <strong>Filtros y ordenación por dataset</strong>
            <small>Recupera la vista de cada colección.</small>
          </span>
          <input
            type="checkbox"
            checked={preferences.preferences.rememberCatalogView}
            onChange={(event) =>
              preferences.setRememberCatalogView(event.target.checked)
            }
          />
        </label>
        <label className={styles.preference}>
          <span>
            <strong>Estado de composición</strong>
            <small>Recuerda si el área está plegada.</small>
          </span>
          <input
            type="checkbox"
            checked={preferences.preferences.rememberCompositionCollapsed}
            onChange={(event) =>
              preferences.setRememberCompositionCollapsed(event.target.checked)
            }
          />
        </label>
        <button
          className={styles.reset}
          type="button"
          onClick={preferences.resetViewPreferences}
        >
          Restablecer preferencias
        </button>
        {preferences.errorMessage && (
          <p className={styles.error} role="alert">
            {preferences.errorMessage}
          </p>
        )}
      </section>

      <section className={styles.menuSection} aria-labelledby="menu-tags-title">
        <div className={styles.sectionHeading}>
          <h3 id="menu-tags-title">Etiquetas</h3>
          <button type="button" onClick={onManageTags}>
            Gestionar
          </button>
        </div>
        {tags.length === 0 ? (
          <p>Todavía no hay etiquetas.</p>
        ) : (
          <ul className={styles.tagList}>
            {tags.map((tag) => (
              <li key={tag.id}>
                <TagIconGlyph icon={tag.icon} color={tag.color} />
                <span>{tag.name}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.menuSection} aria-label="About">
        <a
          className={styles.aboutLink}
          href="https://github.com/CristoJV/semordnilab"
          target="_blank"
          rel="noopener noreferrer"
        >
          About
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14 5h5v5M19 5l-8 8M18 13v6H5V6h6" />
          </svg>
        </a>
      </section>

      {message && (
        <p className={styles.message} role="status">
          {message}
        </p>
      )}
    </ModalDialog>
  )
}
