<script setup lang="ts">
import Breadcrumbs from '~/components/Breadcrumbs.vue'
import { useModal, useModalSlot } from 'vue-final-modal'
import { LazyModalTemplate, LazyProductPhotoFullScreen } from '#components'
import { getProductById, getProductBySlug, type Offer } from '~/composables/product'

interface Category {
  id: string
  name: string
  children?: Category[]
}

interface ProductViewModel {
  name: string
  price: number
  oldPrice: number
  rating: number
  reviewCount: number
  description: string
  images: { src: string; alt: string }[]
}

const route = useRoute()
const routeSlug = String(route.params.slug || '')

const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function mapOfferToViewModel(o: Offer): ProductViewModel {
  const normalizedImages = (o.images ?? [])
    .filter(Boolean)
    .map((src, index) => ({ src, alt: `${o.title ?? 'product'}-${index + 1}` }))

  return {
    name: o.title ?? 'Товар',
    price: Number(o.price ?? 0),
    oldPrice: Number(o.oldPrice ?? o.price ?? 0),
    rating: Math.max(0, Math.min(5, Number(o.rating ?? 0))),
    reviewCount: Number(o.reviewCount ?? o.salesCount ?? 0),
    description: o.description ?? 'Описание пока не добавлено.',
    images: normalizedImages.length ? normalizedImages : [{ src: '/1.jpg', alt: 'product-1' }],
  }
}

async function getOfferBySlugOrId(slugOrId: string): Promise<Offer> {
  if (uuidV4Regex.test(slugOrId)) return getProductById(slugOrId)

  try {
    const bySlug = await getProductBySlug(slugOrId)
    return await getProductById(bySlug.id)
  }
  catch {
    throw createError({ statusCode: 404, statusMessage: 'Товар не найден' })
  }
}

const menuStore = useMenuStore()
const { menuHeader } = storeToRefs(menuStore)

function buildCategoryPath(
  categories: Category[],
  targetId: string,
  path: Category[] = [],
): Category[] | null {
  for (const cat of categories) {
    const current = [...path, cat]
    if (cat.id === targetId) return current
    if (cat.children?.length) {
      const found = buildCategoryPath(cat.children, targetId, current)
      if (found) return found
    }
  }
  return null
}

const { data: offer } = await useAsyncData(`offer-${routeSlug}`, () => getOfferBySlugOrId(routeSlug))

if (!offer.value) throw createError({ statusCode: 404, statusMessage: 'Товар не найден' })

const productData = ref<ProductViewModel>(mapOfferToViewModel(offer.value))

const breadcrumbs = computed(() => {
  const categoryPath = offer.value?.category_id
    ? buildCategoryPath(menuHeader.value as Category[], offer.value.category_id) ?? []
    : []
  return [
    ...categoryPath.map((cat) => ({ label: cat.name, to: `/catalog/${cat.id}` })),
    { label: productData.value.name },
  ]
})

const photoModal = useModal({
  component: LazyModalTemplate,
  attrs: { transition: 'vfm-slide-right', containerWidth: '100%', isHeightFull: true },
  slots: {
    default: useModalSlot({
      component: LazyProductPhotoFullScreen,
      attrs: {
        images: productData.value.images,
        onClose() { photoModal.close() },
      },
    }),
  },
})
</script>

<template>
  <div class="container mx-auto px-4 pb-8">
    <Breadcrumbs :items="breadcrumbs" class="pb-8 pt-4" />

    <div class="flex gap-6 lg:flex-row flex-col">
      <ProductPhotoBlock v-bind="productData" @handle-main-photo-click="photoModal.open" />
      <ProductInfoBar
        v-bind="productData"
        :seller-id="offer?.author?.id"
        :seller-company-name="offer?.author?.email"
        :branch-address="offer?.branchAddress"
        :work-schedule="offer?.workSchedule"
        :features="offer?.features"
        :rules="offer?.rules"
        :prices="offer?.prices"
      />
    </div>

    <div class="divider my-6 lg:my-10" />

    <ProductReviewBlock v-if="offer?.id" :offer-id="offer.id" />
  </div>
</template>
