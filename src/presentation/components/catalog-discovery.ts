import type { SemordnilapCatalogItem } from '@/application'

const DISCOVERY_LIMIT = 24

function stableDiscoveryValue(id: string, seed: number): number {
  let hash = 2166136261 ^ seed
  for (const character of id) {
    hash ^= character.codePointAt(0) ?? 0
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function lengthBucket(item: SemordnilapCatalogItem): number {
  const length = Array.from(item.semordnilap.source.normalized).length
  if (length <= 5) return 0
  if (length <= 10) return 1
  return 2
}

export function selectDiscoveryItems(
  items: readonly SemordnilapCatalogItem[],
  seed: number,
  limit: number = DISCOVERY_LIMIT,
): readonly SemordnilapCatalogItem[] {
  if (limit <= 0) return []
  const buckets = [[], [], []] as SemordnilapCatalogItem[][]
  for (const item of items) buckets[lengthBucket(item)]!.push(item)
  for (const bucket of buckets) {
    bucket.sort(
      (first, second) =>
        stableDiscoveryValue(first.semordnilap.id, seed) -
        stableDiscoveryValue(second.semordnilap.id, seed),
    )
  }

  const selected: SemordnilapCatalogItem[] = []
  let bucketIndex = Math.abs(seed) % buckets.length
  while (
    selected.length < Math.min(limit, items.length) &&
    buckets.some((bucket) => bucket.length > 0)
  ) {
    const bucket = buckets[bucketIndex]!
    const item = bucket.shift()
    if (item) selected.push(item)
    bucketIndex = (bucketIndex + 1) % buckets.length
  }
  return selected
}
