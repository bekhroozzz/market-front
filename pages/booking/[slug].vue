<script setup lang="ts">
import { useModal, useModalSlot } from 'vue-final-modal'
import { LazyAuthSignup, LazyModalTemplate } from '#components'
import { getProductBySlug, getProductById, type Offer } from '~/composables/product'
import { findCategoryById } from '~/composables/catalog'
import { useBooking, getScheduleForDate, type PaymentMethod } from '~/composables/booking'
import { getFallbackOffer } from '~/composables/offer-fallback'
import { useLogged } from '~/composables/states'
import { addMinutesToTime, formatBookingChip, generateTimeSlots, isVenueOpenNow } from '~/utils/time-slots'
import { formatPrice } from '~/utils/format-price'

const route = useRoute()
const slug = String(route.params.slug || '')
const isLogged = useLogged()
const chrome = useAppChrome()
const { createBooking } = useBooking()
const menuStore = useMenuStore()
const { menuHeader } = storeToRefs(menuStore)

useAppSeo({
  title: 'Бронирование | LocaFun',
  description: 'Оформление бронирования на LocaFun',
  canonical: () => `/booking/${slug}`,
  noindex: true,
})

const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function getOfferBySlugOrId(slugOrId: string): Promise<Offer> {
  try {
    if (uuidV4Regex.test(slugOrId)) return await getProductById(slugOrId)
    return await getProductBySlug(slugOrId)
  }
  catch (error) {
    if (import.meta.dev) return getFallbackOffer()
    throw error
  }
}

const { data: offer, pending: isOfferLoading, error: offerLoadError } = await useAsyncData(
  `booking-offer-${slug}`,
  () => getOfferBySlugOrId(slug),
)

const offerError = computed(() => {
  if (offer.value) return ''
  if (offerLoadError.value) return 'Предложение не найдено'
  return ''
})

function parseQueryDate(): Date {
  const raw = String(route.query.date || '')
  if (raw && !Number.isNaN(Date.parse(raw)))
    return new Date(`${raw}T00:00:00`)
  return new Date()
}

const selectedDate = ref<Date>(parseQueryDate())
const selectedTime = ref(String(route.query.time || ''))
const personsCount = ref(Number(route.query.persons) > 0 ? Number(route.query.persons) : 2)
const guestName = ref('')
const phone = ref('')
const comment = ref('')
const paymentMethod = ref<PaymentMethod>('cash')
const needShoes = ref(true)
const needBumpers = ref(false)
const showBreakdown = ref(false)

const isSubmitting = ref(false)
const submitError = ref('')
const submitSuccess = ref(false)
const createdBookingId = ref<string | null>(null)

const dateChips = computed(() =>
  Array.from({ length: 10 }, (_, index) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() + index)
    const schedule = getScheduleForDate(offer.value?.workSchedule, date)
    return {
      date,
      closed: Boolean(schedule?.isClosed),
      ...formatBookingChip(date),
    }
  }),
)

const slots = computed(() => generateTimeSlots(offer.value?.workSchedule, selectedDate.value))

watch(slots, (value) => {
  if (!value.includes(selectedTime.value))
    selectedTime.value = value[0] || ''
}, { immediate: true })

