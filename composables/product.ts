export interface Offer {
  id: string
  slug?: string | null
  title: string
  description: string
  images?: string[]
  price?: number | null
  oldPrice?: number | null
  rating?: number
  salesCount?: number
  inStock?: boolean
  category_id?: string | null
  branchAddress?: string
  author?: {
    id: number,
    email: string,
    role: string,
    phone: string,
    createdAt: Date,
    updatedAt: Date
  }
}

export interface SearchProductsParams {
  q?: string
  page?: number
  limit?: number
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'popularity'
  category?: string
  brand?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  attributes?: Record<string, string | string[]>
}

export interface SearchProductsResponse {
  total: number
  page: number
  limit: number
  pages: number
  items: {
    document: {
      id: string
      title: string
      slug: string | null
      description: string
      categoryIds: string[]
      brandId: string | null
      attributes: { key: string; value: string }[]
      price: number | null
      oldPrice: number | null
      inStock: boolean
      rating: number
      salesCount: number
      createdAt: string
      images: string[]
    }
    score: number
    highlight?: {
      title?: string[]
      description?: string[]
    }
  }[]
}

export async function getAllProducts() {
  return useApiGet<Offer[]>('/api/offer/all')
}

export async function getProductById(id: string) {
  return useApiGet<Offer>(`/api/offer/find-by-id/${id}`)
}

export async function searchProducts(params: SearchProductsParams = {}) {
  const query = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )

  return useApiGet<SearchProductsResponse>('/api/search/products', { query })
}