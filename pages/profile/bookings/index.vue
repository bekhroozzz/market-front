<script setup lang="ts">
import {
  useBooking,
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_BADGE,
  type Booking,
} from '~/composables/booking'
import { useLogged } from '~/composables/states'

definePageMeta({ middleware: [] })

useAppSeo({ title: 'Мои брони | LocaFun', noindex: true })

const logged = useLogged()
if (!logged.value) {
  await navigateTo('/')
}

const { getMyBookings } = useBooking()
const config = useRuntimeConfig()

const activeTab = ref<'active' | 'history'>('active')
const bookings = ref<Booking[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

async function load(tab: 'active' | 'history') {
  loading.value = true
  error.value = null
  try {
    bookings.value = await getMyBookings(tab)
  } catch {
    error.value = 'Не удалось загрузить брони'
  } finally {
    loading.value = false
  }
}

onMounted(() => load('active'))

async function switchTab(tab: 'active' | 'history') {
  if (activeTab.value === tab) return
  activeTab.value = tab
  await load(tab)
}

function getImage(booking: Booking): string | null {
  const img = booking.offer?.images?.[0]
  if (!img) return null
  if (img.startsWith('http')) return img
  return `${config.public.BASE_API_URL?.replace('/api', '')}${img}`
}

function formatBookingDate(booking: Booking): string {
  try {
    const d = new Date(booking.date + 'T00:00:00')
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
  } catch {
    return booking.date
  }
}

const activeCount = computed(() =>
  activeTab.value === 'active' ? bookings.value.length : null,
)
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-2xl">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/profile" class="btn btn-ghost btn-sm btn-circle">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </NuxtLink>
      <h1 class="text-2xl font-bold">Мои брони</h1>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 p-1 bg-base-200 rounded-xl mb-6">
      <button
        class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all"
        :class="activeTab === 'active'
          ? 'bg-base-100 text-base-content shadow-sm'
          : 'text-base-content/50 hover:text-base-content'"
        @click="switchTab('active')"
      >
        Активные
      </button>
      <button
        class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all"
        :class="activeTab === 'history'
          ? 'bg-base-100 text-base-content shadow-sm'
          : 'text-base-content/50 hover:text-base-content'"
        @click="switchTab('history')"
      >
        История
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-16">
      <span class="loading loading-spinner loading-lg text-primary" />
    </div>

    <div v-else-if="error" class="alert alert-error">{{ error }}</div>

    <!-- Empty state -->
    <div v-else-if="!bookings.length" class="text-center py-16">
      <div class="w-16 h-16 rounded-2xl bg-base-200 flex items-center justify-center mx-auto mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
      </div>
      <p class="font-semibold text-lg text-base-content/70">
        {{ activeTab === 'active' ? 'Нет активных броней' : 'История пуста' }}
      </p>
      <p class="text-sm text-base-content/40 mt-1 mb-5">
        {{ activeTab === 'active'
          ? 'Найдите заведение и забронируйте прямо сейчас'
          : 'Завершённые и отменённые брони появятся здесь'
        }}
      </p>
      <NuxtLink v-if="activeTab === 'active'" to="/" class="btn btn-primary btn-sm">
        Перейти в каталог
      </NuxtLink>
    </div>

    <!-- Booking cards -->
    <div v-else class="flex flex-col gap-3">
      <NuxtLink
        v-for="booking in bookings"
        :key="booking.id"
        :to="`/profile/bookings/${booking.id}`"
        class="block rounded-2xl border border-base-200 hover:border-primary/50 hover:shadow-md transition-all bg-base-100 overflow-hidden"
      >
        <div class="flex gap-3 p-4">
          <!-- Image -->
          <div class="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-base-200">
            <img
              v-if="getImage(booking)"
              :src="getImage(booking)!"
              :alt="booking.offer?.title"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-base-content/20">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2 mb-1">
              <p class="font-semibold text-sm truncate leading-tight">{{ booking.offer?.title ?? '—' }}</p>
              <span
                class="badge badge-sm flex-shrink-0"
                :class="BOOKING_STATUS_BADGE[booking.status]"
              >
                {{ BOOKING_STATUS_LABELS[booking.status] }}
              </span>
            </div>
            <div class="flex items-center gap-3 text-xs text-base-content/50">
              <span class="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                {{ formatBookingDate(booking) }}, {{ booking.time }}
              </span>
              <span class="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {{ booking.personsCount }} чел.
              </span>
            </div>

            <!-- Status-specific info -->
            <div
              v-if="booking.status === 'confirmed' && booking.secretCode"
              class="mt-2 inline-flex items-center gap-1.5 text-xs bg-success/10 text-success px-2 py-1 rounded-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
              </svg>
              Код подтверждения получен
            </div>
            <div
              v-if="booking.status === 'active'"
              class="mt-2 inline-flex items-center gap-1.5 text-xs bg-success/10 text-success px-2 py-1 rounded-lg font-medium"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Активна — назовите код продавцу
            </div>
            <div
              v-if="booking.status === 'pending'"
              class="mt-2 text-xs text-warning/80"
            >
              Ожидает подтверждения продавца
            </div>
          </div>

          <!-- Chevron -->
          <div class="self-center flex-shrink-0 text-base-content/20">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
