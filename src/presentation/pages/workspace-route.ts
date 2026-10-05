import type { WordFilterMode } from './WordFilterPage'

export type WorkspaceRoute =
  { view: 'workspace' } | { view: 'word-filters'; mode: WordFilterMode }

const WORD_FILTER_ROUTE = /^#\/words\/(pending|verified|excluded)$/u

export function parseWorkspaceHash(hash: string): WorkspaceRoute {
  const match = WORD_FILTER_ROUTE.exec(hash)
  if (!match) return { view: 'workspace' }
  return {
    view: 'word-filters',
    mode: match[1] as WordFilterMode,
  }
}

export function workspaceHashFor(route: WorkspaceRoute): string {
  return route.view === 'workspace' ? '#/' : `#/words/${route.mode}`
}
