import type {
  CatalogSide,
  CatalogSortField,
  CatalogSortPreference,
} from '@/application'

export type { CatalogSide, CatalogSortField }
export type CatalogSortCriterion = CatalogSortPreference
export type CatalogSort = readonly CatalogSortPreference[]
