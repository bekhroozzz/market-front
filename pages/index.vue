<script setup lang="ts">
import {
  getAllProducts,
  searchProducts,
  type Offer,
  type SearchProductsResponse,
} from '~/composables/product'
import { categoryHref, flattenCategories } from '~/composables/catalog'
import { FALLBACK_CATEGORIES, mapOfferToVenue, mapSearchItemToVenue, type VenueCardModel } from '~/composables/home'
import type { HomeSearchPayload } from '~/components/Home/SearchDock.vue'
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE } from '~/composables/seo'
import { categoryIcon } from '~/utils/category-icon'

interface HomeFilters {
  city?: string
  category?: string
}

const route = useRoute()
const router = useRouter()
const menuStore = useMenuStore()
const { menuHeader } = storeToRefs(menuStore)
const selectedCity = useSelectedCity()

useAppSeo({
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  canonical: '/',
  noindex: () => Boolean(route.query.q),
})

const filters = ref<HomeFilters>({})
const isSearchFallback = ref(false)
const hasSearched = ref(false)
const venueFilter = ref<'all' | 'available' | 'rated'>('all')
const infiniteScrollSentinel = ref<HTMLElement | null>(null)

const categoryOptions = computed(() => {
  const live = flattenCategories(menuHeader.value)
    .filter(cat => cat.path || cat.slug)
    .map(cat => ({
      name: cat.label,
      value: cat.path || cat.slug,
    }))
  if (live.length) return live
  return FALLBACK_CATEGORIES.map(cat => ({ name: cat.name, value: cat.path || cat.slug }))
})

const visibleCategories = computed(() => {
  const live = menuHeader.value.slice(0, 10)
  return live.length ? live : FALLBACK_CATEGORIES
})
const catalogHome = computed(() => '/catalog')

function mapOffer(offer: Offer): VenueCardModel {
  return mapOfferToVenue(offer, menuHeader.value)
}

const { data: firstPageData } = await useAsyncData('home-offers-p1', () => getAllProducts(1, 20))

const page = ref(1)
const totalPages = ref(firstPageData.value?.pages ?? 1)
const accumulatedVenues = ref<VenueCardModel[]>(
  (firstPageData.value?.items ?? []).map(mapOffer),
)
const loadingMore = ref(false)

async function fetchNextPage() {
  if (loadingMore.value || page.value >= totalPages.value) return
  page.value++
  loadingMore.value = true
  try {
    const result = await getAllProducts(page.value, 20)
    totalPages.value = result.pages
    accumulatedVenues.value.push(...result.items.map(mapOffer))
  }
  finally {
    loadingMore.value = false
  }
}

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) void fetchNextPage()
    },
    { rootMargin: '200px' },
  )
  if (infiniteScrollSentinel.value) observer.observe(infiniteScrollSentinel.value)
  onUnmounted(() => observer.disconnect())
  void applySearchState()
})

function normalizeQueryValue(value: unknown): string {
  if (Array.isArray(value)) return String(value[0] || '').trim()
  if (typeof value === 'string') return value.trim()
  return ''
}

const headerSearchText = computed(() => normalizeQueryValue(route.query.q))

const { data: searchData, pending: searchPending, execute: runSearch } = await useAsyncData<SearchProductsResponse | null>(
  'home-search-products',
  async () => {
    const queryText = [headerSearchText.value, filters.value.city?.trim()]
      .filter(Boolean)
      .join(' ')
      .trim()

    try {
      const data = await searchProducts({
        q: queryText || undefined,
        category: filters.value.category,
        limit: 60,
        sort: 'relevance',
      })
      isSearchFallback.value = false
      return data
    }
    catch {
      isSearchFallback.value = true
      return null
    }
  },
  { default: () => null, immediate: false },
)

const hasSearchCriteria = computed(() =>
  Boolean(headerSearchText.value || filters.value.category),
)

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

watch(() => route.query.q, () => {
  void applySearchState()
})

const searchVenues = computed<VenueCardModel[]>(() => {
  if (!searchData.value) return []
  return searchData.value.items.map(item =>
    mapSearchItemToVenue(item, menuHeader.value, filters.value.city || selectedCity.value),
  )
})

