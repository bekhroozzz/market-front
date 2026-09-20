<script setup lang="ts">
import {
  browseCatalog,
  buildCategoryChain,
  categoryHref,
  findCategoryById,
  findCategoryByPath,
  getCatalogCategories,
  type CatalogFilters,
  type CatalogResponse,
  type CategoryNode,
} from '~/composables/catalog'
import {
  FALLBACK_CATEGORIES,
  HOME_CITIES,
  mapSearchItemToVenue,
  type VenueCardModel,
} from '~/composables/home'
import { getAllProducts } from '~/composables/product'
import { truncateMeta } from '~/composables/seo'
import { buildBreadcrumbSchema, buildCollectionPageSchema } from '~/utils/schema'
import { categoryIcon } from '~/utils/category-icon'

const UUID_RE
  = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const SORT_OPTIONS: Array<{ value: CatalogFilters['sort']; label: string }> = [
  { value: 'popularity', label: 'Сначала популярные' },
  { value: 'newest', label: 'Новые' },
  { value: 'price_asc', label: 'Сначала дешевле' },
  { value: 'price_desc', label: 'Сначала дороже' },
]

const route = useRoute()
const router = useRouter()
const menuStore = useMenuStore()
const { menuHeader } = storeToRefs(menuStore)
const selectedCity = useSelectedCity()

const categoryPath = computed(() => {
  const param = route.params.slug
  if (Array.isArray(param))
    return param.filter(Boolean).join('/')
  return String(param || '')
})

function normalizeQuery(value: unknown): string {
  if (Array.isArray(value)) return String(value[0] || '').trim()
  if (typeof value === 'string') return value.trim()
  return ''
}

async function redirectLegacyUuidIfNeeded() {
  if (!UUID_RE.test(categoryPath.value)) return

  let byId = findCategoryById(menuHeader.value, categoryPath.value)
  if (!byId && !menuHeader.value.length) {
    try {
      const tree = await getCatalogCategories()
      menuHeader.value = tree
      byId = findCategoryById(tree, categoryPath.value)
    }
    catch {
      return
    }
  }

  if (byId?.path || byId?.slug)
    await router.replace(categoryHref(byId))
}

await redirectLegacyUuidIfNeeded()

const currentCategory = computed(() =>
  findCategoryByPath(menuHeader.value as CategoryNode[], categoryPath.value),
)

const breadcrumbs = computed(() => {
  if (!currentCategory.value)
    return [] as CategoryNode[]
  return buildCategoryChain(menuHeader.value as CategoryNode[], currentCategory.value.id) ?? []
})

const parentCategory = computed(() => {
  const chain = breadcrumbs.value
  return chain.length > 1 ? chain[chain.length - 2] : null
})

const topCategories = computed<CategoryNode[]>(() => {
  const live = menuHeader.value as CategoryNode[]
  return live.length ? live : FALLBACK_CATEGORIES
})

const categoryPills = computed<CategoryNode[]>(() => {
  if (currentCategory.value?.children?.length)
    return currentCategory.value.children
  if (parentCategory.value?.children?.length)
    return parentCategory.value.children
  return topCategories.value
})

const isFilterOpen = ref(false)
const sortOpen = ref(false)
const cityOpen = ref(false)
const searchInput = ref(normalizeQuery(route.query.q))
const minRating = ref(normalizeQuery(route.query.rating) === '4.5')
const sort = ref<CatalogFilters['sort']>(
  (normalizeQuery(route.query.sort) as CatalogFilters['sort']) || 'popularity',
)
const searchFilters = ref<CatalogFilters>({})
const page = ref(1)
const accumulatedVenues = ref<VenueCardModel[]>([])
const totalCount = ref(0)
const totalPages = ref(1)
const pending = ref(false)
const pageTitle = ref('Каталог')
const facetCounts = ref<Record<string, number>>({})

const sortLabel = computed(() =>
  SORT_OPTIONS.find(item => item.value === sort.value)?.label || 'Сначала популярные',
)

function mapResult(result: CatalogResponse | null): VenueCardModel[] {
  return (result?.items || []).map(item =>
    mapSearchItemToVenue(item, menuHeader.value as CategoryNode[], selectedCity.value),
  )
}

