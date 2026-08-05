export type CatalogSide = 'source' | 'target'
export type CatalogSortField = 'alphabetical' | 'length'
export type CatalogSortDirection = 'ascending' | 'descending'

export type CatalogSort = {
  field: CatalogSortField
  side: CatalogSide
  direction: CatalogSortDirection
} | null
