import type { SemordnilapCatalogItem } from '@/application/dto/semordnilap-catalog'
import type { CompositeSemordnilap } from '@/domain/semordnilap'

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es')
}

export function createCompositeCatalogItem(
  semordnilap: CompositeSemordnilap,
): SemordnilapCatalogItem {
  const title = semordnilap.title ?? ''
  return {
    semordnilap,
    metadata: null,
    sourceSearchText: normalizeSearchText(
      `${title} ${semordnilap.source.text} ${semordnilap.source.normalized}`,
    ),
    targetSearchText: normalizeSearchText(
      `${title} ${semordnilap.target.text} ${semordnilap.target.normalized}`,
    ),
    legacyIds: [],
  }
}
