import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'
import { createApplicationDependencies } from './composition/create-application-dependencies'
import '@/presentation/styles/global.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('No se ha encontrado el elemento raíz de la aplicación.')
}

createRoot(rootElement).render(
  <StrictMode>
    <App dependencies={createApplicationDependencies()} />
  </StrictMode>,
)
