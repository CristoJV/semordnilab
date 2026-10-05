import type { WordFilterMode } from './WordFilterPage'

export type WorkspaceRoute =
  | { view: 'workspace' }
  | { view: 'word-filters'; mode: WordFilterMode }
  | { view: 'tags' }

const WORD_FILTER_ROUTE = /^#\/words\/(pending|verified|excluded)$/u

export function parseWorkspaceHash(hash: string): WorkspaceRoute {
  if (hash === '#/tags') return { view: 'tags' }
  const match = WORD_FILTER_ROUTE.exec(hash)
  if (!match) return { view: 'workspace' }
  return {
    view: 'word-filters',
    mode: match[1] as WordFilterMode,
  }
}

export function workspaceHashFor(route: WorkspaceRoute): string {
  if (route.view === 'workspace') return '#/'
  if (route.view === 'tags') return '#/tags'
  return `#/words/${route.mode}`
}
