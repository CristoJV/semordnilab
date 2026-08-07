import type { SemordnilapCatalogItem } from '@/application'

const DISCOVERY_LIMIT = 24

export type CatalogDiscoverySession = {
  universeKey: string
  remainingIds: readonly string[]
  visibleIds: readonly string[]
}

type RandomSource = () => number

function atomicItems(
  items: readonly SemordnilapCatalogItem[],
): readonly SemordnilapCatalogItem[] {
  return items.filter(({ semordnilap }) => semordnilap.kind === 'atomic')
}

function universeKey(items: readonly SemordnilapCatalogItem[]): string {
  return items
    .map(({ semordnilap }) => semordnilap.id)
    .toSorted()
    .join('\u001f')
}

export function shuffleCatalogItems(
  items: readonly SemordnilapCatalogItem[],
  random: RandomSource = Math.random,
): readonly SemordnilapCatalogItem[] {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1))
    const boundedIndex = Math.min(Math.max(randomIndex, 0), index)
    const current = shuffled[index]!
    shuffled[index] = shuffled[boundedIndex]!
    shuffled[boundedIndex] = current
  }
  return shuffled
}

export function advanceDiscoverySession(
  items: readonly SemordnilapCatalogItem[],
  current: CatalogDiscoverySession | null,
  random: RandomSource = Math.random,
  limit: number = DISCOVERY_LIMIT,
): CatalogDiscoverySession {
  const eligible = atomicItems(items)
  const key = universeKey(eligible)
  if (limit <= 0 || eligible.length === 0) {
    return { universeKey: key, remainingIds: [], visibleIds: [] }
  }

  const canContinue =
    current?.universeKey === key && current.remainingIds.length > 0
  const bag = canContinue
    ? [...current.remainingIds]
    : shuffleCatalogItems(eligible, random).map(
        ({ semordnilap }) => semordnilap.id,
      )
  const groupSize = Math.min(limit, bag.length)

  return {
    universeKey: key,
    visibleIds: bag.slice(0, groupSize),
    remainingIds: bag.slice(groupSize),
  }
}

export function resolveDiscoveryItems(
  items: readonly SemordnilapCatalogItem[],
  session: CatalogDiscoverySession,
): readonly SemordnilapCatalogItem[] {
  const byId = new Map(items.map((item) => [item.semordnilap.id, item]))
  return session.visibleIds.flatMap((id) => {
    const item = byId.get(id)
    return item?.semordnilap.kind === 'atomic' ? [item] : []
  })
}
