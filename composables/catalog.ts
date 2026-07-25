import type { SearchProductsParams, SearchProductsResponse } from '~/composables/product'

export interface CategoryNode {
  id: string
  name: string
  slug: string
  /** Full nested path for /catalog/{path} */
  path?: string
  description?: string | null
  parentId?: string | null
  children?: CategoryNode[]
}

export interface CatalogBreadcrumb {
  id: string
  slug: string
  name: string
  path: string
}

export interface CatalogCategoryInfo {
  id: string
  slug: string
  name: string
  description?: string | null
  path: string
  breadcrumbs: CatalogBreadcrumb[]
}

export interface CatalogResponse extends SearchProductsResponse {
  category: CatalogCategoryInfo | null
}

export type CatalogFilters = Omit<SearchProductsParams, 'q' | 'category'>

/** Attach full `path` on every node from slug chain (if API omitted it). */
export function withCategoryPaths(
  nodes: CategoryNode[] | null | undefined,
  prefix = '',
): CategoryNode[] {
  return asCategoryList(nodes).map((node) => {
    const segment = node.slug || node.path?.split('/').pop() || ''
    const path = prefix ? `${prefix}/${segment}` : segment
    return {
      ...node,
      path: path || node.path || '',
      children: node.children?.length
        ? withCategoryPaths(node.children, path)
        : node.children,
    }
  })
}

/** Build storefront URL for a category node (slug path, never bare UUID). */
export function categoryHref(
  category: Pick<CategoryNode, 'path' | 'slug' | 'id'>,
): string {
  const path = (category.path || category.slug || '').replace(/^\/+|\/+$/g, '')
  if (path) return `/catalog/${path}`
  // Last resort for legacy payloads without slug — still better than a broken link
  return category.id ? `/catalog/${category.id}` : '/catalog'
}

function asCategoryList(nodes: unknown): CategoryNode[] {
  return Array.isArray(nodes) ? nodes : []
}

/** Flatten category tree for selects / lookups. */
export function flattenCategories(
  nodes: CategoryNode[] | null | undefined,
  prefix = '',
): Array<CategoryNode & { label: string }> {
  const result: Array<CategoryNode & { label: string }> = []

  for (const node of asCategoryList(nodes)) {
    const label = prefix ? `${prefix} / ${node.name}` : node.name
    result.push({ ...node, label })
    if (node.children?.length)
      result.push(...flattenCategories(node.children, label))
  }

  return result
}

export function findCategoryById(
  categories: CategoryNode[] | null | undefined,
  id: string,
): CategoryNode | null {
  for (const cat of asCategoryList(categories)) {
    if (cat.id === id) return cat
    if (cat.children?.length) {
      const found = findCategoryById(cat.children, id)
      if (found) return found
    }
  }
  return null
}

export function findCategoryByPath(
  categories: CategoryNode[] | null | undefined,
  path: string,
): CategoryNode | null {
  const normalized = path.replace(/^\/+|\/+$/g, '').toLowerCase()
  if (!normalized) return null

  for (const cat of asCategoryList(categories)) {
    const catPath = (cat.path || cat.slug || '').toLowerCase()
    if (catPath === normalized) return cat
    if (cat.children?.length) {
      const found = findCategoryByPath(cat.children, normalized)
      if (found) return found
    }
  }
  return null
}

/** Ancestor chain from root to target (inclusive), for breadcrumbs. */
export function buildCategoryChain(
  categories: CategoryNode[] | null | undefined,
  targetId: string,
  chain: CategoryNode[] = [],
): CategoryNode[] | null {
  for (const cat of asCategoryList(categories)) {
    const current = [...chain, cat]
    if (cat.id === targetId) return current
    if (cat.children?.length) {
      const found = buildCategoryChain(cat.children, targetId, current)
      if (found) return found
    }
  }
  return null
}

export async function getCatalogCategories(): Promise<CategoryNode[]> {
  // Same tree as /catalog/categories; /category/get-all avoids route clashes with /catalog/:path
  const data = await useNuxtApp().$api<unknown>('/api/category/get-all', { method: 'GET' })
  return withCategoryPaths(Array.isArray(data) ? (data as CategoryNode[]) : [])
}

export async function browseCatalog(
  path = '',
  filters: CatalogFilters = {},
): Promise<CatalogResponse> {
  const normalized = path.replace(/^\/+|\/+$/g, '')
  const query = Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    ),
  )

  const url = normalized ? `/api/catalog/${normalized}` : '/api/catalog'

  return useNuxtApp().$api<CatalogResponse>(url, { method: 'GET', query })
}
