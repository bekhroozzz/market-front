<script setup lang="ts">
import { breakpointsTailwind } from '@vueuse/core'
import {
  browseCatalog,
  buildCategoryChain,
  categoryHref,
  findCategoryById,
  findCategoryByPath,
  getCatalogCategories,
  type CatalogFilters,
  type CategoryNode,
} from '~/composables/catalog'

interface ProductCardViewModel {
  url: string
  title: string
  description: string
  images: { src: string; active: boolean }[]
}

const UUID_RE
  = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const route = useRoute()
const router = useRouter()
const { lg, sm } = useBreakpoints(breakpointsTailwind, { ssrWidth: 768 })
const menuStore = useMenuStore()
const { menuHeader } = storeToRefs(menuStore)

const categoryPath = computed(() => {
  const param = route.params.slug
  if (Array.isArray(param))
    return param.filter(Boolean).join('/')
  return String(param || '')
})

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

// Subcategories = direct children; if leaf — show siblings
const subcategories = computed<CategoryNode[]>(() => {
  if (currentCategory.value?.children?.length)
    return currentCategory.value.children

  if (parentCategory.value?.children?.length)
    return parentCategory.value.children

  return []
})

const isFilterOpen = ref(false)
const searchFilters = ref<CatalogFilters>({})
const page = ref(1)
const accumulatedProducts = ref<ProductCardViewModel[]>([])
const totalCount = ref(0)
const totalPages = ref(1)
const pending = ref(false)
const pageTitle = ref('Каталог')

async function fetchProducts(append = false) {
  pending.value = true
  try {
    const result = await browseCatalog(categoryPath.value, {
      limit: 24,
      page: page.value,
      sort: 'popularity',
      ...searchFilters.value,
    })

    totalCount.value = result?.total ?? 0
    totalPages.value = result?.pages ?? 1
    pageTitle.value = result?.category?.name || currentCategory.value?.name || 'Каталог'

    const newProducts: ProductCardViewModel[] = (result?.items || []).map((item) => {
      const imgs = (item.document.images || []).filter(Boolean)
      return {
        url: `/product/${item.document.slug || item.document.id}`,
        title: item.document.title,
        description: item.document.description,
        images: imgs.length
          ? imgs.map((src, i) => ({ src, active: i === 0 }))
          : [{ src: '/1.jpg', active: true }],
      }
    })

    if (append)
      accumulatedProducts.value.push(...newProducts)
    else
      accumulatedProducts.value = newProducts
  }
  finally {
    pending.value = false
  }
}

await fetchProducts()

const products = computed(() => accumulatedProducts.value)

interface FilterPayload {
  city?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
}

function handleFilterApply(payload: FilterPayload) {
  // Category changes navigate to the catalog path page
  if (payload.category && payload.category !== categoryPath.value) {
    isFilterOpen.value = false
    void navigateTo(`/catalog/${payload.category}`)
    return
  }

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

watch(categoryPath, () => {
  page.value = 1
  searchFilters.value = {}
  fetchProducts()
})

const headerHeight = 48
</script>

<template>
  <div class="min-h-screen pb-20">
    <!-- Breadcrumbs & Title -->
    <div class="px-4 lg:px-8 py-4 lg:py-6">
      <div class="flex items-center gap-2 text-sm opacity-60 mb-2 flex-wrap">
        <NuxtLink to="/" class="hover:text-primary transition-colors">
          Главная
        </NuxtLink>
        <template v-for="crumb in breadcrumbs" :key="crumb.id">
          <span>/</span>
          <NuxtLink
            v-if="crumb.path !== categoryPath"
            :to="categoryHref(crumb)"
            class="hover:text-primary transition-colors"
          >
            {{ crumb.name }}
          </NuxtLink>
          <span v-else class="text-base-content">{{ crumb.name }}</span>
        </template>
        <template v-if="!breadcrumbs.length">
          <span>/</span>
          <span class="text-base-content">{{ pageTitle }}</span>
        </template>
      </div>
      <h1 class="text-2xl lg:text-3xl font-bold">
        {{ pageTitle }}
      </h1>
    </div>

    <!-- Sticky Subcategories Bar -->
    <div
      v-if="subcategories.length"
      class="sticky flex lg:flex-row flex-col lg:items-center lg:justify-between z-40 glass shadow-md border-b border-base-content/10"
      :style="`top: ${headerHeight}px`"
    >
      <div class="flex overflow-x-auto gap-2 px-4 lg:px-8 py-3 scrollbar-hide">
        <NuxtLink
          v-for="sub in subcategories"
          :key="sub.id"
          :to="categoryHref(sub)"
          class="btn btn-sm whitespace-nowrap flex-shrink-0 transition-all"
          :class="categoryPath === (sub.path || sub.slug) ? 'btn-primary' : 'btn-outline'"
        >
          {{ sub.name }}
        </NuxtLink>
      </div>
      <button
        class="btn btn-outline btn-sm lg:btn-md gap-2"
        @click="isFilterOpen = true"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M6 10.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5" />
        </svg>
        Фильтры
      </button>
    </div>

    <!-- Toolbar: count -->
    <div class="flex items-center justify-between px-4 lg:px-8 py-4">
      <div class="flex items-center gap-3">
        <span v-if="!pending" class="text-sm opacity-70">
          {{ totalCount > 0 ? `Найдено: ${totalCount}` : 'Нет предложений' }}
        </span>
        <span v-if="pending" class="loading loading-spinner loading-sm text-primary" />
      </div>
      <button
        v-if="!subcategories.length"
        class="btn btn-outline btn-sm gap-2"
        @click="isFilterOpen = true"
      >
        Фильтры
      </button>
    </div>

    <!-- Products Grid -->
    <div class="px-0 lg:px-8">
      <div
        v-if="products.length"
        class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 lg:gap-4 2xl:grid-cols-5 xl:w-max mx-auto"
      >
        <ProductCard
          v-for="(product, index) in products"
          :key="index"
          v-bind="product"
          is-swiper-img
          :size="lg ? 'md' : sm ? 'sm' : 'xs'"
        />
      </div>

      <div v-else-if="!pending" class="flex flex-col items-center justify-center py-20 text-base-content/60">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" class="mb-4 opacity-40" viewBox="0 0 16 16">
          <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.5 2H.5a.5.5 0 0 1-.5-.5M3.102 4l1.313 7h8.17l1.313-7zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4m7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4m-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2m7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2" />
        </svg>
        <p class="text-lg font-medium">
          В этой категории пока нет предложений
        </p>
        <p class="text-sm mt-1">
          Попробуйте выбрать другую категорию или изменить фильтры
        </p>
      </div>

      <div v-if="products.length && page < totalPages" class="flex justify-center mt-8">
        <button
          class="btn btn-outline btn-primary"
          :class="{ 'btn-loading': pending }"
          :disabled="pending"
          @click="loadMore"
        >
          <span v-if="pending" class="loading loading-spinner loading-sm mr-2" />
          Загрузить ещё
        </button>
      </div>
    </div>

    <ModalTemplate v-model="isFilterOpen">
      <div class="p-4 lg:p-6 pt-10 overflow-y-auto">
        <h2 class="text-xl font-semibold mb-4">
          Фильтры
        </h2>
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