async function fetchProducts(append = false) {
  pending.value = true
  try {
    let result: CatalogResponse | null = null
    try {
      result = await browseCatalog(categoryPath.value, {
        limit: 24,
        page: page.value,
        sort: sort.value,
        q: normalizeQuery(route.query.q) || undefined,
        ...searchFilters.value,
      })
    }
    catch {
      result = null
    }

    if (import.meta.dev && !result?.items?.length) {
      const fallback = await getAllProducts(page.value, 24)
      result = {
        items: fallback.items.map(offer => ({
          document: {
            id: offer.id,
            title: offer.title,
            slug: offer.slug || null,
            description: offer.description,
            categoryIds: offer.category_id ? [offer.category_id] : [],
            brandId: null,
            attributes: offer.attributes || [],
            price: offer.price ?? null,
            oldPrice: offer.oldPrice ?? null,
            inStock: offer.inStock ?? true,
            rating: offer.rating ?? 0,
            salesCount: offer.salesCount ?? 0,
            createdAt: '',
            images: offer.images || [],
          },
          score: 0,
        })),
        total: fallback.total,
        page: fallback.page,
        limit: fallback.limit,
        pages: fallback.pages,
        category: result?.category ?? null,
        facets: result?.facets,
      }
    }

    if (!result)
      throw new Error('catalog-unavailable')

    totalCount.value = result?.total ?? 0
    totalPages.value = result?.pages ?? 1
    pageTitle.value = result?.category?.name || currentCategory.value?.name || 'Каталог'
    facetCounts.value = Object.fromEntries(
      (result?.facets?.categories || []).map(facet => [facet.id, facet.count]),
    )

    const venues = mapResult(result)

    if (append)
      accumulatedVenues.value.push(...venues)
    else
      accumulatedVenues.value = venues
  }
  catch {
    if (!append) accumulatedVenues.value = []
    totalCount.value = 0
  }
  finally {
    pending.value = false
  }
}

await fetchProducts()

const products = computed(() => {
  if (!minRating.value) return accumulatedVenues.value
  return accumulatedVenues.value.filter(item => item.rating >= 4.5)
})

const collections = computed(() => {
  return topCategories.value.slice(0, 4).map((cat) => {
    const match = accumulatedVenues.value.find(item => item.category === cat.name && item.image)
    const count = facetCounts.value[cat.id]
    return {
      title: cat.name,
      href: categoryHref(cat),
      image: match?.image || '',
      text: cat.description || `Смотреть ${cat.name.toLowerCase()} в Ташкенте`,
      count: count ? `${count} мест` : '',
    }
  }).filter(item => item.image)
})

const categoryDescription = computed(() =>
  currentCategory.value?.description
  || `Смотрите предложения в категории «${pageTitle.value}» на LocaFun — бронирование мест для отдыха и развлечений.`,
)

const catalogCanonical = computed(() =>
  categoryPath.value ? `/catalog/${categoryPath.value}` : '/catalog',
)

const activeFilterCount = computed(() => {
  let count = 0
  if (searchFilters.value.minPrice != null) count++
  if (searchFilters.value.maxPrice != null) count++
  if (searchFilters.value.inStock) count++
  if (minRating.value) count++
  if (normalizeQuery(route.query.q)) count++
  return count
})

const hasActiveFilters = computed(() =>
  Boolean(activeFilterCount.value || route.query.page || route.query.sort),
)

useAppSeo({
  title: () => `${pageTitle.value} — каталог | LocaFun`,
  description: () => truncateMeta(categoryDescription.value),
  canonical: () => catalogCanonical.value,
  noindex: () => hasActiveFilters.value,
  jsonLd: () => [
    buildCollectionPageSchema({
      name: pageTitle.value,
      description: categoryDescription.value,
      path: catalogCanonical.value,
    }),
    buildBreadcrumbSchema(
      breadcrumbs.value.map(cat => ({ name: cat.name, path: categoryHref(cat) })),
    ),
  ],
})

interface FilterPayload {
  city?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
}

function handleFilterApply(payload: FilterPayload) {
  if (payload.category && payload.category !== categoryPath.value) {
    isFilterOpen.value = false
    void navigateTo(`/catalog/${payload.category}`)
    return
  }

  if (payload.city)
    selectedCity.value = payload.city

  searchFilters.value = {
    minPrice: payload.minPrice,
    maxPrice: payload.maxPrice,
    inStock: payload.inStock || undefined,
  }
  page.value = 1
  isFilterOpen.value = false
  fetchProducts()
}