const category = computed(() =>
  offer.value?.category_id ? findCategoryById(menuHeader.value, offer.value.category_id) : null,
)
const categoryLabel = computed(() => category.value?.name || (offer.value?.id?.startsWith('fallback-') ? 'Боулинг' : ''))
const isOpen = computed(() => isVenueOpenNow(offer.value?.workSchedule))
const unitPrice = computed(() => offer.value?.prices?.[0]?.price ?? offer.value?.price ?? 0)
const endTime = computed(() => selectedTime.value ? addMinutesToTime(selectedTime.value, 60) : '')
const coverImage = computed(() => offer.value?.images?.find(Boolean) || '/og-default.jpg')
const dateQuery = computed(() => {
  const year = selectedDate.value.getFullYear()
  const month = String(selectedDate.value.getMonth() + 1).padStart(2, '0')
  const day = String(selectedDate.value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})
const dateLong = computed(() =>
  selectedDate.value.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }),
)
const dateShort = computed(() =>
  selectedDate.value.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' }),
)
const monthLabel = computed(() =>
  selectedDate.value.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }),
)
const personsLabel = computed(() => {
  const n = personsCount.value
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return `${n} человек`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} человека`
  return `${n} человек`
})

const stepIndex = computed(() => {
  if (submitSuccess.value) return 4
  if (phone.value.trim().length >= 9) return 3
  if (selectedDate.value && selectedTime.value) return 2
  return 1
})

const offerBackHref = computed(() => `/product/${offer.value?.slug || slug}`)

watch(offerBackHref, (href) => {
  chrome.configure({
    title: 'Бронирование',
    backHref: href,
  })
}, { immediate: true })

onUnmounted(() => chrome.reset())

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

function pickDate(date: Date, closed?: boolean) {
  if (closed) return
  selectedDate.value = date
}

function buildComment() {
  const extras = [
    needShoes.value ? 'прокат обуви' : '',
    needBumpers.value ? 'детские бортики' : '',
  ].filter(Boolean)
  return [
    guestName.value.trim() ? `Имя: ${guestName.value.trim()}` : '',
    comment.value.trim(),
    extras.length ? extras.join(', ') : '',
  ].filter(Boolean).join('. ')
}

async function handleSubmit() {
  if (!isLogged.value) {
    authModal.open()
    return
  }
  if (!offer.value) return
  if (!selectedTime.value) {
    submitError.value = 'Выберите дату и время'
    return
  }
  if (!phone.value.trim()) {
    submitError.value = 'Укажите номер телефона'
    return
  }

  submitError.value = ''
  isSubmitting.value = true
  try {
    const booking = await createBooking({
      offerId: offer.value.id,
      date: dateQuery.value,
      time: selectedTime.value,
      personsCount: personsCount.value,
      phone: phone.value.trim(),
      comment: buildComment() || undefined,
      paymentMethod: paymentMethod.value,
    })
    createdBookingId.value = booking.id
    submitSuccess.value = true
  }
  catch (error: unknown) {
    const payload = error as { _data?: { message?: string | string[] } }
    const message = payload?._data?.message
    submitError.value = Array.isArray(message) ? message.join(', ') : (message ?? 'Ошибка при создании брони')
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#fbf9f8] text-text-primary font-body flex flex-col">
    <main class="flex-1 bg-[#fbf9f8] pb-32 lg:pb-0">
      <div v-if="isOfferLoading" class="flex justify-center py-20">
        <span class="w-10 h-10 rounded-full border-2 border-primary-container border-t-transparent animate-spin" />
      </div>

      <div v-else-if="offerError" class="max-w-md mx-auto mt-space-2xl p-space-lg rounded-2xl bg-status-error-bg text-status-error font-body-sm">
        {{ offerError }}
      </div>

      <template v-else-if="offer">
        <div v-if="offer.autoConfirmBooking" class="w-full bg-surface-soft-pink py-space-xs px-margin-mobile md:px-margin border-b border-border-default">
          <div class="max-w-[1120px] mx-auto flex items-center gap-space-xs font-label-sm text-text-secondary">
            <span class="material-symbols-outlined text-primary-pressed text-[18px]">bolt</span>
            Мгновенное подтверждение слота без звонка оператору
          </div>
        </div>

        <div class="max-w-[1120px] w-full mx-auto px-margin-mobile md:px-margin py-space-lg md:py-space-xl">
          <div class="hidden md:block w-full mb-space-2xl">
            <div class="relative flex items-center justify-between max-w-[820px] mx-auto">
              <div class="absolute left-6 right-6 top-5 h-[2px] bg-border-default" />
              <div
                class="absolute left-6 top-5 h-[2px] bg-primary-container transition-all"
                :style="{ width: `${Math.min(100, (stepIndex - 1) * 33)}%` }"
              />
              <div
                v-for="(label, index) in ['1. Дата и время', '2. Детали брони', '3. Ваши контакты', '4. Подтверждение']"
                :key="label"
                class="relative z-10 flex flex-col items-center gap-space-xs"
              >
                <div
                  class="w-10 h-10 rounded-full flex items-center justify-center font-label-md"
                  :class="stepIndex > index + 1
                    ? 'bg-primary-container text-text-primary'
                    : stepIndex === index + 1
                      ? 'bg-text-primary text-on-primary ring-4 ring-primary-container/40'
                      : 'bg-surface-container text-text-secondary'"
                >
                  <span v-if="stepIndex > index + 1" class="material-symbols-outlined text-[20px]">check</span>
                  <span v-else>{{ index + 1 }}</span>
                </div>
                <span class="font-label-sm" :class="stepIndex >= index + 1 ? 'text-text-primary' : 'text-text-secondary'">{{ label }}</span>
              </div>
            </div>
          </div>

          <div class="md:hidden flex flex-col gap-space-sm mb-space-md">
            <div class="flex items-center justify-between">
              <span class="font-label-md">Шаг {{ Math.min(stepIndex, 3) }} из 3</span>
              <span class="font-label-sm text-text-secondary bg-surface-secondary px-2.5 py-1 rounded-full">Бронь за 1 мин</span>
            </div>
            <div class="grid grid-cols-4 gap-1.5">
              <div v-for="index in 4" :key="index" class="h-1.5 rounded-full" :class="stepIndex >= index ? 'bg-primary-container' : 'bg-surface-container-high'" />
            </div>
            <div class="flex items-center gap-space-sm p-space-sm rounded-xl bg-surface-secondary">
              <img :src="coverImage" :alt="offer.title" class="w-14 h-14 rounded-lg object-cover">
              <div class="min-w-0 flex-1">
                <p class="font-headline-sm text-[16px] truncate">{{ offer.title }}</p>
                <p class="font-body-sm text-text-secondary truncate">{{ offer.branchAddress || 'Ташкент' }}</p>
              </div>
              <span
                class="font-label-sm px-2 py-1 rounded-full"
                :class="isOpen ? 'bg-status-success-bg text-status-success' : 'bg-status-error-bg text-status-error'"
              >
                {{ isOpen ? 'Открыто' : 'Закрыто' }}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
            <div class="lg:col-span-8 flex flex-col gap-space-lg md:gap-space-2xl">
              <section class="bg-surface-page rounded-2xl p-space-md md:p-space-lg shadow-sm border border-border-default">
                <div class="flex items-center justify-between mb-space-md">
                  <div class="flex items-center gap-space-sm">
                    <span class="hidden md:flex w-8 h-8 rounded-xl bg-surface-soft-pink text-primary-pressed items-center justify-center">
                      <span class="material-symbols-outlined text-[20px]">calendar_month</span>
                    </span>
                    <div>
                      <h2 class="font-headline-sm">1. Дата и время игры</h2>
                      <p class="hidden md:block font-body-sm text-text-secondary">Выберите день и свободный слот</p>
                    </div>
                  </div>
                  <span class="font-label-sm text-primary-pressed capitalize">{{ monthLabel }}</span>
                </div>

                <div class="flex items-center gap-space-sm overflow-x-auto pb-space-xs">
                  <button
                    v-for="chip in dateChips"
                    :key="chip.date.toISOString()"
                    class="shrink-0 flex flex-col items-center justify-center min-w-[76px] md:min-w-[100px] py-2.5 px-2 rounded-xl"
                    :class="chip.closed
                      ? 'bg-surface-container text-text-muted cursor-not-allowed'
                      : chip.date.toDateString() === selectedDate.toDateString()
                        ? 'bg-primary-container text-text-primary font-bold'
                        : 'bg-surface-secondary text-text-secondary'"
                    type="button"
                    :disabled="chip.closed"
                    @click="pickDate(chip.date, chip.closed)"
                  >
                    <span class="font-label-sm">{{ chip.weekday }}</span>
                    <span class="font-label-lg md:text-label-lg">{{ chip.day }} {{ chip.month }}</span>
                  </button>
                </div>

                <div class="mt-space-lg">
                  <div class="flex items-center justify-between mb-space-sm">
                    <span class="font-label-md">Свободные слоты</span>
                    <span class="font-body-sm text-text-muted">Ташкент, UTC+5</span>
                  </div>
                  <div v-if="slots.length" class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    <button
                      v-for="slot in slots"
                      :key="slot"
                      class="h-12 rounded-xl font-label-md flex items-center justify-center gap-1"
                      :class="selectedTime === slot ? 'bg-primary-container font-bold' : 'bg-surface-secondary'"
                      type="button"
                      @click="selectedTime = slot"
                    >
                      <span v-if="selectedTime === slot" class="material-symbols-outlined text-[16px]">check</span>
                      {{ slot }}
                    </button>
                  </div>
                  <p v-else class="font-body-sm text-text-muted">В этот день слотов нет</p>
                </div>
              </section>

              <section class="bg-surface-page rounded-2xl p-space-md md:p-space-lg shadow-sm border border-border-default">
                <div class="flex items-center gap-space-sm mb-space-lg">
                  <span class="hidden md:flex w-8 h-8 rounded-xl bg-surface-soft-pink text-primary-pressed items-center justify-center">
                    <span class="material-symbols-outlined text-[20px]">groups</span>
                  </span>
                  <div>
                    <h2 class="font-headline-sm">2. Детали бронирования</h2>
                    <p class="hidden md:block font-body-sm text-text-secondary">Количество гостей и пожелания к визиту</p>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                  <div class="p-space-md rounded-xl bg-surface-secondary flex items-center justify-between">
                    <div>
                      <p class="font-label-md">Гости</p>
                      <p class="font-body-sm text-text-secondary">{{ personsLabel }}</p>
                    </div>
                    <div class="flex items-center gap-3">
                      <button class="w-9 h-9 rounded-full bg-surface-page" type="button" @click="personsCount = Math.max(1, personsCount - 1)">−</button>
                      <span class="font-headline-sm w-6 text-center">{{ personsCount }}</span>
                      <button class="w-9 h-9 rounded-full bg-surface-page" type="button" @click="personsCount = Math.min(12, personsCount + 1)">+</button>
                    </div>
                  </div>
                  <div class="p-space-md rounded-xl bg-surface-secondary">
                    <p class="font-label-sm text-text-secondary">Длительность</p>
                    <p class="font-headline-sm mt-1">1 час</p>
                    <p class="font-body-sm text-text-muted mt-1">
                      {{ selectedTime ? `${selectedTime} — ${endTime}` : 'Выберите слот' }}
                    </p>
                  </div>
                </div>

                <div class="mt-space-md flex flex-col gap-space-sm">
                  <label class="flex items-center gap-space-sm p-space-sm rounded-xl bg-surface-secondary cursor-pointer">
                    <input v-model="needShoes" type="checkbox" class="w-5 h-5 accent-primary-pressed">
                    <div class="flex-1">
                      <p class="font-label-md">Прокатная обувь</p>
                      <p class="font-body-sm text-status-success">Бесплатно, если есть на площадке</p>
                    </div>
                  </label>
                  <label class="flex items-center gap-space-sm p-space-sm rounded-xl bg-surface-secondary cursor-pointer">
                    <input v-model="needBumpers" type="checkbox" class="w-5 h-5 accent-primary-pressed">
                    <div class="flex-1">
                      <p class="font-label-md">Детские бортики / доп. опции</p>
                      <p class="font-body-sm text-text-secondary">Передадим в комментарии к брони</p>
                    </div>
                  </label>
                </div>
              </section>

              <section class="bg-surface-page rounded-2xl p-space-md md:p-space-lg shadow-sm border border-border-default">
                <div class="flex items-center gap-space-sm mb-space-lg">
                  <span class="hidden md:flex w-8 h-8 rounded-xl bg-surface-soft-pink text-primary-pressed items-center justify-center">
                    <span class="material-symbols-outlined text-[20px]">badge</span>
                  </span>
                  <div>
                    <h2 class="font-headline-sm">3. Ваши контактные данные</h2>
                    <p class="hidden md:block font-body-sm text-text-secondary">На этот номер придёт подтверждение брони</p>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                  <label class="flex flex-col gap-1.5">
                    <span class="font-label-sm">Имя и фамилия</span>
                    <input
                      v-model="guestName"
                      class="h-12 px-space-md rounded-xl bg-surface-secondary border border-border-default font-body-md"
                      type="text"
                      placeholder="Ваше имя"
                    >
                  </label>
                  <label class="flex flex-col gap-1.5">
                    <span class="font-label-sm">Номер телефона</span>
                    <input
                      v-model="phone"
                      class="h-12 px-space-md rounded-xl bg-surface-secondary border border-border-default font-body-md"
                      type="tel"
                      placeholder="+998"
                      required
                    >
                  </label>
                </div>
                <label class="flex flex-col gap-1.5 mt-space-md">
                  <span class="font-label-sm">Пожелания <span class="text-text-muted font-normal">(необязательно)</span></span>
                  <textarea
                    v-model="comment"
                    class="p-space-md rounded-xl bg-surface-secondary border border-border-default font-body-md resize-none"
                    rows="2"
                    placeholder="Например: удобное расположение, день рождения"
                  />
                </label>
                <div class="flex flex-col gap-1.5 mt-space-md">
                  <span class="font-label-sm">Оплата</span>
                  <div class="grid grid-cols-2 gap-2">
                    <button
                      class="h-11 rounded-xl font-label-md"
                      :class="paymentMethod === 'cash' ? 'bg-primary-container' : 'bg-surface-secondary'"
                      type="button"
                      @click="paymentMethod = 'cash'"
                    >
                      На месте
                    </button>
                    <button
                      class="h-11 rounded-xl font-label-md"
                      :class="paymentMethod === 'card' ? 'bg-primary-container' : 'bg-surface-secondary'"
                      type="button"
                      @click="paymentMethod = 'card'"
                    >
                      Карта
                    </button>
                  </div>
                </div>

                <div class="mt-space-lg p-space-md rounded-xl bg-status-success-bg flex items-start gap-space-sm">
                  <span class="material-symbols-outlined text-status-success">check_circle</span>
                  <p class="font-body-sm">
                    <span class="font-semibold">Бесплатная отмена по правилам площадки.</span>
                    {{ offer.autoConfirmBooking ? 'Слот подтверждается сразу.' : 'Площадка подтвердит заявку после отправки.' }}
                  </p>
                </div>
              </section>
            </div>

            <aside class="hidden lg:block lg:col-span-4 sticky top-24">
              <div class="bg-surface-page rounded-2xl p-space-lg shadow-sm border border-border-default flex flex-col gap-space-md">
                <div class="flex gap-space-sm items-start">
                  <img :src="coverImage" :alt="offer.title" class="w-20 h-20 rounded-xl object-cover">
                  <div>
                    <span v-if="categoryLabel" class="font-label-sm text-primary-pressed uppercase tracking-wider">{{ categoryLabel }}</span>
                    <h3 class="font-headline-sm leading-snug">{{ offer.title }}</h3>
                    <p v-if="offer.branchAddress" class="font-body-sm text-text-secondary mt-0.5 inline-flex items-center gap-1">
                      <span class="material-symbols-outlined text-[16px] text-text-muted">location_on</span>
                      {{ offer.branchAddress }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center justify-between py-space-xs px-space-sm rounded-lg bg-surface-secondary font-label-sm">
                  <span v-if="offer.rating" class="inline-flex items-center gap-1 font-bold">
                    <span class="material-symbols-outlined filled text-status-warning text-[18px]">star</span>
                    {{ offer.rating.toFixed(1) }}
                    <span class="text-text-muted font-normal">({{ offer.reviewCount || 0 }})</span>
                  </span>
                  <span class="inline-flex items-center gap-1 text-status-success">
                    <span class="material-symbols-outlined text-[16px]">verified</span>
                    Проверено LocaFun
                  </span>
                </div>
                <div class="h-px bg-border-default" />
                <div class="space-y-space-xs font-body-sm">
                  <div class="flex justify-between text-text-secondary">
                    <span>Дата</span>
                    <span class="font-semibold text-text-primary capitalize">{{ dateShort }}</span>
                  </div>
                  <div class="flex justify-between text-text-secondary">
                    <span>Время сеанса</span>
                    <span class="font-semibold text-text-primary">{{ selectedTime ? `${selectedTime} — ${endTime}` : '—' }}</span>
                  </div>
                  <div class="flex justify-between text-text-secondary">
                    <span>Гости</span>
                    <span class="font-semibold text-text-primary">{{ personsLabel }}</span>
                  </div>
                  <div class="flex justify-between text-text-secondary">
                    <span>Сервисный сбор</span>
                    <span class="text-status-success font-semibold">0 сум</span>
                  </div>
                </div>
                <div class="h-px bg-border-default" />
                <div class="flex justify-between items-baseline">
                  <span class="font-headline-sm">К оплате</span>
                  <span class="font-headline-md font-extrabold">{{ formatPrice(unitPrice) || 'по запросу' }}</span>
                </div>
                <p v-if="submitError" class="font-body-sm text-status-error">{{ submitError }}</p>
                <button
                  class="w-full h-12 rounded-xl bg-primary-container hover:bg-primary-hover text-text-primary font-label-lg flex items-center justify-center gap-2"
                  type="button"
                  :disabled="isSubmitting"
                  @click="handleSubmit"
                >
                  {{ isSubmitting ? 'Отправка…' : 'Подтвердить бронирование' }}
                  <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
                <p class="text-center font-body-sm text-text-secondary">
                  Оплата {{ paymentMethod === 'card' ? 'картой' : 'на месте' }}
                </p>
                <div class="p-space-sm rounded-xl bg-surface-soft-pink flex items-start gap-space-xs">
                  <span class="material-symbols-outlined text-primary-pressed text-[20px]">verified_user</span>
                  <p class="font-label-sm leading-tight">
                    <span class="font-bold">Гарантия брони LocaFun:</span> слот закрепляется после подтверждения.
                  </p>
                </div>
              </div>
            </aside>
          </div>

          <div class="lg:hidden mt-space-md">
            <button class="font-label-md text-primary-pressed inline-flex items-center gap-1" type="button" @click="showBreakdown = !showBreakdown">
              <span class="material-symbols-outlined text-[18px]">receipt_long</span>
              Смотреть детали заказа
            </button>
            <div v-if="showBreakdown" class="mt-2 p-3.5 rounded-xl bg-surface-secondary font-body-sm space-y-2">
              <div class="flex justify-between"><span>Дата</span><span>{{ dateShort }}</span></div>
              <div class="flex justify-between"><span>Слот</span><span>{{ selectedTime || '—' }}</span></div>
              <div class="flex justify-between"><span>Гости</span><span>{{ personsLabel }}</span></div>
              <div class="flex justify-between"><span>Тариф</span><span>{{ formatPrice(unitPrice) || 'по запросу' }}</span></div>
            </div>
            <p v-if="submitError" class="font-body-sm text-status-error mt-2">{{ submitError }}</p>
          </div>
        </div>
      </template>
    </main>

    <div v-if="offer && !submitSuccess" class="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-page shadow-[0_-4px_20px_rgba(23,23,23,0.06)] px-margin-mobile py-3 pb-safe">
      <div class="flex items-center justify-between gap-space-sm">
        <div>
          <p class="font-label-sm text-[11px] text-text-secondary uppercase">Итого к оплате</p>
          <p class="font-headline-sm">{{ formatPrice(unitPrice) || 'по запросу' }}</p>
        </div>
        <button
          class="shrink-0 h-12 px-5 rounded-xl bg-primary-container text-text-primary font-label-lg inline-flex items-center gap-1"
          type="button"
          :disabled="isSubmitting"
          @click="handleSubmit"
        >
          Забронировать
          <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>
    </div>

    <div
      v-if="submitSuccess"
      class="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-text-primary/60 backdrop-blur-sm"
    >
      <div class="bg-surface-page rounded-2xl max-w-lg w-full p-space-xl border border-border-default">
        <div class="w-16 h-16 rounded-full bg-status-success-bg text-status-success flex items-center justify-center mx-auto mb-space-md">
          <span class="material-symbols-outlined text-[36px]">check_circle</span>
        </div>
        <div class="text-center mb-space-lg">
          <span class="font-label-sm bg-primary-container/50 px-3 py-1 rounded-full font-bold">
            Бронь {{ createdBookingId ? `#${createdBookingId.slice(0, 8)}` : 'создана' }}
          </span>
          <h3 class="font-headline-md mt-space-sm">Бронирование подтверждено</h3>
          <p class="font-body-md text-text-secondary mt-1">
            {{ offer?.autoConfirmBooking ? 'Слот подтверждён автоматически.' : 'Заявка отправлена площадке.' }}
          </p>
        </div>
        <div class="bg-surface-secondary rounded-xl p-space-md space-y-space-xs mb-space-lg font-body-sm">
          <div class="flex justify-between"><span class="text-text-secondary">Локация</span><span class="font-semibold">{{ offer?.title }}</span></div>
          <div class="flex justify-between"><span class="text-text-secondary">Время</span><span class="font-semibold capitalize">{{ dateLong }}, {{ selectedTime }}</span></div>
          <div class="flex justify-between"><span class="text-text-secondary">Гости</span><span class="font-semibold">{{ personsLabel }}</span></div>
        </div>
        <div class="flex flex-col gap-space-sm">
          <NuxtLink
            v-if="createdBookingId"
            :to="`/profile/bookings/${createdBookingId}`"
            class="w-full h-12 rounded-xl bg-primary-container font-label-lg flex items-center justify-center gap-2"
          >
            <span class="material-symbols-outlined">confirmation_number</span>
            Показать бронь
          </NuxtLink>
          <div class="grid grid-cols-2 gap-space-sm">
            <NuxtLink to="/profile/bookings" class="h-11 rounded-xl bg-surface-secondary font-label-md flex items-center justify-center">
              Мои брони
            </NuxtLink>
            <NuxtLink :to="offerBackHref" class="h-11 rounded-xl border border-border-default font-label-md flex items-center justify-center">
              К предложению
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
