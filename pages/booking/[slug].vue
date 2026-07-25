<script setup lang="ts">
import VueDatePicker from '@vuepic/vue-datepicker'
import { breakpointsTailwind } from '@vueuse/core'
import { getProductBySlug, getProductById } from '~/composables/product'
import {
  useBooking,
  getClosedWeekDays,
  getScheduleForDate,
  type PaymentMethod,
} from '~/composables/booking'
import { useLogged } from '~/composables/states'

const route = useRoute()
const router = useRouter()
const slug = route.params.slug as string

useAppSeo({
  title: 'Бронирование | LocaFun',
  description: 'Оформление бронирования на LocaFun',
  canonical: () => `/booking/${slug}`,
  noindex: true,
})

const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function getOfferBySlugOrId(slugOrId: string) {
  if (uuidV4Regex.test(slugOrId)) return getProductById(slugOrId)
  return getProductBySlug(slugOrId)
}

const { lg } = useBreakpoints(breakpointsTailwind, { ssrWidth: 768 })
const { createBooking } = useBooking()
const logged = useLogged()

const offer = ref<Awaited<ReturnType<typeof getProductBySlug>> | null>(null)
const isOfferLoading = ref(true)
const offerError = ref('')

const date = ref<Date | null>(null)
const time = ref<{ hours: number; minutes: number } | null>(null)
const personsCount = ref(1)
const phone = ref('')
const comment = ref('')
const paymentMethod = ref<PaymentMethod>('cash')

const isSubmitting = ref(false)
const submitError = ref('')
const submitSuccess = ref(false)
const createdBookingId = ref<string | null>(null)

const paymentOptions = [
  { name: 'Наличные', value: 'cash' },
  { name: 'Банковская карта', value: 'card' },
]

onMounted(async () => {
  try {
    offer.value = await getOfferBySlugOrId(slug)
  } catch {
    offerError.value = 'Предложение не найдено'
  } finally {
    isOfferLoading.value = false
  }
})

const disabledWeekDays = computed(() =>
  getClosedWeekDays(offer.value?.workSchedule),
)

const selectedDaySchedule = computed(() => {
  if (!date.value || !offer.value?.workSchedule?.length) return null
  return getScheduleForDate(offer.value.workSchedule, date.value)
})

const timeHint = computed(() => {
  const s = selectedDaySchedule.value
  if (!s || s.isClosed) return null
  if (!s.openTime || !s.closeTime) return null
  return `Доступно с ${s.openTime} до ${s.closeTime}`
})

const coverImage = computed(() => {
  const img = offer.value?.images?.[0]
  if (!img) return null
  if (img.startsWith('http')) return img
  const config = useRuntimeConfig()
  return `${config.public.BASE_API_URL?.replace('/api', '')}${img}`
})

