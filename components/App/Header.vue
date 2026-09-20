<script setup lang="ts">
import { useModal, useModalSlot } from 'vue-final-modal'
import { LazyAuthSignup, LazyModalTemplate } from '#components'
import { HOME_CITIES } from '~/composables/home'
import { useLogged } from '~/composables/states'
import { useLogout } from '~/composables/auth'
import { useNotificationStore } from '~/stores/notification'

const route = useRoute()
const router = useRouter()
const isLogged = useLogged()
const notifStore = useNotificationStore()
const selectedCity = useSelectedCity()
const {
  title: chromeTitle,
  backHref,
  favorite,
  showFavorite,
  showShare,
  triggerShare,
} = useAppChrome()

const cityOpen = ref(false)

const isProduct = computed(() => route.path.startsWith('/product/'))
const isBooking = computed(() => route.path.startsWith('/booking/'))

const navItems = computed(() => [
  { to: '/', label: 'Explore', match: route.path === '/', auth: false },
  { to: '/catalog', label: 'Categories', match: route.path.startsWith('/catalog'), auth: false },
  { to: '/profile/bookings', label: 'Bookings', match: route.path.startsWith('/profile/bookings'), auth: true },
  { to: '/profile/chats', label: 'Messages', match: route.path.startsWith('/profile/chats'), auth: true },
])

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

function openAccount() {
  if (isLogged.value) {
    void navigateTo('/profile')
    return
  }
  authModal.open()
}

async function logout() {
  useLogout()
  await navigateTo('/')
}

function pickCity(name: string) {
  selectedCity.value = name
  cityOpen.value = false
}

function handleBack() {
  if (backHref.value) {
    void navigateTo(backHref.value)
    return
  }
  if (import.meta.client && window.history.length > 1) {
    router.back()
    return
  }
  void navigateTo('/')
}

function handleShare() {
  triggerShare()
}

watch(() => route.path, () => {
  cityOpen.value = false
})
</script>

