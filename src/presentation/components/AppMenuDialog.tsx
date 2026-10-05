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
} from '@/application'
import type { WorkspacePreferencesState } from '@/presentation/hooks/useWorkspacePreferences'

import { ModalDialog } from './ModalDialog'
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
  onClose: () => void
  onImported: () => void
  onManageTags: () => void
  onStartSelection?: () => void
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
  onClose,
  onImported,
  onManageTags,
  onStartSelection,
}: AppMenuDialogProps) {
  const [section, setSection] = useState<'data' | 'preferences'>('data')
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
    <ModalDialog title="Menú" onClose={onClose} wide>
      <nav className={styles.tabs} aria-label="Secciones del menú">
        <button
          type="button"
          data-active={section === 'data'}
          onClick={() => setSection('data')}
        >
          Datos
        </button>
        <button
          type="button"
          data-active={section === 'preferences'}
          onClick={() => setSection('preferences')}
        >
          Preferencias
        </button>
        <button
          type="button"
          onClick={() => {
            onClose()
            onManageTags()
          }}
        >
          Gestionar etiquetas
        </button>
        {onStartSelection && (
          <button
            type="button"
            onClick={() => {
              onClose()
              onStartSelection()
            }}
          >
            Seleccionar semordnilaps
          </button>
        )}
      </nav>

      {section === 'data' ? (
        <div className={styles.section}>
          <div>
            <h3>Almacenamiento local</h3>
            <p>
              La copia incluye estados, composites, borradores, etiquetas y
              preferencias. Los TSV incluidos no se duplican.
            </p>
            {summary && <Summary summary={summary} />}
          </div>

          <div className={styles.dataActions}>
            <button
              type="button"
              disabled={busy}
              onClick={() => void exportBackup()}
            >
              Exportar copia
            </button>
            <label className={styles.fileButton}>
              <span>Seleccionar copia para importar</span>
              <input
                type="file"
                accept="application/json,.json"
                disabled={busy}
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
                        <option value="use-imported">
                          Usar los importados
                        </option>
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
                    {new Date(preview.backup.exportedAt).toLocaleString(
                      'es-ES',
                    )}
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
        </div>
      ) : (
        <div className={styles.section}>
          <div>
            <h3>Recordar la vista</h3>
            <label className={styles.preference}>
              <span>
                <strong>Filtros y ordenación por dataset</strong>
                <small>
                  Recupera búsquedas, vista activa y criterios de ordenación.
                </small>
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
                <strong>Estado del área de composición</strong>
                <small>Recuerda si el área está plegada.</small>
              </span>
              <input
                type="checkbox"
                checked={preferences.preferences.rememberCompositionCollapsed}
                onChange={(event) =>
                  preferences.setRememberCompositionCollapsed(
                    event.target.checked,
                  )
                }
              />
            </label>
          </div>
          <button
            className={styles.reset}
            type="button"
            onClick={preferences.resetViewPreferences}
          >
            Restablecer preferencias de vista
          </button>
          {preferences.errorMessage && (
            <p className={styles.error} role="alert">
              {preferences.errorMessage}
            </p>
          )}
        </div>
      )}
      {message && (
        <p className={styles.message} role="status">
          {message}
        </p>
      )}
    </ModalDialog>
  )
}