const displayVenues = computed(() => {
  const list = hasSearched.value ? searchVenues.value : accumulatedVenues.value
  if (venueFilter.value === 'available') return list.filter(item => item.inStock !== false)
  if (venueFilter.value === 'rated') return list.filter(item => item.rating >= 4.5)
  return list
})

const popularVenues = computed(() => displayVenues.value.slice(0, 4))
const recommendedVenues = computed(() => displayVenues.value.slice(4, 7))
const foundCount = computed(() => searchData.value?.total ?? displayVenues.value.length)
const hasMore = computed(() => !hasSearched.value && page.value < totalPages.value)
const venueCountLabel = computed(() => {
  const total = firstPageData.value?.total || displayVenues.value.length
  return total > 0 ? `${total}+` : '340+'
})

const collections = computed(() => [
  {
    title: 'Где отметить день рождения',
    text: 'Локации с готовыми пакетами, караоке и фуршетом под ключ',
    count: '18 площадок',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCjsApYDU0nF3UWrFWG9b3QXmycVK4NXqR7ARwBvsAILLZsZu_-M8Rcwb7W8ybChPCdqIZeOmYXb9ZH1DUNya33eqIb0doxU-jd0ZFNOJOHD7UOnEveGEcGHHaIcJ9ymRzlPUOBrzQu1zkNqMcXNGC-X1mgR1vKTr3ArTUwLfrB1oSdjDAbRW4xJc_WoBYZ9ubsAji1EwT-11-KXHLCDXnLWLUlF6cBfJJmyhHMcewnsKq0b-cRL-V01Q',
    href: catalogHome.value,
  },
  {
    title: 'Ночные клубы и караоке',
    text: 'Лучший звук в городе, топовые DJ-сеты и приватные комнаты',
    count: '24 локации',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlyIAxITa6h_58aKRXpNAaMMJ9jAaRNVnioGwrnQpiS_11uVdrvP7Aby0Xl_5gl9INPHwJHx8NbjwYvWWiQYto8qVC1u-Mi3fKyTQI2qtXAZqmy_9xMKEjB7KZ0GecfWp8dG6A6glFocDYe2stv7ZXT-PErjA3aeRV-hi_R2JvIoHooQufmRV31sPJOMg6z1-UDpWopesoBliNPDDU81INhviRZXZgvSxG41y1bDjWVXsQL1sSsScXHg',
    href: catalogHome.value,
  },
  {
    title: 'Семейный уикенд с детьми',
    text: 'Безопасные батутные парки, детские дорожки боулинга и квесты',
    count: '15 центров',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6AjqpKnQU88Lwy9Ah1NEgmPx7KzOi8J3_WE_PdpE4ecN8PAK0D418sX-PS3e8quj42mbCJs7zsyGBJWhoRwPJFf7vfDBItKKMbMRKzwHcAXWfBG1QiE8-7HNcddmI58NcFf31RATzyZ230_okKFGFBXnL9egZpJ_ACNP_7PJk-tWkudD9dJ7ZJk2uppuLf_DLwqQPUe9vtnPgABRUjYncqk2f4Pu2ixFDwDa7g_8tyJt8osfXqcODyA',
    href: catalogHome.value,
  },
])

const quickPicks = computed(() =>
  visibleCategories.value.slice(0, 4).map(cat => cat.name),
)

async function handleSearch(payload: HomeSearchPayload) {
  filters.value = { ...payload }
  if (payload.city) selectedCity.value = payload.city

  if (!payload.category && !headerSearchText.value) {
    document.getElementById('venues')?.scrollIntoView({ behavior: 'smooth' })
    return
  }

  const query = { ...route.query } as Record<string, string>
  if (headerSearchText.value) query.q = headerSearchText.value
  await router.push({ path: '/', query })
  await applySearchState()
}

function handleQuickPick(name: string) {
  const match = categoryOptions.value.find(item => item.name.includes(name) || name.includes(item.name))
  filters.value = { ...filters.value, category: match?.value }
  void applySearchState()
}

