import type {
  CatalogSide,
  CatalogSortDirection,
  CatalogSortField,
  CatalogSortPreference,
} from '@/application'

export type { CatalogSide, CatalogSortDirection, CatalogSortField }
export type CatalogSortCriterion = CatalogSortPreference
export type CatalogSort = readonly CatalogSortPreference[]
