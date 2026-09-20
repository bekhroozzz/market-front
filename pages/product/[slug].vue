<script setup lang="ts">
import { useModal, useModalSlot } from 'vue-final-modal'
import { LazyAuthSignup, LazyModalTemplate, LazyProductPhotoFullScreen } from '#components'
import { getProductById, getProductBySlug, type Offer } from '~/composables/product'
import {
  buildCategoryChain,
  categoryHref,
  findCategoryById,
  type CategoryNode,
} from '~/composables/catalog'
import { useChat } from '~/composables/chat'
import { getFallbackOffer } from '~/composables/offer-fallback'
import { useLogged } from '~/composables/states'
import { truncateMeta } from '~/composables/seo'
import { buildBreadcrumbSchema, buildProductSchema } from '~/utils/schema'
import { dayName, isVenueOpenNow, todayCloseLabel } from '~/utils/time-slots'
import { formatFromPrice } from '~/utils/format-price'

const route = useRoute()
const routeSlug = String(route.params.slug || '')
const isLogged = useLogged()
const { openChat } = useChat()
const menuStore = useMenuStore()
const { menuHeader } = storeToRefs(menuStore)
const chrome = useAppChrome()
const { favorite } = chrome

const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function getOfferBySlugOrId(slugOrId: string): Promise<Offer> {
  try {
    if (uuidV4Regex.test(slugOrId)) return await getProductById(slugOrId)
    const bySlug = await getProductBySlug(slugOrId)
    return await getProductById(bySlug.id)
  }
  catch (error) {
    if (import.meta.dev) return getFallbackOffer()
    throw createError({ statusCode: 404, statusMessage: 'Товар не найден' })
  }
}

const { data: offer } = await useAsyncData(`offer-${routeSlug}`, () => getOfferBySlugOrId(routeSlug))
if (!offer.value) throw createError({ statusCode: 404, statusMessage: 'Товар не найден' })

if (uuidV4Regex.test(routeSlug) && offer.value.slug && offer.value.slug !== routeSlug)
  await navigateTo(`/product/${offer.value.slug}`, { redirectCode: 301, replace: true })

const images = computed(() => {
  const list = (offer.value?.images ?? []).filter(Boolean).map((src, index) => ({
    src,
    alt: `${offer.value?.title || 'offer'}-${index + 1}`,
  }))
  return list.length ? list : [{ src: '/og-default.jpg', alt: offer.value?.title || 'offer' }]
})

const category = computed(() =>
  offer.value?.category_id ? findCategoryById(menuHeader.value, offer.value.category_id) : null,
)

const categoryPath = computed(() =>
  offer.value?.category_id
    ? buildCategoryChain(menuHeader.value as CategoryNode[], offer.value.category_id) ?? []
    : [],
)

const sellerName = computed(() =>
  offer.value?.author?.email?.trim() || (offer.value?.author?.id ? `Партнёр #${offer.value.author.id}` : 'Партнёр LocaFun'),
)

const sellerInitials = computed(() => sellerName.value.slice(0, 2).toUpperCase())
const isOpen = computed(() => isVenueOpenNow(offer.value?.workSchedule))
const closeLabel = computed(() => todayCloseLabel(offer.value?.workSchedule))
const chatLoading = ref(false)

const sortedSchedule = computed(() =>
  [...(offer.value?.workSchedule ?? [])].sort((a, b) => a.day - b.day),
)

const mapsQuery = computed(() => encodeURIComponent(offer.value?.branchAddress || offer.value?.title || 'Tashkent'))
const googleMapsHref = computed(() => `https://www.google.com/maps/search/?api=1&query=${mapsQuery.value}`)
const yandexMapsHref = computed(() => `https://yandex.com/maps/?text=${mapsQuery.value}`)
const mapsEmbedSrc = computed(() => `https://maps.google.com/maps?q=${mapsQuery.value}&z=15&output=embed`)

const canonicalPath = computed(() => `/product/${offer.value?.slug || offer.value?.id || routeSlug}`)
const priceChip = computed(() => formatFromPrice(offer.value?.price))
const isFallbackOffer = computed(() => offer.value?.id.startsWith('fallback-'))
const categoryLabel = computed(() => category.value?.name || (isFallbackOffer.value ? 'Боулинг' : ''))
const venueIdLabel = computed(() => {
  if (!offer.value?.id || isFallbackOffer.value) return ''
  return offer.value.id.slice(0, 8)
})

