<script setup lang="ts">
import { useLogged } from '~/composables/states'

definePageMeta({ middleware: [] })

const logged = useLogged()
if (!logged.value) {
  await navigateTo('/')
}

const sections = [
  {
    label: 'Мои брони',
    description: 'Активные и завершённые бронирования',
    icon: 'calendar',
    to: '/profile/bookings',
  },
  {
    label: 'Чаты',
    description: 'Переписка с продавцами',
    icon: 'chat',
    to: '/profile/chats',
  },
]
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-lg">
    <h1 class="text-2xl font-bold mb-6">Личный кабинет</h1>

    <div class="flex flex-col gap-3">
      <NuxtLink
        v-for="s in sections"
        :key="s.to"
        :to="s.to"
        class="flex items-center gap-4 p-5 rounded-2xl border border-base-200 hover:border-primary hover:bg-base-100 transition-all"
      >
        <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <svg v-if="s.icon === 'calendar'" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <svg v-else-if="s.icon === 'chat'" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
        </div>
        <div class="flex-1">
          <p class="font-semibold">{{ s.label }}</p>
          <p class="text-sm text-base-content/50">{{ s.description }}</p>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </NuxtLink>
    </div>
  </div>
</template>
