export interface AttributeEntry {
  key: string
  value: string
}

export interface WorkScheduleDay {
  /** 0 = Monday, 6 = Sunday */
  day: number
  openTime: string | null
  closeTime: string | null
  isClosed: boolean
}

export interface PriceTariff {
  price: number
  priceType: string
}

export interface Review {
  id: string
  text: string
  rating: number
  offerId: string
  createdAt: string
  updatedAt: string
}

export interface CreateReviewPayload {
  text: string
  rating: number
  offerId: string
}

export interface Offer {
  id: string
  slug?: string | null
  title: string
  description: string
  images?: string[]
  price?: number | null
  oldPrice?: number | null
  prices?: PriceTariff[]
  rating?: number
  reviewCount?: number
  salesCount?: number
  inStock?: boolean
  category_id?: string | null
  branchAddress?: string
  workSchedule?: WorkScheduleDay[]
  features?: string[]
  rules?: string[]
  attributes?: AttributeEntry[]
  author?: {
    id: number
    email: string
    role: string
    phone: string
    createdAt: Date
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
      attributes: AttributeEntry[]
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
  return useNuxtApp().$api<Offer[]>('/api/offer/all', { method: 'GET' })
}

export async function getProductById(id: string) {
  return useNuxtApp().$api<Offer>(`/api/offer/find-by-id/${id}`, { method: 'GET' })
}

export async function searchProducts(params: SearchProductsParams = {}) {
  const query = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )
  return useNuxtApp().$api<SearchProductsResponse>('/api/search/products', { method: 'GET', query })
}

export async function getOfferReviews(offerId: string): Promise<Review[]> {
  return useNuxtApp().$api<Review[]>(`/api/review/get-offer-reviews/${offerId}`, { method: 'GET' })
}

export async function createReview(payload: CreateReviewPayload): Promise<Review> {
  return useNuxtApp().$api<Review>('/api/review/create', {
    method: 'POST',
    body: payload,
  })
}

export async function uploadOfferImage(file: File): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const { $api } = useNuxtApp()

  return $api<{ url: string }>('/api/upload/image', {
    method: 'POST',
    body: formData,
  })
}