const seoJsonLd = computed(() => [
  buildProductSchema({
    name: offer.value?.title || '',
    description: offer.value?.description || '',
    images: offer.value?.images?.filter(Boolean) || images.value.map(item => item.src),
    slug: offer.value?.slug,
    id: offer.value?.id,
    price: offer.value?.price ?? 0,
    oldPrice: offer.value?.oldPrice ?? 0,
    inStock: offer.value?.inStock,
    rating: offer.value?.rating ?? 0,
    reviewCount: offer.value?.reviewCount ?? 0,
    categoryName: category.value?.name,
  }),
  buildBreadcrumbSchema([
    ...categoryPath.value.map(cat => ({ name: cat.name, path: categoryHref(cat) })),
    { name: offer.value?.title || '', path: canonicalPath.value },
  ]),
])

useAppSeo({
  title: () => `${offer.value?.title || 'Предложение'} | LocaFun`,
  description: () =>
    truncateMeta(offer.value?.description)
    || `${offer.value?.title} — бронирование и подробности на LocaFun`,
  image: () => offer.value?.images?.[0] || images.value[0]?.src,
  canonical: () => canonicalPath.value,
  type: 'product',
  jsonLd: seoJsonLd,
})

const authModal = useModal({
  component: LazyModalTemplate,
  attrs: {
    variant: 'center',
    hideClose: true,
    containerWidth: '490px',
  },
  slots: {
    default: useModalSlot({
      component: LazyAuthSignup,
      attrs: {
        onClose() {
          authModal.close()
        },
      },
    }),
  },
})

const photoModal = useModal({
  component: LazyModalTemplate,
  attrs: { transition: 'vfm-slide-right', containerWidth: '100%', isHeightFull: true },
  slots: {
    default: useModalSlot({
      component: LazyProductPhotoFullScreen,
      attrs: {
        get images() {
          return images.value
        },
        onClose() { photoModal.close() },
      },
    }),
  },
})

function openPhotos() {
  photoModal.open()
}

async function handleWriteSeller() {
  if (!isLogged.value) {
    authModal.open()
    return
  }
  if (!offer.value?.id || offer.value.id.startsWith('fallback-')) return
  chatLoading.value = true
  try {
    const chat = await openChat(offer.value.id)
    await navigateTo(`/profile/chats/${chat.id}`)
  }
  finally {
    chatLoading.value = false
  }
}

function handleBook(payload: { date: string; time: string; persons: number }) {
  void navigateTo({
    path: `/booking/${offer.value?.slug || routeSlug}`,
    query: payload,
  })
}

async function shareOffer() {
  const url = import.meta.client ? window.location.href : canonicalPath.value
  if (navigator.share) {
    await navigator.share({ title: offer.value?.title, url })
    return
  }
  await navigator.clipboard?.writeText(url)
}

watch(() => offer.value?.title, (title) => {
  chrome.configure({
    title: title || '',
    showShare: true,
    showFavorite: true,
    onShare: shareOffer,
  })
}, { immediate: true })

onUnmounted(() => chrome.reset())

function scrollToReviews() {
  document.getElementById('offer-reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const todayOfferDay = computed(() => {
  const jsDay = new Date().getDay()
  return jsDay === 0 ? 6 : jsDay - 1
})
</script>

