<script setup lang="ts">
import {
  getAllProducts,
  searchProducts,
  type Offer,
  type SearchProductsResponse,
} from '~/composables/product'
import { breakpointsTailwind } from '@vueuse/core'

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

const { lg, sm } = useBreakpoints(breakpointsTailwind, { ssrWidth: 768 })
const route = useRoute()

const filters = ref<HomeFilters>({})
const isSearchFallback = ref(false)
const hasSearched = ref(false)

// --- Infinite scroll state ---
const infiniteScrollSentinel = ref<HTMLElement | null>(null)

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

// Первая страница — через useAsyncData, чтобы результат передался из SSR в клиент
// без повторного запроса при гидрации
const { data: firstPageData } = await useAsyncData('home-offers-p1', () => getAllProducts(1, 20))

const page = ref(1)
const totalPages = ref(firstPageData.value?.pages ?? 1)
const accumulatedProducts = ref<ProductCardViewModel[]>(
  (firstPageData.value?.items ?? []).map(mapOfferToCard),
)
const loadingMore = ref(false)

async function fetchNextPage() {
  if (loadingMore.value || page.value >= totalPages.value) return
  page.value++
  loadingMore.value = true
  try {
    const result = await getAllProducts(page.value, 20)
    totalPages.value = result.pages
    accumulatedProducts.value.push(...result.items.map(mapOfferToCard))
  }
  finally {
    loadingMore.value = false
  }
}

// Intersection Observer — только на клиенте, SSR не трогает
onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) void fetchNextPage()
    },
    { rootMargin: '200px' },
  )
  if (infiniteScrollSentinel.value) observer.observe(infiniteScrollSentinel.value)
  onUnmounted(() => observer.disconnect())
})

// --- Search state ---
const { data: searchData, pending: searchPending, execute: runSearch } = await useAsyncData<SearchProductsResponse | null>('home-search-products',
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
    }
    catch {
      isSearchFallback.value = true
      return null
    }
  },
  {
    default: () => null,
    immediate: false,
  },
)

function normalizeQueryValue(value: unknown): string {
  if (Array.isArray(value)) return String(value[0] || '').trim()
  if (typeof value === 'string') return value.trim()
  return ''
}

const headerSearchText = computed(() => normalizeQueryValue(route?.query?.q))

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

watch(() => route?.query?.q, () => {
  void applySearchState()
})

const foundCount = computed(() => searchData.value?.total ?? 0)

const searchCards = computed<ProductCardViewModel[]>(() => {
  if (!searchData.value) return []
  return searchData.value.items.map(item => ({
    url: `/product/${item.document.slug || item.document.id}`,
    title: item.document.title,
    description: item.document.description,
    images: item.document.images?.length
      ? item.document.images.filter(Boolean).map((src, i) => ({ src, active: i === 0 }))
      : [{ src: '/1.jpg', active: true }],
  }))
})

const displayProducts = computed<ProductCardViewModel[]>(() =>
  hasSearched.value ? searchCards.value : accumulatedProducts.value,
)

const hasMore = computed(() => !hasSearched.value && page.value < totalPages.value)

function loadMore() {
  void fetchNextPage()
}

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
    <BookingFilter class="mb-10 mx-auto px-4 lg:w-1/2" @apply="handleFiltersApply" />

    <!-- Search results header -->
    <div
      v-if="route?.query?.q?.length"
      class="px-4 lg:px-0 mx-auto w-full max-w-screen-2xl mb-4 text-sm opacity-80 flex items-center gap-3"
    >
      <span>Найдено товаров: {{ foundCount }}</span>
      <span v-if="searchPending" class="loading loading-spinner loading-sm" />
      <span v-if="isSearchFallback" class="text-warning">
        Поисковый сервис временно недоступен — применён локальный поиск.
      </span>
    </div>
    <div
      v-if="displayProducts.length"
      class="grid lg:px-0 lg:px-4 px-0 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 mx-auto gap-2 lg:gap-4"
    >
      <ProductCard
        v-for="(product, index) in displayProducts"
        :key="index"
        is-swiper-img
        v-bind="product"
        :size="lg ? 'md' : sm ? 'sm' : 'xs'"
        />
    </div>

    <div
      v-if="route?.query?.q?.length && !displayProducts?.length && !searchPending"
      class="text-center py-12 text-base-content/70"
    >
      По вашему запросу ничего не найдено. Попробуйте изменить фильтры.
    </div>

    <div v-if="hasMore" ref="infiniteScrollSentinel" class="flex justify-center mt-6">
      <button
        class="btn btn-outline btn-primary"
        :disabled="loadingMore"
        @click="loadMore"
      >
        <span v-if="loadingMore" class="loading loading-spinner loading-sm mr-2" />
        {{ loadingMore ? 'Загружаем...' : 'Загрузить ещё' }}
      </button>
    </div>
  </div>
</template>
