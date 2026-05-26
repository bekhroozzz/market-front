import type { Offer } from './product'

export interface Branch {
  title: string
  address: string
  latitude?: number
  longitude?: number
}

export interface GalleryImage {
  id: string
  url: string
}

export interface SellerPublicProfile {
  sellerId: number
  companyName: string | null
  aboutCompany: string | null
  phones: string[]
  branches: Branch[]
  gallery: GalleryImage[]
  offers: Offer[]
  total: number
  page: number
  limit: number
  pages: number
}

export async function getSellerProfile(sellerId: number | string, page = 1, limit = 12): Promise<SellerPublicProfile> {
  return useApiGet<SellerPublicProfile>(`/api/seller/${sellerId}`, {
    query: { page, limit },
  })
}