function formatDateStr(d: Date | null): string | null {
  if (!d) return null
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatTimeStr(t: { hours: number; minutes: number } | null): string | null {
  if (!t) return null
  return `${String(t.hours).padStart(2, '0')}:${String(t.minutes).padStart(2, '0')}`
}

async function handleSubmit() {
  if (!logged.value) {
    await router.push('/')
    return
  }
  if (!offer.value) return
  if (!date.value || !time.value) {
    submitError.value = 'Выберите дату и время'
    return
  }

  const dateStr = formatDateStr(date.value)!
  const timeStr = formatTimeStr(time.value)!

  submitError.value = ''
  isSubmitting.value = true

  try {
    const booking = await createBooking({
      offerId: offer.value.id,
      date: dateStr,
      time: timeStr,
      personsCount: personsCount.value,
      phone: phone.value,
      comment: comment.value || undefined,
      paymentMethod: paymentMethod.value,
    })
    createdBookingId.value = booking.id
    submitSuccess.value = true
  } catch (e: any) {
    const msg = e?._data?.message
    submitError.value = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Ошибка при создании брони')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col container px-4 mx-auto py-10">
    <div v-if="isOfferLoading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg text-primary" />
    </div>

    <div v-else-if="offerError" class="alert alert-error max-w-md mx-auto">{{ offerError }}</div>

    <template v-else-if="offer">
      <!-- Success state -->
      <div v-if="submitSuccess" class="max-w-md mx-auto text-center py-12 space-y-4">
        <div class="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h2 class="text-2xl font-bold">Бронь создана!</h2>
        <p class="text-base-content/60">
          {{ offer.autoConfirmBooking
            ? 'Ваша бронь автоматически подтверждена. Проверьте личный кабинет.'
            : 'Ваша заявка отправлена. Ожидайте подтверждения от продавца.'
          }}
        </p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <NuxtLink
            v-if="createdBookingId"
            :to="`/profile/bookings/${createdBookingId}`"
            class="btn btn-primary"
          >
            Посмотреть бронь
          </NuxtLink>
          <NuxtLink to="/profile/bookings" class="btn btn-ghost">
            Мои брони
          </NuxtLink>
        </div>
      </div>

      <!-- Booking form -->
      <template v-else>
        <h1 class="text-2xl font-bold mb-2">Забронировать</h1>
        <p class="text-base-content/60 mb-6">{{ offer.title }}</p>

        <div class="flex lg:flex-row flex-col gap-6 pt-2">
          <!-- Offer preview -->
          <div class="flex-shrink-0 w-full lg:w-64">
            <div class="rounded-2xl overflow-hidden border border-base-200 bg-base-100 shadow-sm">
              <div class="h-40 bg-base-200">
                <img
                  v-if="coverImage"
                  :src="coverImage"
                  :alt="offer.title"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-base-content/20">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
              </div>
              <div class="p-4">
                <p class="font-semibold text-sm">{{ offer.title }}</p>
                <p v-if="offer.branchAddress" class="text-xs text-base-content/50 mt-1">
                  {{ offer.branchAddress }}
                </p>
                <div v-if="offer.autoConfirmBooking" class="mt-3 flex items-center gap-1.5 text-xs text-success">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  Автоподтверждение
                </div>
              </div>
            </div>

            <!-- Work schedule -->
            <div v-if="offer.workSchedule?.length" class="mt-4 bg-base-100 rounded-2xl border border-base-200 p-4">
              <p class="text-sm font-semibold mb-3">График работы</p>
              <ul class="space-y-1.5">
                <li
                  v-for="day in offer.workSchedule"
                  :key="day.day"
                  class="flex items-center justify-between text-xs"
                  :class="day.isClosed ? 'text-base-content/30' : 'text-base-content/70'"
                >
                  <span>{{ ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'][day.day] }}</span>
                  <span>{{ day.isClosed ? 'Выходной' : `${day.openTime} – ${day.closeTime}` }}</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Form -->
          <form
            class="flex flex-col gap-3 lg:gap-4 w-full md:w-2/3 lg:w-1/2 px-4 py-8 shadow-xl bg-base-100 border-gray-300 border rounded-2xl"
            @submit.prevent="handleSubmit"
          >
            <!-- Date -->
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Дата</label>
              <VueDatePicker
                v-model="date"
                placeholder="Выберите дату"
                locale="ru-Ru"
                cancel-text="Закрыть"
                select-text="Выбрать"
                :format="'dd.MM.yyyy'"
                :preview-format="'dd.MM.yyyy'"
                :enable-time-picker="false"
                input-class-name="h-12"
                :disable-year-select="false"
                :min-date="new Date()"
                :disabled-week-days="disabledWeekDays"
              />
            </div>

            <!-- Time -->
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">
                Время
                <span v-if="timeHint" class="text-xs text-base-content/50 ml-1 font-normal">
                  ({{ timeHint }})
                </span>
              </label>
              <VueDatePicker
                v-model="time"
                placeholder="Выберите время"
                time-picker
                locale="ru-Ru"
                :format="'HH:mm'"
                cancel-text="Закрыть"
                select-text="Выбрать"
              />
            </div>

            <!-- Persons count -->
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Количество персон</label>
              <input
                v-model.number="personsCount"
                type="number"
                min="1"
                max="100"
                class="input input-bordered"
                :class="lg ? 'input-lg' : ''"
                placeholder="1"
                required
              />
            </div>

            <!-- Phone -->
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Номер для связи</label>
              <input
                v-model="phone"
                type="tel"
                class="input input-bordered"
                :class="lg ? 'input-lg' : ''"
                placeholder="+7 999 123-45-67"
                required
              />
            </div>

            <!-- Payment method -->
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Способ оплаты</label>
              <select
                v-model="paymentMethod"
                class="select select-bordered"
                :class="lg ? 'select-lg' : ''"
              >
                <option
                  v-for="opt in paymentOptions"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.name }}
                </option>
              </select>
            </div>

            <!-- Comment -->
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Пожелания (необязательно)</label>
              <textarea
                v-model="comment"
                class="textarea textarea-bordered resize-none"
                :class="lg ? 'textarea-lg' : ''"
                placeholder="Стол у окна, без орехов..."
                rows="2"
              />
            </div>

            <div v-if="submitError" class="alert alert-error text-sm py-2">{{ submitError }}</div>

            <button
              type="submit"
              class="btn btn-primary mt-2"
              :class="lg ? 'btn-lg' : ''"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting" class="loading loading-spinner loading-sm" />
              Забронировать
            </button>

            <p v-if="!logged" class="text-xs text-base-content/50 text-center mt-1">
              Для бронирования необходимо
              <NuxtLink to="/auth/login" class="link link-primary">войти в аккаунт</NuxtLink>
            </p>
          </form>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.dp__main :deep(.dp__theme_light) {
  --dp-highlight-color: rgba(34, 233, 8, 0.993);
  --dp-primary-color: var(--color-primary);
  --dp-primary-text-color: var(--color-primary-content);
}

@media (max-width: 1023px) {
  :deep(.dp__input) {
    padding: 7.5px 40px !important;
  }
}
@media (min-width: 1024px) {
  :deep(.dp__input) {
    padding: 11.5px 40px !important;
  }
}
</style>