function loadMore() {
  page.value++
  fetchProducts(true)
}

async function submitSearch() {
  const q = searchInput.value.trim()
  const query = { ...route.query } as Record<string, string | undefined>
  if (q) query.q = q
  else delete query.q
  await router.push({ path: route.path, query })
}

function toggleRating() {
  minRating.value = !minRating.value
}

function pickSort(value: CatalogFilters['sort']) {
  sort.value = value
  sortOpen.value = false
  page.value = 1
  const query = { ...route.query } as Record<string, string | undefined>
  if (value && value !== 'popularity') query.sort = value
  else delete query.sort
  void router.push({ path: route.path, query })
  fetchProducts()
}

function pickCity(name: string) {
  selectedCity.value = name
  cityOpen.value = false
}

function pillCount(cat: CategoryNode) {
  return facetCounts.value[cat.id]
}

watch(categoryPath, () => {
  page.value = 1
  searchFilters.value = {}
  fetchProducts()
})

watch(() => route.query.q, (value) => {
  searchInput.value = normalizeQuery(value)
  page.value = 1
  fetchProducts()
})
</script>

<template>
  <div class="min-h-screen bg-surface-page pb-8">
    <section class="w-full bg-surface-page pt-space-md md:pt-8 pb-space-sm md:pb-10">
      <div class="max-w-7xl mx-auto px-margin-mobile md:px-margin">
        <div class="hidden md:block max-w-3xl mb-8">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-soft-pink text-primary-pressed font-label-sm mb-3">
            <span class="w-2 h-2 rounded-full bg-primary-pressed animate-pulse" />
            Каталог впечатлений в {{ selectedCity }}
          </div>
          <h1 class="font-headline-xl font-headline text-text-primary tracking-tight mb-2">
            {{ categoryPath ? pageTitle : 'Найдите, чем заняться' }}
          </h1>
          <p class="font-body-lg text-text-secondary">
            Развлечения, спорт и отдых в одном месте. Бронируйте лучшие слоты и визиты за пару кликов.
          </p>
        </div>

        <form class="hidden md:flex w-full p-2 rounded-2xl shadow-sm items-center gap-2 bg-surface-secondary/70" @submit.prevent="submitSearch">
          <div class="flex-1 flex items-center gap-3 px-4 py-3 w-full">
            <span class="material-symbols-outlined text-text-muted text-[24px]">search</span>
            <input
              id="catalog-search"
              v-model="searchInput"
              class="w-full bg-transparent border-none outline-none font-body-md text-text-primary placeholder:text-text-muted"
              placeholder="Поиск по местам, активностям или названию заведения..."
              type="search"
            >
          </div>
          <div class="hidden md:flex items-center gap-2 px-3 py-2 bg-surface-page rounded-xl text-text-secondary font-label-md">
            <span class="material-symbols-outlined text-[18px] text-text-muted">location_on</span>
            <span>{{ selectedCity }}, везде</span>
          </div>
          <button
            class="w-auto px-8 py-3.5 rounded-xl bg-primary-container hover:bg-primary-hover active:bg-primary-pressed text-text-primary font-label-lg transition-all flex items-center justify-center gap-2 shadow-sm"
            type="submit"
          >
            <span>Найти</span>
            <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        </form>

        <form class="md:hidden relative w-full" @submit.prevent="submitSearch">
          <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-[22px] pointer-events-none">search</span>
          <input
            id="catalog-search-mobile"
            v-model="searchInput"
            class="w-full h-12 pl-12 pr-11 bg-surface-secondary text-text-primary rounded-xl font-body-sm placeholder:text-text-muted focus:bg-surface-page focus:outline-none shadow-sm"
            placeholder="Что хотите найти? (место или активность)"
            type="search"
          >
          <button
            class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-text-secondary"
            type="button"
            aria-label="Фильтры"
            @click="isFilterOpen = true"
          >
            <span class="material-symbols-outlined text-[18px]">tune</span>
          </button>
        </form>
      </div>
    </section>

    <section class="w-full bg-surface-page pb-space-sm md:pb-8">
      <div class="max-w-7xl mx-auto md:px-margin">
        <div class="flex items-center gap-2 md:gap-3 overflow-x-auto px-margin-mobile md:px-0 pb-2 scrollbar-hide">
          <NuxtLink
            to="/catalog"
            class="flex-shrink-0 flex items-center gap-2 px-4 md:px-5 py-2 md:py-3 rounded-full font-label-md shadow-sm"
            :class="!categoryPath
              ? 'bg-surface-soft-pink text-primary-pressed'
              : 'bg-surface-page text-text-primary hover:bg-surface-secondary'"
          >
            <span class="material-symbols-outlined text-[18px] md:text-[20px]">grid_view</span>
            <span>Все</span>
            <span
              v-if="!categoryPath && totalCount"
              class="hidden md:inline px-2 py-0.5 rounded-full bg-primary-container/40 text-text-primary font-label-sm"
            >
              {{ totalCount }}
            </span>
          </NuxtLink>
          <NuxtLink
            v-for="sub in categoryPills"
            :key="sub.id"
            :to="categoryHref(sub)"
            class="flex-shrink-0 flex items-center gap-2 px-3.5 md:px-5 py-2 md:py-3 rounded-full font-label-md shadow-sm"
            :class="categoryPath === (sub.path || sub.slug)
              ? 'bg-surface-soft-pink text-primary-pressed'
              : 'bg-surface-page text-text-primary hover:bg-surface-secondary'"
          >
            <span class="material-symbols-outlined text-[18px] md:text-[20px] text-text-secondary">
              {{ categoryIcon(sub.name) }}
            </span>
            <span>{{ sub.name }}</span>
            <span v-if="pillCount(sub)" class="hidden md:inline text-text-muted font-label-sm">
              {{ pillCount(sub) }}
            </span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <section class="w-full bg-surface-secondary/40 py-3 md:py-4 mb-space-md md:mb-8">
      <div class="max-w-7xl mx-auto px-margin-mobile md:px-margin flex items-center justify-between gap-3 overflow-x-auto scrollbar-hide">
        <div class="flex items-center gap-2 min-w-max">
          <button
            class="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full font-label-sm shadow-sm"
            :class="activeFilterCount ? 'bg-text-primary text-surface-page' : 'bg-surface-page text-text-primary'"
            type="button"
            @click="isFilterOpen = true"
          >
            <span class="material-symbols-outlined text-[16px]">tune</span>
            <span>Фильтры</span>
            <span
              v-if="activeFilterCount"
              class="w-5 h-5 rounded-full bg-primary-container text-text-primary text-[11px] flex items-center justify-center font-bold"
            >
              {{ activeFilterCount }}
            </span>
          </button>
          <div class="relative hidden md:block">
            <button
              class="flex items-center gap-1.5 px-4 py-2 rounded-full bg-surface-page text-text-primary font-label-sm shadow-sm"
              type="button"
              @click="cityOpen = !cityOpen"
            >
              <span class="text-text-secondary">Город:</span>
              <span class="font-bold">{{ selectedCity }}</span>
              <span class="material-symbols-outlined text-[16px] text-text-secondary">expand_more</span>
            </button>
            <div
              v-if="cityOpen"
              class="absolute left-0 mt-2 w-44 rounded-2xl bg-surface-page shadow-lg border border-border-default py-1 z-20"
            >
              <button
                v-for="city in HOME_CITIES"
                :key="city.value"
                class="w-full text-left px-4 py-2 font-label-sm hover:bg-surface-secondary"
                type="button"
                @click="pickCity(city.name)"
              >
                {{ city.name }}
              </button>
            </div>
          </div>
          <button
            class="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full font-label-sm shadow-sm"
            :class="minRating ? 'bg-surface-soft-pink text-primary-pressed' : 'bg-surface-page text-text-primary'"
            type="button"
            @click="toggleRating"
          >
            <span class="material-symbols-outlined text-[15px] text-status-warning filled">star</span>
            <span class="font-bold">Рейтинг 4.5+</span>
            <span v-if="minRating" class="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
        <div class="relative shrink-0">
          <button
            class="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-surface-page text-text-primary font-label-sm shadow-sm"
            type="button"
            @click="sortOpen = !sortOpen"
          >
            <span class="hidden md:inline text-text-secondary">Сортировка:</span>
            <span class="font-bold">{{ sortLabel }}</span>
            <span class="material-symbols-outlined text-[16px] text-text-secondary">arrow_drop_down</span>
          </button>
          <div
            v-if="sortOpen"
            class="absolute right-0 mt-2 w-52 rounded-2xl bg-surface-page shadow-lg border border-border-default py-1 z-20"
          >
            <button
              v-for="option in SORT_OPTIONS"
              :key="option.value"
              class="w-full text-left px-4 py-2 font-label-sm hover:bg-surface-secondary"
              :class="option.value === sort ? 'text-primary-pressed' : 'text-text-primary'"
              type="button"
              @click="pickSort(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <section v-if="!categoryPath && collections.length >= 2" class="hidden md:block w-full bg-surface-page py-6 mb-12">
      <div class="max-w-7xl mx-auto px-margin">
        <div class="flex items-end justify-between mb-6">
          <div>
            <span class="font-label-sm text-primary-pressed tracking-wider uppercase font-bold">Вдохновение для уикенда</span>
            <h2 class="font-headline-lg font-headline text-text-primary tracking-tight">Тематические подборки</h2>
            <p class="font-body-md text-text-secondary">Категории с живыми предложениями в {{ selectedCity }}</p>
          </div>
        </div>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-gutter">
          <NuxtLink
            v-for="item in collections"
            :key="item.href"
            :to="item.href"
            class="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-md h-80 flex flex-col justify-end p-6"
          >
            <img :src="item.image" :alt="item.title" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
            <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
            <div class="relative z-10">
              <span v-if="item.count" class="inline-block px-3 py-1 rounded-full bg-primary-container text-text-primary font-label-sm font-bold mb-2">
                {{ item.count }}
              </span>
              <h3 class="font-headline-sm font-headline text-white mb-1">{{ item.title }}</h3>
              <p class="font-body-sm text-white/80">{{ item.text }}</p>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <section class="w-full bg-surface-page pb-16">
      <div class="max-w-7xl mx-auto px-margin-mobile md:px-margin">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h2 class="font-headline-sm md:text-headline-lg font-headline text-text-primary tracking-tight">
              Популярные места
              <span class="font-body-md text-text-secondary font-normal ml-2">
                ({{ pending ? '…' : `${products.length}${totalCount > products.length ? ` из ${totalCount}` : ''}` }})
              </span>
            </h2>
            <p class="hidden md:block font-body-sm text-text-secondary mt-1">
              Доступно моментальное бронирование на сегодня и выходные
            </p>
          </div>
        </div>

        <div v-if="products.length" class="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <HomeVenueCard v-for="venue in products" :key="venue.url" :venue="venue" variant="desktop" />
        </div>
        <div v-if="products.length" class="md:hidden flex flex-col gap-space-md">
          <HomeVenueCard v-for="venue in products" :key="`m-${venue.url}`" :venue="venue" variant="mobile" />
        </div>

        <div v-else-if="!pending" class="flex flex-col items-center justify-center py-20 text-text-secondary">
          <span class="material-symbols-outlined text-[48px] mb-4 text-text-muted">search_off</span>
          <p class="font-label-lg text-text-primary">В этой категории пока нет предложений</p>
          <p class="font-body-sm mt-1">Попробуйте выбрать другую категорию или изменить фильтры</p>
        </div>

        <div v-if="pending && !products.length" class="flex justify-center py-16">
          <span class="w-10 h-10 rounded-full border-2 border-primary-container border-t-transparent animate-spin" />
        </div>

        <div v-if="products.length && page < totalPages" class="flex justify-center mt-8">
          <button
            class="px-space-xl py-space-md rounded-xl border border-border-default font-label-md"
            :disabled="pending"
            type="button"
            @click="loadMore"
          >
            {{ pending ? 'Загружаем...' : 'Загрузить ещё' }}
          </button>
        </div>
      </div>
    </section>

    <ModalTemplate v-model="isFilterOpen">
      <div class="p-4 lg:p-6 pt-10 overflow-y-auto">
        <h2 class="text-xl font-semibold mb-4">Фильтры</h2>
        <BookingFilter @apply="handleFilterApply" />
      </div>
    </ModalTemplate>
  </div>
</template>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
