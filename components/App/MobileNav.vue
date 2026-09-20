<script setup lang="ts">
import { useModal, useModalSlot } from 'vue-final-modal'
import { LazyAuthSignup, LazyModalTemplate } from '#components'
import { useLogged } from '~/composables/states'

const route = useRoute()
const isLogged = useLogged()

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

const items = computed(() => [
  { to: '/', icon: 'home', label: 'Home', match: route.path === '/', auth: false },
  { to: '/catalog', icon: 'explore', label: 'Explore', match: route.path.startsWith('/catalog'), auth: false },
  { to: '/profile/bookings', icon: 'calendar_today', label: 'Bookings', match: route.path.startsWith('/profile/bookings'), auth: true },
  { to: '/profile/chats', icon: 'chat_bubble', label: 'Messages', match: route.path.startsWith('/profile/chats'), auth: true },
])
</script>

<template>
  <nav class="md:hidden fixed bottom-0 w-full z-50 pb-safe bg-surface-page/90 backdrop-blur-xl shadow-[0_-2px_12px_rgba(23,23,23,0.04)]">
    <div class="flex items-center justify-around h-16 px-space-xs">
      <template v-for="item in items" :key="item.to">
        <NuxtLink
          v-if="!item.auth || isLogged"
          :to="item.to"
          class="flex flex-col items-center gap-0.5 min-w-[56px] min-h-[44px]"
          :class="item.match ? 'text-text-primary' : 'text-text-muted'"
        >
          <span
            class="material-symbols-outlined text-[22px]"
            :class="item.match ? 'text-primary-pressed' : ''"
          >
            {{ item.icon }}
          </span>
          <span class="font-label-sm">{{ item.label }}</span>
        </NuxtLink>
        <button
          v-else
          class="flex flex-col items-center gap-0.5 min-w-[56px] min-h-[44px] text-text-muted"
          type="button"
          @click="authModal.open()"
        >
          <span class="material-symbols-outlined text-[22px]">{{ item.icon }}</span>
          <span class="font-label-sm">{{ item.label }}</span>
        </button>
      </template>
      <button
        class="flex flex-col items-center gap-0.5 min-w-[56px] min-h-[44px]"
        :class="route.path.startsWith('/profile') && !route.path.startsWith('/profile/bookings') && !route.path.startsWith('/profile/chats') ? 'text-text-primary' : 'text-text-muted'"
        type="button"
        @click="openAccount"
      >
        <span
          class="material-symbols-outlined text-[22px]"
          :class="route.path.startsWith('/profile') && !route.path.startsWith('/profile/bookings') && !route.path.startsWith('/profile/chats') ? 'text-primary-pressed' : ''"
        >
          person
        </span>
        <span class="font-label-sm">Profile</span>
      </button>
    </div>
  </nav>
</template>
