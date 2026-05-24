<script setup lang="ts">
import Breadcrumbs from '~/components/Breadcrumbs.vue';
import {useModal, useModalSlot} from 'vue-final-modal';
import {LazyModalTemplate, LazyProductPhotoFullScreen} from '#components';
import {getAllProducts, getProductById, type Offer} from '~/composables/product';

const route = useRoute()
const routeSlug = String(route.params.slug || '')

interface ProductViewModel {
  name: string
  price: number
  oldPrice: number
  rating: number
  reviewCount: number
  description: string
  images: { src: string; alt: string }[]
}

const uuidV4Regex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function mapOfferToViewModel(offer: Offer): ProductViewModel {
  const normalizedImages = (offer.images || [])
    .filter(Boolean)
    .map((src, index) => ({
      src,
      alt: `${offer.title || 'product'}-${index + 1}`,
    }))

  const images = normalizedImages.length ? normalizedImages : [{ src: '/1.jpg', alt: 'product-1' }]
  const price = Number(offer.price || 0)
  const oldPrice = Number(offer.oldPrice || price)
  const normalizedRating = Math.max(0, Math.min(5, Math.round(Number(offer.rating || 0))))

  return {
    name: offer.title || 'Товар',
    price,
    oldPrice,
    rating: normalizedRating,
    reviewCount: Number(offer.salesCount || 0),
    description: offer.description || 'Описание пока не добавлено.',
    images,
  }
}

async function getOfferBySlugOrId(slugOrId: string) {
  if (uuidV4Regex.test(slugOrId))
    return getProductById(slugOrId)

  const offers = await getAllProducts()
  const matchedOffer = offers.find((item) => item.slug === slugOrId || item.id === slugOrId)

  if (!matchedOffer)
    throw createError({ statusCode: 404, statusMessage: 'Товар не найден' })

  try {
    return await getProductById(matchedOffer.id)
  } catch {
    return matchedOffer
  }
}

const { data: offer } = await useAsyncData(`offer-${routeSlug}`, () => getOfferBySlugOrId(routeSlug))

if (!offer.value)
  throw createError({ statusCode: 404, statusMessage: 'Товар не найден' })

const productData = ref<ProductViewModel>(mapOfferToViewModel(offer.value))

const photoModal = useModal({
  component: LazyModalTemplate,
  attrs: {
    transition: 'vfm-slide-right',
    containerWidth: '100%',
    isHeightFull: true,
  },
  slots: {
    default: useModalSlot({
      component: LazyProductPhotoFullScreen,
      attrs:{
        images: productData.value.images,
        onClose(){
          photoModal.close()
        }
      }
    })
  }
})
</script>

<template>
    <div class="container mx-auto px-4 pb-8">
      <Breadcrumbs class="pb-8 pt-4"/>
      <div class="flex gap-6 lg:flex-row flex-col">
        <ProductPhotoBlock v-bind="productData" @handle-main-photo-click="photoModal.open"/>
        <ProductInfoBar v-bind="productData"/>
      </div>
      <div class="divider my-6 lg:my-10"></div>
      <ProductReviewBlock/>
    </div>
</template>

