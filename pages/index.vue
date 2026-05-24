<script setup lang="ts">
import {
  getAllProducts,
  searchProducts,
  type Offer,
  type SearchProductsResponse,
} from '~/composables/product';
import {breakpointsTailwind} from '@vueuse/core';

interface HomeFilters {
  city?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
}

interface ProductCardViewModel {
  url: string
  title: string
  description: string
  images: { src: string; active: boolean }[]
}

const { lg } = useBreakpoints(breakpointsTailwind, { ssrWidth: 768 })
const route = useRoute()

const filters = ref<HomeFilters>({})
const isSearchFallback = ref(false)
const hasSearched = ref(false)

const { data: allProducts } = await useAsyncData('home-all-products', () => getAllProducts())

const { data: searchData, pending, execute: runSearch } = await useAsyncData<SearchProductsResponse | null>('home-search-products',
  async () => {
    const queryText = [headerSearchText.value, filters.value.city?.trim()]
      .filter(Boolean)
      .join(' ')
      .trim()

    const searchQuery = {
      q: queryText || undefined,
      category: filters.value.category,
      minPrice: filters.value.minPrice,
      maxPrice: filters.value.maxPrice,
      inStock: filters.value.inStock,
      limit: 60,
      sort: 'relevance' as const,
    }

    try {
      const data = await searchProducts(searchQuery)
      isSearchFallback.value = false
      return data
    } catch {
      isSearchFallback.value = true
      return null
    }
  },
  {
    default: () => null,
    immediate: false,
  },
)


const allProductsById = computed(() => {
  return new Map((allProducts.value || []).map((product) => [product.id, product]))
})

function mapImages(images?: string[]) {
  const mapped = (images || [])
    .filter(Boolean)
    .map((src, index) => ({ src, active: index === 0 }))

  return mapped.length ? mapped : [{ src: '/1.jpg', active: true }]
}

function mapOfferToCard(offer: Offer): ProductCardViewModel {
  return {
    url: `/product/${offer.slug || offer.id}`,
    title: offer.title,
    description: offer.description,
    images: mapImages(offer.images),
  }
}

function normalizeQueryValue(value: unknown): string {
  if (Array.isArray(value))
    return String(value[0] || '').trim()
  if (typeof value === 'string')
    return value.trim()
  return ''
}

const headerSearchText = computed(() => normalizeQueryValue(route.query.q))

function matchLocalFilters(offer: Offer) {
  const query = headerSearchText.value.toLowerCase()
  const city = filters.value.city?.trim().toLowerCase()
  const minPrice = filters.value.minPrice
  const maxPrice = filters.value.maxPrice

  if (query) {
    const text = `${offer.title || ''} ${offer.description || ''}`.toLowerCase()
    if (!text.includes(query))
      return false
  }

  if (city) {
    const address = (offer.branchAddress || '').toLowerCase()
    if (!address.includes(city))
      return false
  }

  if (filters.value.category && offer.category_id !== filters.value.category)
    return false

  if (typeof minPrice === 'number' && (offer.price || 0) < minPrice)
    return false

  if (typeof maxPrice === 'number' && (offer.price || 0) > maxPrice)
    return false

  if (filters.value.inStock && !offer.inStock)
    return false

  return true
}

const fallbackProducts = computed(() => {
  return (allProducts.value || [])
    .filter(matchLocalFilters)
    .map(mapOfferToCard)
})

const hasSearchCriteria = computed(() => {
  return Boolean(
    headerSearchText.value
    || filters.value.city?.trim()
    || filters.value.category
    || typeof filters.value.minPrice === 'number'
    || typeof filters.value.maxPrice === 'number'
    || filters.value.inStock,
  )
})

async function applySearchState() {
  if (!hasSearchCriteria.value) {
    hasSearched.value = false
    searchData.value = null
    isSearchFallback.value = false
    return
  }

  hasSearched.value = true
  await runSearch()
}

watch(() => route.query.q,() => {
    void applySearchState()
  },
)

const products = computed(() => {
  if (!hasSearched.value)
    return (allProducts.value || []).map(mapOfferToCard)

  if (!searchData.value)
    return fallbackProducts.value

  return searchData.value.items.map((item) => {
    const productFromOffers = allProductsById.value.get(item.document.id)

    if (productFromOffers)
      return mapOfferToCard(productFromOffers)

    return {
      url: `/product/${item.document.slug || item.document.id}`,
      title: item.document.title,
      description: item.document.description,
      images: [{ src: '/1.jpg', active: true }],
    }
  })
})

// const recommendedProducts = computed(() => products.value.slice(0, 12))

const foundCount = computed(() => {
  if (searchData.value)
    return searchData.value.total

  return fallbackProducts.value.length
})

interface FiltersApplyPayload {
  city?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
}

function handleFiltersApply(payload: FiltersApplyPayload) {
  filters.value = { ...payload }
  void applySearchState()
}
</script>

<template>
  <div class="my-10 flex flex-col">
    <BookingFilter class="mb-10 mx-auto px-4" @apply="handleFiltersApply"/>
    <div v-if="route?.query?.q?.length" class="px-4 lg:px-0 mx-auto w-full max-w-screen-2xl mb-4 text-sm opacity-80 flex items-center gap-3">
      <span>Найдено товаров: {{ foundCount }}</span>
      <span v-if="pending" class="loading loading-spinner loading-sm"/>
      <span v-if="isSearchFallback" class="text-warning">Поисковый сервис временно недоступен — применён локальный поиск.</span>
    </div>
    <!-- <ProductFeedCards v-if="recommendedProducts.length" :products="recommendedProducts"/> -->
    <div v-if="products.length" class="grid lg:px-0 px-4  grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mx-auto gap-4">
      <ProductCard
          v-for="(product, index) in products"
          is-swiper-img
          v-bind="product"
          :size="lg ? 'md' : 'sm'"
          :key="index"
      />
    </div>
    <div v-if="route?.query?.q?.length && !products?.length" class="text-center py-12 text-base-content/70">
      По вашему запросу ничего не найдено. Попробуйте изменить фильтры.
    </div>
  </div>
</template>