<script setup lang="ts">
import {
  useBooking,
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_BADGE,
  PAYMENT_METHOD_LABELS,
  type Booking,
} from '~/composables/booking'
import { useChat } from '~/composables/chat'
import { useLogged } from '~/composables/states'

definePageMeta({ middleware: [] })

const logged = useLogged()
if (!logged.value) {
  await navigateTo('/')
}

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const id = route.params.id as string

const { getBookingById, cancelBooking } = useBooking()
const { openChat } = useChat()

const booking = ref<Booking | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const isCancelling = ref(false)
const cancelError = ref('')
const showCancelConfirm = ref(false)
const isChatLoading = ref(false)

async function load() {
  loading.value = true
  error.value = null
  try {
    booking.value = await getBookingById(id)
  } catch {
    error.value = 'Не удалось загрузить бронь. Проверьте, что вы вошли в аккаунт.'
  } finally {
    loading.value = false
  }
}

onMounted(() => load())

async function handleCancel() {
  if (!booking.value) return
  isCancelling.value = true
  cancelError.value = ''
  try {
    booking.value = await cancelBooking(booking.value.id)
    showCancelConfirm.value = false
  } catch (e: any) {
    cancelError.value = e?._data?.message ?? 'Ошибка при отмене'
  } finally {
    isCancelling.value = false
  }
}

async function handleOpenChat() {
  if (!booking.value) return
  isChatLoading.value = true
  try {
    const chat = await openChat(booking.value.offerId)
    await router.push(`/profile/chats/${chat.id}`)
  } catch {
    await router.push('/profile/chats')
  } finally {
    isChatLoading.value = false
  }
}

function getCoverImage(): string | null {
  const img = booking.value?.offer?.images?.[0]
  if (!img) return null
  if (img.startsWith('http')) return img
  return `${config.public.BASE_API_URL?.replace('/api', '')}${img}`
}

function formatBookingDate(): string {
  if (!booking.value) return ''
  try {
    const d = new Date(booking.value.date + 'T00:00:00')
    return d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return booking.value.date
  }
}