<template>
  <div v-if="offer" class="min-h-screen bg-surface-page text-text-primary font-body pb-36 lg:pb-0">
    <main>
      <div class="max-w-[1440px] mx-auto px-0 md:px-margin pt-0 md:pt-space-md pb-space-3xl flex flex-col gap-space-lg">
        <div class="hidden md:flex flex-wrap items-center justify-between gap-space-sm">
          <nav class="flex items-center gap-space-xs text-text-secondary font-label-sm">
            <NuxtLink to="/" class="hover:text-text-primary">Главная</NuxtLink>
            <span class="text-text-muted">/</span>
            <NuxtLink v-if="category" :to="categoryHref(category)" class="hover:text-text-primary">{{ category.name }}</NuxtLink>
            <span v-else-if="categoryLabel">{{ categoryLabel }}</span>
            <span v-if="category || categoryLabel" class="text-text-muted">/</span>
            <span class="text-text-primary font-bold">{{ offer.title }}</span>
          </nav>
          <div class="flex items-center gap-space-xs font-body-sm text-text-secondary">
            <span
              class="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full font-label-sm"
              :class="isOpen ? 'bg-status-success-bg text-status-success' : 'bg-status-error-bg text-status-error'"
            >
              <span class="w-2 h-2 rounded-full animate-pulse" :class="isOpen ? 'bg-status-success' : 'bg-status-error'" />
              {{ isOpen ? `Открыто${closeLabel ? ` до ${closeLabel}` : ''}` : 'Сейчас закрыто' }}
            </span>
            <template v-if="venueIdLabel">
              <span class="text-text-muted">•</span>
              <span>ID заведения #{{ venueIdLabel }}</span>
            </template>
          </div>
        </div>

        <div class="hidden md:flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg">
          <ProductOfferHeader
            :title="offer.title"
            :category-name="categoryLabel"
            :rating="offer.rating"
            :review-count="offer.reviewCount"
            :address="offer.branchAddress"
            @reviews="scrollToReviews"
          />
          <div class="flex items-center gap-space-sm self-start lg:self-end">
            <button class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-secondary font-label-md" type="button" @click="shareOffer">
              <span class="material-symbols-outlined text-text-secondary">ios_share</span>
              Поделиться
            </button>
            <button
              class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-label-md"
              :class="favorite ? 'bg-primary-container' : 'bg-surface-soft-pink'"
              type="button"
              @click="favorite = !favorite"
            >
              <span class="material-symbols-outlined text-primary-pressed" :class="{ filled: favorite }">favorite</span>
              В избранное
            </button>
          </div>
        </div>

        <ProductOfferGallery :images="images" @open="openPhotos" />

        <div class="px-margin-mobile md:px-0 grid grid-cols-1 lg:grid-cols-12 gap-space-2xl items-start">
          <div class="md:hidden">
            <ProductOfferHeader
              compact
              heading="p"
              :title="offer.title"
              :category-name="categoryLabel"
              :rating="offer.rating"
              :review-count="offer.reviewCount"
              :address="offer.branchAddress"
              :price-chip="priceChip"
              @reviews="scrollToReviews"
            />
          </div>

          <aside class="lg:col-span-4 lg:order-2 w-full lg:sticky lg:top-28">
            <ProductOfferBookingDock
              :price="offer.price"
              :old-price="offer.oldPrice"
              :prices="offer.prices"
              :work-schedule="offer.workSchedule"
              :chat-loading="chatLoading"
              @book="handleBook"
              @chat="handleWriteSeller"
            />
          </aside>

          <div class="lg:col-span-8 lg:order-1 flex flex-col gap-space-2xl">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
              <div class="flex items-start gap-space-sm p-space-md rounded-2xl bg-surface-secondary">
                <div class="w-10 h-10 rounded-xl bg-surface-page flex items-center justify-center text-status-success shrink-0">
                  <span class="material-symbols-outlined">bolt</span>
                </div>
                <div>
                  <p class="font-label-md">Мгновенно</p>
                  <p class="font-body-sm text-text-secondary">Бронь без долгих звонков</p>
                </div>
              </div>
              <div class="flex items-start gap-space-sm p-space-md rounded-2xl bg-surface-secondary">
                <div class="w-10 h-10 rounded-xl bg-surface-page flex items-center justify-center text-primary-pressed shrink-0">
                  <span class="material-symbols-outlined">event_available</span>
                </div>
                <div>
                  <p class="font-label-md">Гибкая отмена</p>
                  <p class="font-body-sm text-text-secondary">По правилам площадки</p>
                </div>
              </div>
              <div class="flex items-start gap-space-sm p-space-md rounded-2xl bg-surface-secondary">
                <div class="w-10 h-10 rounded-xl bg-surface-page flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined">verified_user</span>
                </div>
                <div>
                  <p class="font-label-md">Проверенный партнёр</p>
                  <p class="font-body-sm text-text-secondary">Площадка на LocaFun</p>
                </div>
              </div>
            </div>

            <section>
              <h2 class="font-headline-md font-headline mb-space-md">О месте</h2>
              <p class="font-body-md text-text-secondary leading-relaxed whitespace-pre-line">
                {{ offer.description || 'Описание пока не добавлено.' }}
              </p>
            </section>

            <section v-if="offer.features?.length">
              <h2 class="font-headline-md font-headline mb-space-md">Удобства и оснащение</h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                <div
                  v-for="feature in offer.features"
                  :key="feature"
                  class="flex items-center gap-space-sm p-3.5 rounded-xl bg-surface-secondary"
                >
                  <span class="w-8 h-8 rounded-lg bg-surface-page flex items-center justify-center">
                    <span class="material-symbols-outlined text-[18px]">check</span>
                  </span>
                  <span class="font-label-md">{{ feature }}</span>
                </div>
              </div>
            </section>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
              <div class="p-space-lg rounded-2xl bg-surface-secondary">
                <div class="flex items-center justify-between mb-space-md">
                  <h3 class="font-headline-sm font-headline flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary-pressed">schedule</span>
                    Время работы
                  </h3>
                  <span
                    class="px-2 py-0.5 rounded-md font-label-sm font-bold"
                    :class="isOpen ? 'bg-status-success-bg text-status-success' : 'bg-status-error-bg text-status-error'"
                  >
                    {{ isOpen ? 'Открыто' : 'Закрыто' }}
                  </span>
                </div>
                <div v-if="sortedSchedule.length" class="flex flex-col gap-2.5 font-body-sm">
                  <div
                    v-for="day in sortedSchedule"
                    :key="day.day"
                    class="flex items-center justify-between py-1.5"
                    :class="day.day === todayOfferDay ? 'p-2.5 rounded-xl bg-surface-soft-pink' : 'text-text-secondary'"
                  >
                    <span>{{ dayName(day.day) }}</span>
                    <span v-if="day.isClosed" class="italic">Выходной</span>
                    <span v-else class="font-semibold text-text-primary">{{ day.openTime }} – {{ day.closeTime }}</span>
                  </div>
                </div>
                <p v-else class="font-body-sm text-text-muted">График уточняйте при бронировании</p>
              </div>

              <div class="p-space-lg rounded-2xl bg-surface-secondary">
                <h3 class="font-headline-sm font-headline flex items-center gap-2 mb-space-md">
                  <span class="material-symbols-outlined">gavel</span>
                  Важно знать
                </h3>
                <ul v-if="offer.rules?.length" class="flex flex-col gap-space-sm font-body-sm text-text-secondary">
                  <li v-for="rule in offer.rules" :key="rule" class="flex items-start gap-2">
                    <span class="material-symbols-outlined text-primary-pressed text-base">check_circle</span>
                    <span>{{ rule }}</span>
                  </li>
                </ul>
                <p v-else class="font-body-sm text-text-muted">Правила площадки появятся после заполнения профиля.</p>
              </div>
            </div>

            <div class="p-space-lg rounded-2xl bg-surface-secondary flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md">
              <div class="flex items-center gap-space-md">
                <div class="relative">
                  <div class="w-14 h-14 rounded-2xl bg-primary-container font-headline-sm flex items-center justify-center font-bold">
                    {{ sellerInitials }}
                  </div>
                  <span class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-status-success text-surface-page flex items-center justify-center">
                    <span class="material-symbols-outlined text-sm">check</span>
                  </span>
                </div>
                <div>
                  <p class="font-headline-sm">{{ sellerName }}</p>
                  <p class="font-body-sm text-text-secondary">Проверенный партнёр LocaFun</p>
                </div>
              </div>
              <div class="flex gap-2">
                <NuxtLink
                  v-if="offer.author?.id"
                  :to="`/seller/${offer.author.id}`"
                  class="px-space-md py-2.5 rounded-xl bg-surface-page font-label-md"
                >
                  Профиль
                </NuxtLink>
                <button class="px-space-md py-2.5 rounded-xl bg-surface-page font-label-md" type="button" @click="handleWriteSeller">
                  Написать заведению
                </button>
              </div>
            </div>

            <ProductReviewBlock
              v-if="offer.id"
              id="offer-reviews"
              :offer-id="offer.id"
              :rating="offer.rating"
              :review-count="offer.reviewCount"
            />

            <section v-if="offer.branchAddress">
              <h2 class="font-headline-md font-headline mb-space-xs">Где находится</h2>
              <p class="font-body-md text-text-secondary mb-space-md">{{ offer.branchAddress }}</p>
              <div class="relative w-full h-72 rounded-2xl overflow-hidden bg-surface-secondary">
                <iframe
                  :src="mapsEmbedSrc"
                  class="w-full h-full border-0"
                  loading="lazy"
                  referrerpolicy="no-referrer-when-downgrade"
                  title="Карта заведения"
                />
                <div class="absolute top-4 left-4 p-space-sm rounded-xl bg-surface-page/90 backdrop-blur-md shadow-md flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-primary-pressed animate-ping" />
                  <span class="font-label-sm font-bold">{{ offer.title }}</span>
                </div>
                <div class="absolute bottom-4 right-4 flex flex-wrap gap-2">
                  <a
                    :href="yandexMapsHref"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-page font-label-sm shadow-md"
                  >
                    <span class="material-symbols-outlined text-base text-status-info">navigation</span>
                    Яндекс Карты
                  </a>
                  <a
                    :href="googleMapsHref"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-page font-label-sm shadow-md"
                  >
                    <span class="material-symbols-outlined text-base text-status-success">map</span>
                    Google Maps
                  </a>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>

  </div>
</template>