function handleCategoryClick(path?: string, slug?: string) {
  const href = categoryHref({ path, slug, id: '' })
  void navigateTo(href)
}

function loadMore() {
  void fetchNextPage()
}
</script>

<template>
  <div>
    <main class="w-full bg-surface-page">
      <section class="w-full bg-surface-page pb-space-xl md:pb-space-3xl">
        <div class="max-w-[1440px] mx-auto px-margin-mobile md:px-margin">
          <div class="pt-space-md md:pt-space-xl pb-space-sm md:pb-space-2xl">
            <div class="inline-flex items-center gap-space-xs px-space-md py-1 rounded-full bg-surface-soft-pink text-primary-pressed font-label-sm mb-space-md md:mb-space-lg">
              <span class="w-2 h-2 rounded-full bg-primary-pressed animate-pulse" />
              <span>Более {{ venueCountLabel }} площадок готовы к брони</span>
            </div>
            <h1 class="font-headline-lg-mobile md:text-headline-xl font-headline text-text-primary tracking-tight mb-space-sm">
              Чем займёмся сегодня?
            </h1>
            <p class="font-body-md md:text-body-lg text-text-secondary max-w-xl mb-space-lg md:mb-space-2xl">
              Найдите места для отдыха, спорта и развлечений рядом с вами. Мгновенное подтверждение без долгих звонков и ожидания.
            </p>
            <HomeSearchDock
              :categories="categoryOptions"
              :city="selectedCity"
              :category="filters.category"
              @apply="handleSearch"
            />
            <div class="hidden md:flex flex-wrap items-center gap-space-xs mt-space-lg">
              <span class="font-label-sm text-text-muted mr-1">Быстрый выбор:</span>
              <button
                v-for="pick in quickPicks"
                :key="pick"
                class="px-space-md py-1 rounded-full bg-surface-secondary hover:bg-surface-soft-pink text-text-primary font-label-sm"
                type="button"
                @click="handleQuickPick(pick)"
              >
                {{ pick }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section v-if="hasSearched" class="w-full bg-surface-page pb-space-2xl">
        <div class="max-w-[1440px] mx-auto px-margin-mobile md:px-margin">
          <div class="flex items-center gap-3 mb-space-md font-body-sm text-text-secondary">
            <span>Найдено: {{ foundCount }}</span>
            <span v-if="searchPending" class="loading loading-spinner loading-sm" />
            <span v-if="isSearchFallback" class="text-status-warning">Поиск временно недоступен</span>
          </div>
          <div v-if="displayVenues.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
            <HomeVenueCard
              v-for="venue in displayVenues"
              :key="venue.url"
              :venue="venue"
            />
          </div>
          <p v-else-if="!searchPending" class="text-center py-12 text-text-secondary">
            По вашему запросу ничего не найдено. Попробуйте изменить фильтры.
          </p>
        </div>
      </section>

      <section v-if="!hasSearched" class="w-full bg-surface-secondary py-space-xl md:py-space-3xl">
        <div class="max-w-[1440px] mx-auto px-margin-mobile md:px-margin">
          <div class="flex items-end justify-between mb-space-md md:mb-space-2xl">
            <div>
              <span class="hidden md:block font-label-sm text-primary-pressed font-bold uppercase tracking-wider">Каталог развлечений</span>
              <h2 class="font-headline-sm md:text-headline-lg font-headline text-text-primary tracking-tight">
                Популярные категории
              </h2>
            </div>
            <NuxtLink :to="catalogHome" class="font-label-md text-primary-pressed hover:underline">
              Смотреть все
            </NuxtLink>
          </div>

          <div class="hidden md:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-space-md">
            <NuxtLink
              v-for="category in visibleCategories"
              :key="category.id"
              :to="categoryHref(category)"
              class="group bg-surface-page rounded-2xl p-space-lg flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all"
            >
              <div class="w-14 h-14 rounded-2xl bg-surface-soft-pink flex items-center justify-center text-primary-pressed mb-space-md group-hover:scale-110 transition-transform">
                <span class="material-symbols-outlined text-[30px]">{{ categoryIcon(category.name) }}</span>
              </div>
              <span class="font-label-lg text-text-primary group-hover:text-primary-pressed">{{ category.name }}</span>
            </NuxtLink>
          </div>

          <div class="md:hidden flex gap-2.5 overflow-x-auto pb-2 snap-x">
            <button
              v-for="category in visibleCategories"
              :key="category.id"
              class="snap-start shrink-0 flex flex-col items-center justify-center gap-1.5 w-20 h-24 rounded-xl bg-surface-secondary text-text-primary shadow-sm"
              type="button"
              @click="handleCategoryClick(category.path, category.slug)"
            >
              <div class="w-10 h-10 rounded-full bg-surface-page flex items-center justify-center">
                <span class="material-symbols-outlined text-[22px]">{{ categoryIcon(category.name) }}</span>
              </div>
              <span class="font-label-sm truncate w-full text-center px-1">{{ category.name }}</span>
            </button>
          </div>
        </div>
      </section>

      <section v-if="!hasSearched" class="w-full bg-surface-page py-space-xl md:py-space-3xl">
        <div class="max-w-[1440px] mx-auto px-margin-mobile md:px-margin">
          <div class="flex flex-col md:flex-row md:items-end justify-between mb-space-md md:mb-space-2xl gap-space-sm">
            <div>
              <span class="hidden md:block font-label-sm text-primary-pressed font-bold uppercase tracking-wider">Рядом с вами</span>
              <h2 id="venues" class="font-headline-sm md:text-headline-lg font-headline text-text-primary tracking-tight">
                Популярно рядом с вами
              </h2>
            </div>
            <div class="flex items-center gap-space-xs overflow-x-auto pb-2 md:pb-0">
              <button
                class="px-space-md py-space-xs rounded-full font-label-md whitespace-nowrap"
                :class="venueFilter === 'all' ? 'bg-surface-soft-pink text-primary-pressed font-bold' : 'bg-surface-secondary text-text-primary'"
                type="button"
                @click="venueFilter = 'all'"
              >
                Все площадки
              </button>
              <button
                class="px-space-md py-space-xs rounded-full font-label-md whitespace-nowrap"
                :class="venueFilter === 'available' ? 'bg-surface-soft-pink text-primary-pressed font-bold' : 'bg-surface-secondary text-text-primary'"
                type="button"
                @click="venueFilter = 'available'"
              >
                Свободно сегодня
              </button>
              <button
                class="px-space-md py-space-xs rounded-full font-label-md whitespace-nowrap"
                :class="venueFilter === 'rated' ? 'bg-surface-soft-pink text-primary-pressed font-bold' : 'bg-surface-secondary text-text-primary'"
                type="button"
                @click="venueFilter = 'rated'"
              >
                Топ рейтинг
              </button>
            </div>
          </div>

          <div class="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
            <HomeVenueCard v-for="venue in popularVenues" :key="venue.url" :venue="venue" variant="desktop" />
          </div>
          <div class="md:hidden flex flex-col gap-space-md">
            <HomeVenueCard v-for="venue in popularVenues" :key="`m-${venue.url}`" :venue="venue" variant="mobile" />
          </div>
        </div>
      </section>

      <section v-if="!hasSearched && recommendedVenues.length" class="w-full bg-surface-secondary py-space-xl md:py-space-3xl">
        <div class="max-w-[1440px] mx-auto px-margin-mobile md:px-margin">
          <div class="mb-space-md md:mb-space-2xl">
            <span class="hidden md:block font-label-sm text-primary-pressed font-bold uppercase tracking-wider">Персонально</span>
            <h2 class="font-headline-sm md:text-headline-lg font-headline text-text-primary">Рекомендуем вам</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            <NuxtLink
              v-for="venue in recommendedVenues"
              :key="venue.url"
              :to="venue.url"
              class="bg-surface-page rounded-3xl p-space-lg flex flex-col justify-between shadow-sm hover:shadow-md"
            >
              <div>
                <div class="relative w-full aspect-[16/10] rounded-2xl overflow-hidden mb-space-md bg-surface-secondary">
                  <img :src="venue.image" :alt="venue.title" class="w-full h-full object-cover" loading="lazy">
                </div>
                <h3 class="font-headline-sm font-headline text-text-primary">{{ venue.title }}</h3>
                <p class="font-body-sm text-text-secondary mt-1 line-clamp-2">{{ venue.description }}</p>
              </div>
              <div class="pt-space-md mt-space-md flex items-center justify-between">
                <span class="font-label-md text-text-primary font-bold">{{ formatFromPrice(venue.price) }}</span>
                <span class="font-label-md text-primary-pressed flex items-center gap-1">
                  Смотреть слоты
                  <span class="material-symbols-outlined text-[16px]">chevron_right</span>
                </span>
              </div>
            </NuxtLink>
          </div>
        </div>
      </section>

      <section v-if="!hasSearched" class="w-full bg-surface-page py-space-xl md:py-space-3xl">
        <div class="max-w-[1440px] mx-auto px-margin-mobile md:px-margin">
          <div class="mb-space-md md:mb-space-2xl">
            <span class="hidden md:block font-label-sm text-primary-pressed font-bold uppercase tracking-wider">Вдохновение для планов</span>
            <h2 class="font-headline-sm md:text-headline-lg font-headline text-text-primary">Тематические подборки</h2>
          </div>
          <div class="hidden lg:grid grid-cols-3 gap-gutter">
            <NuxtLink
              v-for="item in collections"
              :key="item.title"
              :to="item.href"
              class="group relative rounded-3xl overflow-hidden aspect-[4/5] flex flex-col justify-end p-space-xl shadow-md"
            >
              <img :src="item.image" :alt="item.title" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
              <div class="absolute inset-0 bg-gradient-to-t from-text-primary via-text-primary/40 to-transparent" />
              <div class="relative z-10 text-on-primary">
                <span class="inline-block px-space-md py-1 rounded-full bg-surface-page/20 font-label-sm mb-space-sm">{{ item.count }}</span>
                <h3 class="font-headline-md font-headline leading-tight">{{ item.title }}</h3>
                <p class="font-body-sm text-on-primary/80 mt-space-xs">{{ item.text }}</p>
              </div>
            </NuxtLink>
          </div>
          <div class="lg:hidden flex gap-3 overflow-x-auto pb-3 snap-x">
            <NuxtLink
              v-for="item in collections"
              :key="`m-${item.title}`"
              :to="item.href"
              class="snap-start shrink-0 w-[260px] rounded-xl overflow-hidden shadow-md relative"
            >
              <div class="relative w-full h-36">
                <img :src="item.image" :alt="item.title" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-gradient-to-t from-text-primary/90 to-transparent" />
                <div class="absolute bottom-3 left-3 right-3 text-surface-page">
                  <h3 class="font-label-lg font-bold leading-snug">{{ item.title }}</h3>
                  <p class="font-body-sm text-surface-page/80 text-[12px]">{{ item.text }}</p>
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </section>

      <section v-if="!hasSearched" class="hidden md:block w-full bg-surface-secondary py-space-3xl">
        <div class="max-w-[1440px] mx-auto px-margin">
          <div class="bg-surface-page rounded-3xl p-space-2xl shadow-sm flex flex-col lg:flex-row items-center justify-between gap-space-2xl">
            <div class="lg:w-1/2">
              <span class="font-label-sm text-primary-pressed font-bold uppercase tracking-wider">Интерактивная карта</span>
              <h2 class="font-headline-lg font-headline tracking-tight mt-1 mb-space-md">Ищите развлечения на карте города</h2>
              <p class="font-body-md text-text-secondary mb-space-xl">
                Смотрите свободные слоты и выбирайте площадки рядом с вами.
              </p>
              <NuxtLink
                :to="catalogHome"
                class="inline-flex bg-text-primary text-on-primary font-label-lg px-space-xl py-space-md rounded-xl items-center gap-space-xs"
              >
                <span class="material-symbols-outlined text-[20px]">map</span>
                Открыть каталог
              </NuxtLink>
            </div>
            <div class="lg:w-1/2 w-full h-80 rounded-2xl bg-surface-variant flex items-center justify-center">
              <div class="bg-surface-page/95 px-space-lg py-space-md rounded-2xl shadow-lg flex items-center gap-space-md">
                <div class="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center">
                  <span class="material-symbols-outlined">explore</span>
                </div>
                <div>
                  <div class="font-headline-sm font-bold">{{ selectedCity }} онлайн</div>
                  <div class="font-body-sm text-text-secondary">{{ venueCountLabel }} заведений в каталоге</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section v-if="!hasSearched" class="w-full bg-surface-page py-space-xl md:py-space-3xl">
        <div class="max-w-[1440px] mx-auto px-margin-mobile md:px-margin">
          <div class="text-center max-w-2xl mx-auto mb-space-xl md:mb-space-3xl">
            <h2 class="font-headline-sm md:text-headline-lg font-headline">Почему выбирают LocaFun</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            <div class="bg-surface-secondary rounded-3xl p-space-lg md:p-space-2xl">
              <div class="w-16 h-16 rounded-2xl bg-surface-page flex items-center justify-center text-primary-pressed shadow-sm mb-space-lg">
                <span class="material-symbols-outlined text-[32px]">touch_app</span>
              </div>
              <h3 class="font-headline-sm font-headline mb-space-xs">Мгновенное бронирование</h3>
              <p class="font-body-md text-text-secondary">Выбирайте свободный слот и подтверждайте бронь в один клик.</p>
            </div>
            <div class="bg-surface-secondary rounded-3xl p-space-lg md:p-space-2xl">
              <div class="w-16 h-16 rounded-2xl bg-surface-page flex items-center justify-center text-primary-pressed shadow-sm mb-space-lg">
                <span class="material-symbols-outlined text-[32px]">verified_user</span>
              </div>
              <h3 class="font-headline-sm font-headline mb-space-xs">Проверенные площадки</h3>
              <p class="font-body-md text-text-secondary">Честные отзывы и актуальные фото от реальных посетителей.</p>
            </div>
            <div class="bg-surface-secondary rounded-3xl p-space-lg md:p-space-2xl">
              <div class="w-16 h-16 rounded-2xl bg-surface-page flex items-center justify-center text-primary-pressed shadow-sm mb-space-lg">
                <span class="material-symbols-outlined text-[32px]">price_check</span>
              </div>
              <h3 class="font-headline-sm font-headline mb-space-xs">Честная цена</h3>
              <p class="font-body-md text-text-secondary">Без скрытых комиссий. Поддержка на связи круглосуточно.</p>
            </div>
          </div>
        </div>
      </section>

      <section v-if="!hasSearched" class="w-full bg-surface-secondary py-space-xl md:py-space-3xl">
        <div class="max-w-[1440px] mx-auto px-margin-mobile md:px-margin">
          <div class="bg-text-primary rounded-3xl p-space-xl md:p-space-2xl text-on-primary flex flex-col lg:flex-row items-center justify-between gap-space-2xl relative overflow-hidden">
            <div class="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-primary-pressed/20 blur-3xl pointer-events-none" />
            <div class="max-w-xl relative z-10">
              <h2 class="font-headline-sm md:text-headline-lg font-headline tracking-tight mb-space-sm">
                Управляете клубом или спортивной ареной?
              </h2>
              <p class="font-body-md md:text-body-lg text-on-primary/80">
                Подключите заведение к LocaFun и получайте готовых гостей.
              </p>
            </div>
            <NuxtLink
              to="/contact"
              class="relative z-10 font-label-lg bg-primary-container text-text-primary px-space-2xl py-space-md rounded-xl hover:bg-primary-hover"
            >
              Подключить заведение
            </NuxtLink>
          </div>
        </div>
      </section>

      <div v-if="hasMore" ref="infiniteScrollSentinel" class="flex justify-center py-8">
        <button
          class="px-space-xl py-space-md rounded-xl border border-border-default font-label-md"
          :disabled="loadingMore"
          type="button"
          @click="loadMore"
        >
          {{ loadingMore ? 'Загружаем...' : 'Загрузить ещё' }}
        </button>
      </div>
    </main>
  </div>
</template>