<template>
  <header class="fixed top-0 inset-x-0 z-50 bg-surface-page/95 backdrop-blur-md shadow-[0_1px_8px_rgba(23,23,23,0.04)] border-b border-border-default">
    <!-- Booking desktop -->
    <div
      v-if="isBooking"
      class="hidden md:flex h-16 max-w-[1440px] mx-auto px-margin items-center justify-between"
    >
      <div class="flex items-center gap-gutter">
        <NuxtLink to="/" class="font-headline-sm font-headline tracking-tight">
          Loca<span class="text-primary-pressed">Fun</span>
        </NuxtLink>
        <span class="h-6 w-px bg-border-default" />
        <NuxtLink
          :to="backHref || '/'"
          class="inline-flex items-center gap-space-xs text-text-secondary hover:text-text-primary font-label-md"
        >
          <span class="material-symbols-outlined text-[18px]">arrow_back</span>
          Вернуться к предложению
        </NuxtLink>
      </div>
      <div class="flex items-center gap-space-lg">
        <span class="hidden lg:inline-flex items-center gap-space-xs text-text-secondary font-label-sm">
          <span class="material-symbols-outlined text-status-success text-[18px]">verified_user</span>
          100% безопасная бронь
        </span>
        <button class="w-9 h-9 rounded-full bg-surface-secondary" type="button" @click="openAccount">
          <span class="material-symbols-outlined text-[18px]">person</span>
        </button>
        <button v-if="isLogged" class="font-label-sm text-text-secondary" type="button" @click="logout">
          Выйти
        </button>
      </div>
    </div>

    <!-- Default / product desktop -->
    <div
      v-else
      class="hidden md:flex h-20 max-w-[1440px] mx-auto px-margin items-center justify-between gap-gutter"
    >
      <div class="flex items-center gap-space-2xl min-w-0">
        <NuxtLink to="/" class="font-headline-sm font-headline tracking-tight shrink-0">
          Loca<span class="text-primary-pressed">Fun</span>
        </NuxtLink>
        <div class="relative hidden sm:block">
          <button
            class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-secondary text-text-primary font-label-sm hover:bg-surface-container-low"
            type="button"
            @click="cityOpen = !cityOpen"
          >
            <span class="material-symbols-outlined text-[16px] text-text-secondary">location_on</span>
            <span>{{ selectedCity }}</span>
            <span class="material-symbols-outlined text-[16px] text-text-secondary">expand_more</span>
          </button>
          <div
            v-if="cityOpen"
            class="absolute left-0 mt-2 w-48 rounded-2xl bg-surface-page shadow-lg border border-border-default py-1 z-50"
          >
            <button
              v-for="city in HOME_CITIES"
              :key="city.value"
              class="w-full text-left px-4 py-2 font-label-sm hover:bg-surface-secondary"
              :class="city.name === selectedCity ? 'text-primary-pressed' : 'text-text-primary'"
              type="button"
              @click="pickCity(city.name)"
            >
              {{ city.name }}
            </button>
          </div>
        </div>
        <nav class="hidden lg:flex items-center gap-space-sm">
          <template v-for="item in navItems" :key="item.to">
            <NuxtLink
              v-if="!item.auth || isLogged"
              :to="item.to"
              class="font-label-md px-space-md py-space-xs rounded-full"
              :class="item.match
                ? 'bg-surface-soft-pink text-primary-pressed'
                : 'text-text-secondary hover:text-text-primary'"
            >
              {{ item.label }}
            </NuxtLink>
            <button
              v-else
              class="font-label-md px-space-md py-space-xs rounded-full text-text-secondary hover:text-text-primary"
              type="button"
              @click="authModal.open()"
            >
              {{ item.label }}
            </button>
          </template>
        </nav>
      </div>
      <div class="flex items-center gap-space-md">
        <NuxtLink
          to="/contact"
          class="hidden sm:inline-flex items-center justify-center font-label-md px-space-lg h-12 rounded-xl"
          :class="isProduct
            ? 'bg-surface-soft-pink text-text-primary hover:bg-primary-container'
            : 'bg-surface-page border border-border-default text-text-primary hover:border-text-primary'"
        >
          Стать партнёром
        </NuxtLink>
        <NuxtLink
          v-if="isLogged"
          to="/profile/chats"
          class="relative flex items-center justify-center w-11 h-11 rounded-full bg-surface-secondary"
          aria-label="Уведомления"
        >
          <span class="material-symbols-outlined text-[22px]">notifications</span>
          <span
            v-if="notifStore.chatUnreadCount > 0"
            class="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-status-error ring-2 ring-surface-page"
          />
        </NuxtLink>
        <button
          class="w-11 h-11 rounded-full bg-surface-secondary flex items-center justify-center"
          type="button"
          aria-label="Аккаунт"
          @click="openAccount"
        >
          <span class="material-symbols-outlined text-[20px]">person</span>
        </button>
      </div>
    </div>

    <!-- Booking mobile -->
    <div v-if="isBooking" class="md:hidden h-14 px-margin-mobile flex items-center justify-between">
      <button class="inline-flex items-center min-h-11 text-text-primary" type="button" @click="handleBack">
        <span class="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
        <span class="font-label-md ml-1">Назад</span>
      </button>
      <h1 class="font-headline-sm truncate">{{ chromeTitle || 'Бронирование' }}</h1>
      <button
        class="w-11 h-11"
        type="button"
        aria-label="Закрыть"
        @click="navigateTo(backHref || '/')"
      >
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>

    <!-- Product mobile -->
    <div v-else-if="isProduct" class="md:hidden h-14 px-margin-mobile flex items-center justify-between">
      <div class="flex items-center gap-space-xs min-w-0">
        <button class="w-11 h-11 rounded-full shrink-0" type="button" aria-label="Назад" @click="handleBack">
          <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <div class="min-w-0">
          <span class="font-label-lg">LocaFun</span>
          <span v-if="chromeTitle" class="font-label-sm text-text-muted truncate"> · {{ chromeTitle }}</span>
        </div>
      </div>
      <div class="flex items-center gap-space-xs shrink-0">
        <button
          v-if="showShare"
          class="w-11 h-11 rounded-full"
          type="button"
          aria-label="Поделиться"
          @click="handleShare"
        >
          <span class="material-symbols-outlined">ios_share</span>
        </button>
        <button
          v-if="showFavorite"
          class="w-11 h-11 rounded-full"
          type="button"
          aria-label="В избранное"
          @click="favorite = !favorite"
        >
          <span class="material-symbols-outlined" :class="{ filled: favorite }">favorite</span>
        </button>
      </div>
    </div>

    <!-- Default mobile -->
    <div v-else class="md:hidden h-14 px-margin-mobile flex items-center justify-between pt-safe">
      <div class="flex items-center gap-space-sm min-w-0">
        <NuxtLink to="/" class="font-headline-md font-headline tracking-tight shrink-0">
          Loca<span class="text-primary-pressed">Fun</span>
        </NuxtLink>
        <div class="relative">
          <button
            class="flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-secondary font-label-sm"
            type="button"
            @click="cityOpen = !cityOpen"
          >
            <span class="material-symbols-outlined text-[16px] text-text-secondary">location_on</span>
            <span class="truncate max-w-[96px]">{{ selectedCity }}</span>
          </button>
          <div
            v-if="cityOpen"
            class="absolute left-0 mt-2 w-44 rounded-2xl bg-surface-page shadow-lg border border-border-default py-1 z-50"
          >
            <button
              v-for="city in HOME_CITIES"
              :key="`m-${city.value}`"
              class="w-full text-left px-4 py-2 font-label-sm hover:bg-surface-secondary"
              type="button"
              @click="pickCity(city.name)"
            >
              {{ city.name }}
            </button>
          </div>
        </div>
      </div>
      <NuxtLink
        v-if="isLogged"
        to="/profile/chats"
        class="w-11 h-11 flex items-center justify-center rounded-full relative"
        aria-label="Уведомления"
      >
        <span class="material-symbols-outlined text-[22px]">notifications</span>
        <span
          v-if="notifStore.chatUnreadCount > 0"
          class="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-status-error ring-2 ring-surface-page"
        />
      </NuxtLink>
    </div>
  </header>
</template>
