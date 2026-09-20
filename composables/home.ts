import type { Offer, SearchProductsResponse } from '~/composables/product'
import { findCategoryById, type CategoryNode } from '~/composables/catalog'

export interface VenueCardModel {
  url: string
  title: string
  description: string
  image: string
  price?: number | null
  rating: number
  reviewCount: number
  location: string
  category: string
  inStock?: boolean
}

export const FALLBACK_CATEGORIES = [
  { id: 'bowling', name: 'Боулинг', slug: 'bowling', path: 'bowling' },
  { id: 'pools', name: 'Бассейны', slug: 'basseyny', path: 'basseyny' },
  { id: 'football', name: 'Футбол', slug: 'futbol', path: 'futbol' },
  { id: 'tennis', name: 'Теннис', slug: 'tennis', path: 'tennis' },
  { id: 'gaming', name: 'Gaming & PC', slug: 'gaming', path: 'gaming' },
  { id: 'lounges', name: 'Лаунжи', slug: 'launzhy', path: 'launzhy' },
  { id: 'karaoke', name: 'Караоке', slug: 'karaoke', path: 'karaoke' },
  { id: 'billiards', name: 'Бильярд', slug: 'bilyard', path: 'bilyard' },
  { id: 'cinema', name: 'Кинотеатры', slug: 'kino', path: 'kino' },
  { id: 'karting', name: 'Картинг', slug: 'karting', path: 'karting' },
]

export const HOME_CITIES = [
  { name: 'Ташкент', value: 'tashkent' },
  { name: 'Самарканд', value: 'samarkand' },
  { name: 'Джизак', value: 'jizzakh' },
  { name: 'Фергана', value: 'fergana' },
  { name: 'Андижан', value: 'andijan' },
]

export function mapOfferToVenue(offer: Offer, categories: CategoryNode[] = []): VenueCardModel {
  const category = offer.category_id
    ? findCategoryById(categories, offer.category_id)
    : null

  return {
    url: `/product/${offer.slug || offer.id}`,
    title: offer.title,
    description: offer.description,
    image: offer.images?.find(Boolean) || '/1.jpg',
    price: offer.price,
    rating: offer.rating ?? 0,
    reviewCount: offer.reviewCount ?? 0,
    location: offer.branchAddress || 'Ташкент',
    category: category?.name || 'Развлечения',
    inStock: offer.inStock,
  }
}

export function mapSearchItemToVenue(
  item: SearchProductsResponse['items'][number],
  categories: CategoryNode[] = [],
  location = 'Ташкент',
): VenueCardModel {
  const category = item.document.categoryIds?.[0]
    ? findCategoryById(categories, item.document.categoryIds[0])
    : null

  return {
    url: `/product/${item.document.slug || item.document.id}`,
    title: item.document.title,
    description: item.document.description,
    image: item.document.images?.find(Boolean) || '/1.jpg',
    price: item.document.price,
    rating: item.document.rating ?? 0,
    reviewCount: 0,
    location,
    category: category?.name || 'Развлечения',
    inStock: item.document.inStock,
  }
}
