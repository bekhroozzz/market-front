<script setup lang="ts">
import { useChat, useChatSocket, type Chat } from '~/composables/chat'
import { useLogged } from '~/composables/states'

definePageMeta({ middleware: [] })

const logged = useLogged()
if (!logged.value) {
  await navigateTo('/')
}

const config = useRuntimeConfig()

const { listChats } = useChat()
const { onChatCreated } = useChatSocket()

const chats = ref<Chat[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    chats.value = await listChats()
  } catch (e: any) {
    error.value = 'Не удалось загрузить чаты'
  } finally {
    loading.value = false
  }

  onChatCreated((chat) => {
    if (!chats.value.find((c) => c.id === chat.id)) {
      chats.value.unshift(chat)
    }
  })
})

function formatTime(dateStr: string | null) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'только что'
  if (mins < 60) return `${mins} мин`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ч`
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function getImage(chat: Chat) {
  const img = chat.offer?.images?.[0]
  if (!img) return null
  if (img.startsWith('http')) return img
  return `${config.public.BASE_API_URL?.replace('/api', '')}${img}`
}
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-2xl">
    <h1 class="text-2xl font-bold mb-6">Мои чаты</h1>

    <div v-if="loading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg text-primary" />
    </div>

    <div v-else-if="error" class="alert alert-error">{{ error }}</div>

    <div v-else-if="!chats.length" class="text-center py-20 text-base-content/50">
      <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto mb-4 w-16 h-16 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      <p class="text-lg">У вас пока нет чатов</p>
      <p class="text-sm mt-1">Напишите продавцу на странице товара</p>
    </div>

    <div v-else class="flex flex-col gap-2">
      <NuxtLink
        v-for="chat in chats"
        :key="chat.id"
        :to="`/profile/chats/${chat.id}`"
        class="flex items-center gap-4 p-4 rounded-xl border border-base-200 hover:border-primary hover:bg-base-100 transition-all"
      >
        <!-- Offer image -->
        <div class="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-base-200">
          <img
            v-if="getImage(chat)"
            :src="getImage(chat)!"
            :alt="chat.offer.title"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center text-base-content/20">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <p class="font-semibold truncate">{{ chat.offer.title }}</p>
          <p class="text-sm text-base-content/50 truncate">{{ chat.lastMessage?.message ?? 'Нет сообщений' }}</p>
        </div>

        <!-- Meta -->
        <div class="flex flex-col items-end gap-1 flex-shrink-0">
          <span class="text-xs text-base-content/40">{{ formatTime(chat.lastMessageAt) }}</span>
          <span
            v-if="chat.unreadForBuyer > 0 || chat.unreadForSeller > 0"
            class="badge badge-primary badge-sm"
          >
            {{ chat.unreadForBuyer || chat.unreadForSeller }}
          </span>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