function formatTs(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const isActive = computed(() => booking.value?.status === 'active')
const isConfirmed = computed(() => booking.value?.status === 'confirmed')
const canCancel = computed(() =>
  booking.value?.status === 'pending' || booking.value?.status === 'confirmed',
)
const showSecretCode = computed(() =>
  (isConfirmed.value || isActive.value) && booking.value?.secretCode,
)
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-xl">
    <!-- Back -->
    <div class="flex items-center gap-2 mb-6">
      <button class="btn btn-ghost btn-sm btn-circle" @click="router.push('/profile/bookings')">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1 class="text-xl font-bold">Детали брони</h1>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-16">
      <span class="loading loading-spinner loading-lg text-primary" />
    </div>

    <div v-else-if="error" class="alert alert-error">{{ error }}</div>

    <template v-else-if="booking">

      <!-- Secret code block — shown prominently at the top -->
      <div
        v-if="showSecretCode"
        class="rounded-2xl p-6 mb-4 text-center"
        :class="isActive ? 'bg-success/10 border-2 border-success' : 'bg-base-200 border border-base-300'"
      >
        <p class="text-sm font-medium mb-2"
           :class="isActive ? 'text-success' : 'text-base-content/60'">
          {{ isActive ? 'Назовите этот код продавцу' : 'Ваш секретный код' }}
        </p>
        <p
          class="font-mono font-bold tracking-[0.4em] select-all"
          :class="isActive ? 'text-5xl text-success' : 'text-3xl'"
        >
          {{ booking.secretCode }}
        </p>
        <p v-if="!isActive" class="text-xs text-base-content/40 mt-3">
          Показывайте код только после прибытия на место
        </p>
        <div v-if="isActive" class="flex items-center justify-center gap-1.5 mt-3">
          <span class="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span class="text-xs text-success font-medium">Бронь активирована</span>
        </div>
      </div>

      <!-- Offer preview -->
      <div class="rounded-2xl border border-base-200 bg-base-100 shadow-sm overflow-hidden mb-4">
        <div v-if="getCoverImage()" class="h-36 overflow-hidden">
          <img :src="getCoverImage()!" :alt="booking.offer?.title" class="w-full h-full object-cover" />
        </div>
        <div class="p-4 flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="font-semibold truncate">{{ booking.offer?.title ?? '—' }}</p>
            <p v-if="booking.offer?.branchAddress" class="text-sm text-base-content/50 mt-0.5 truncate">
              {{ booking.offer.branchAddress }}
            </p>
          </div>
          <span
            class="badge badge-md flex-shrink-0"
            :class="BOOKING_STATUS_BADGE[booking.status]"
          >
            {{ BOOKING_STATUS_LABELS[booking.status] }}
          </span>
        </div>
      </div>

      <!-- Details -->
      <div class="rounded-2xl border border-base-200 bg-base-100 shadow-sm p-5 mb-4">
        <h2 class="font-semibold text-sm text-base-content/50 uppercase tracking-wide mb-4">
          Детали бронирования
        </h2>
        <dl class="space-y-3">
          <div class="flex items-center justify-between text-sm">
            <dt class="text-base-content/50 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              Дата и время
            </dt>
            <dd class="font-medium text-right">{{ formatBookingDate() }}, {{ booking.time }}</dd>
          </div>
          <div class="flex items-center justify-between text-sm">
            <dt class="text-base-content/50 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              Количество персон
            </dt>
            <dd class="font-medium">{{ booking.personsCount }} чел.</dd>
          </div>
          <div class="flex items-center justify-between text-sm">
            <dt class="text-base-content/50 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
              </svg>
              Телефон
            </dt>
            <dd class="font-medium">{{ booking.phone }}</dd>
          </div>
          <div class="flex items-center justify-between text-sm">
            <dt class="text-base-content/50 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
              </svg>
              Способ оплаты
            </dt>
            <dd class="font-medium">{{ PAYMENT_METHOD_LABELS[booking.paymentMethod] }}</dd>
          </div>
          <div v-if="booking.comment" class="text-sm">
            <dt class="text-base-content/50 mb-1">Пожелания</dt>
            <dd class="italic text-base-content/70 bg-base-200 rounded-lg px-3 py-2">{{ booking.comment }}</dd>
          </div>
        </dl>
      </div>

      <!-- Timeline -->
      <div class="rounded-2xl border border-base-200 bg-base-100 shadow-sm p-5 mb-4">
        <h2 class="font-semibold text-sm text-base-content/50 uppercase tracking-wide mb-3">История</h2>
        <ol class="relative border-l border-base-300 space-y-4 ml-2">
          <li class="ml-4">
            <div class="absolute -left-1.5 w-3 h-3 rounded-full bg-base-300 border border-base-100" />
            <p class="text-xs text-base-content/40">{{ formatTs(booking.createdAt) }}</p>
            <p class="text-sm font-medium">Бронь создана</p>
          </li>
          <li v-if="booking.confirmedAt" class="ml-4">
            <div class="absolute -left-1.5 w-3 h-3 rounded-full bg-info border border-base-100" />
            <p class="text-xs text-base-content/40">{{ formatTs(booking.confirmedAt) }}</p>
            <p class="text-sm font-medium text-info">Подтверждена продавцом</p>
          </li>
          <li v-if="booking.activatedAt" class="ml-4">
            <div class="absolute -left-1.5 w-3 h-3 rounded-full bg-success border border-base-100" />
            <p class="text-xs text-base-content/40">{{ formatTs(booking.activatedAt) }}</p>
            <p class="text-sm font-medium text-success">Активирована</p>
          </li>
          <li v-if="booking.status === 'completed'" class="ml-4">
            <div class="absolute -left-1.5 w-3 h-3 rounded-full bg-neutral border border-base-100" />
            <p class="text-xs text-base-content/40">{{ formatTs(booking.updatedAt) }}</p>
            <p class="text-sm font-medium">Завершена</p>
          </li>
          <li v-if="booking.cancelledAt" class="ml-4">
            <div class="absolute -left-1.5 w-3 h-3 rounded-full bg-error border border-base-100" />
            <p class="text-xs text-base-content/40">{{ formatTs(booking.cancelledAt) }}</p>
            <p class="text-sm font-medium text-error">
              Отменена {{ booking.cancelledBy === 'seller' ? 'продавцом' : 'вами' }}
            </p>
            <p v-if="booking.cancelReason" class="text-xs text-base-content/50 italic mt-0.5">
              {{ booking.cancelReason }}
            </p>
          </li>
        </ol>
      </div>

      <!-- Actions -->
      <div class="flex flex-col gap-3">
        <button
          class="btn btn-outline w-full gap-2"
          :class="isChatLoading ? 'loading' : ''"
          :disabled="isChatLoading"
          @click="handleOpenChat"
        >
          <svg v-if="!isChatLoading" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
          Написать продавцу
        </button>

        <button
          v-if="canCancel"
          class="btn btn-error btn-outline w-full"
          @click="showCancelConfirm = true"
        >
          Отменить бронь
        </button>
      </div>
    </template>

    <!-- Cancel modal -->
    <Teleport to="body">
      <div
        v-if="showCancelConfirm"
        class="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
        @click.self="showCancelConfirm = false"
      >
        <div class="bg-base-100 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
          <h3 class="text-lg font-bold mb-2">Отменить бронь?</h3>
          <p class="text-sm text-base-content/60 mb-4">
            Это действие необратимо. Продавец получит уведомление об отмене.
          </p>
          <div v-if="cancelError" class="alert alert-error text-sm mb-3 py-2">{{ cancelError }}</div>
          <div class="flex gap-3">
            <button
              class="btn btn-ghost flex-1"
              :disabled="isCancelling"
              @click="showCancelConfirm = false"
            >
              Назад
            </button>
            <button
              class="btn btn-error flex-1"
              :disabled="isCancelling"
              @click="handleCancel"
            >
              <span v-if="isCancelling" class="loading loading-spinner loading-xs" />
              Отменить
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
