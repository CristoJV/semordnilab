import type { ApplicationDependencies } from './composition/create-application-dependencies'
import { WorkspacePage } from '@/presentation/pages/WorkspacePage'

type AppProps = {
  dependencies: ApplicationDependencies
}

export function App({ dependencies }: AppProps) {
  return <WorkspacePage dependencies={dependencies} />
}
