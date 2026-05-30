<script setup lang="ts">
import { useChat, useChatSocket, type Chat, type ChatMessage } from '~/composables/chat'
import { useLogged, useToken } from '~/composables/states'
import { jwtDecode, type JwtPayload } from 'jwt-decode'
import { useNotificationStore } from '~/stores/notification'

definePageMeta({ middleware: [] })

const logged = useLogged()
if (!logged.value) {
  await navigateTo('/')
}

const config = useRuntimeConfig()
const route = useRoute()
const chatId = String(route.params.id)

const { getChat, getMessages, sendMessage, markRead } = useChat()
const { onMessageCreated, onMessageRead, joinChat, leaveChat } = useChatSocket()

let unsubMessageCreated: (() => void) | null = null
let unsubMessageRead: (() => void) | null = null
const notifStore = useNotificationStore()

const chat = ref<Chat | null>(null)
const messages = ref<ChatMessage[]>([])
const total = ref(0)
const page = ref(1)
const loadingChat = ref(true)
const loadingMore = ref(false)
const sending = ref(false)
const messageText = ref('')
const messagesEl = ref<HTMLElement | null>(null)
const error = ref<string | null>(null)

// Derive current user id from token
const token = useToken()
const currentUserId = computed<number | null>(() => {
  if (!token.value) return null
  try {
    const decoded = jwtDecode<JwtPayload & { sub: string }>(token.value)
    return Number(decoded.sub)
  } catch {
    return null
  }
})

onMounted(async () => {
  try {
    const [chatData, msgData] = await Promise.all([
      getChat(chatId),
      getMessages(chatId, 1),
    ])
    chat.value = chatData
    messages.value = msgData.data
    total.value = msgData.total

    await markRead(chatId).catch(() => {})
    // Dismiss toasts for this chat and mark notifications read
    notifStore.items
      .filter((n) => n.entityId === chatId && !n.isRead)
      .forEach((n) => notifStore.markRead(n.id))
    joinChat(chatId)

    unsubMessageCreated = onMessageCreated((msg) => {
      if (msg.chatId !== chatId) return

      // Own message: try to replace the optimistic placeholder (tmp-*) first.
      // This covers the case where the socket event arrives before the REST response.
      if (msg.senderId === currentUserId.value) {
        const tmpIdx = messages.value.findIndex((m) => m.id.startsWith('tmp-'))
        if (tmpIdx !== -1) {
          messages.value[tmpIdx] = msg
          scrollToBottom()
          return
        }
      }

      // Someone else's message — or our message when no optimistic slot exists
      const alreadyExists = messages.value.some((m) => m.id === msg.id)
      if (!alreadyExists) {
        messages.value.push(msg)
        scrollToBottom()
      }
      markRead(chatId).catch(() => {})
    })

    unsubMessageRead = onMessageRead((data) => {
      if (data.chatId === chatId) {
        messages.value = messages.value.map((m) => ({
          ...m,
          isRead: m.senderId === currentUserId.value ? true : m.isRead,
        }))
      }
    })

    await nextTick()
    scrollToBottom()
  } catch {
    error.value = 'Не удалось загрузить чат'
  } finally {
    loadingChat.value = false
  }
})

onBeforeUnmount(() => {
  leaveChat(chatId)
  unsubMessageCreated?.()
  unsubMessageRead?.()
})

async function loadMore() {
  if (loadingMore.value) return
  const nextPage = page.value + 1
  loadingMore.value = true
  try {
    const data = await getMessages(chatId, nextPage)
    messages.value = [...data.data, ...messages.value]
    page.value = nextPage
  } finally {
    loadingMore.value = false
  }
}

async function handleSend() {
  const text = messageText.value.trim()
  if (!text || sending.value || !currentUserId.value) return

  const optimistic: ChatMessage = {
    id: `tmp-${Date.now()}`,
    chatId,
    senderId: currentUserId.value,
    message: text,
    isRead: false,
    readAt: null,
    createdAt: new Date().toISOString(),
  }

  messageText.value = ''
  messages.value.push(optimistic)
  scrollToBottom()
  sending.value = true

  try {
    const real = await sendMessage(chatId, text)
    const idx = messages.value.findIndex((m) => m.id === optimistic.id)
    if (idx !== -1) messages.value[idx] = real
  } catch {
    messages.value = messages.value.filter((m) => m.id !== optimistic.id)
    messageText.value = text
  } finally {
    sending.value = false
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight
    }
  })
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

function getOfferImage() {
  const img = chat.value?.offer?.images?.[0]
  if (!img) return null
  if (img.startsWith('http')) return img
  return `${config.public.BASE_API_URL?.replace('/api', '')}${img}`
}

const hasMore = computed(() => messages.value.length < total.value)
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-7xl flex flex-col" style="height: calc(100dvh - 80px);">
    <div v-if="loadingChat" class="flex justify-center py-20 flex-1">
      <span class="loading loading-spinner loading-lg text-primary" />
    </div>

    <div v-else-if="error" class="alert alert-error">{{ error }}</div>

    <template v-else-if="chat">
      <!-- Offer card header -->
      <NuxtLink
        :to="chat.offer.slug ? `/product/${chat.offer.slug}` : `/product/${chat.offer.id}`"
        class="flex items-center gap-3 p-3 rounded-xl border border-base-200 hover:border-primary transition-colors mb-4 flex-shrink-0"
      >
        <div class="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-base-200">
          <img
            v-if="getOfferImage()"
            :src="getOfferImage()!"
            :alt="chat.offer.title"
            class="w-full h-full object-cover"
          />
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold truncate">{{ chat.offer.title }}</p>
          <p v-if="chat.offer.price" class="text-sm text-primary font-medium">
            {{ Number(chat.offer.price).toLocaleString('ru-RU') }} ₽
          </p>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-base-content/30 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </NuxtLink>

      <!-- Messages -->
      <div
        ref="messagesEl"
        class="flex-1 overflow-y-auto flex flex-col gap-2 px-1 mb-4"
      >
        <!-- Load more -->
        <div v-if="hasMore" class="text-center">
          <button
            class="btn btn-ghost btn-sm text-base-content/50"
            :class="{ loading: loadingMore }"
            @click="loadMore"
          >
            Загрузить ранние сообщения
          </button>
        </div>

        <template v-for="(msg, i) in messages" :key="msg.id">
          <!-- Date separator -->
          <div
            v-if="i === 0 || !isSameDay(messages[i - 1].createdAt, msg.createdAt)"
            class="text-center text-xs text-base-content/40 my-2"
          >
            {{ formatDate(msg.createdAt) }}
          </div>

          <!-- Message bubble -->
          <div
            class="flex"
            :class="msg.senderId === currentUserId ? 'justify-end' : 'justify-start'"
          >
            <div
              class="max-w-[75%] px-4 py-2 rounded-2xl text-sm"
              :class="
                msg.senderId === currentUserId
                  ? 'bg-primary text-primary-content rounded-br-sm'
                  : 'bg-base-200 text-base-content rounded-bl-sm'
              "
            >
              <p class="whitespace-pre-wrap break-words">{{ msg.message }}</p>
              <div
                class="flex items-center gap-1 mt-1"
                :class="msg.senderId === currentUserId ? 'justify-end' : 'justify-start'"
              >
                <span class="text-[10px] opacity-60">{{ formatTime(msg.createdAt) }}</span>
                <span v-if="msg.senderId === currentUserId" class="text-[10px] opacity-60">
                  {{ msg.isRead ? '✓✓' : '✓' }}
                </span>
              </div>
            </div>
          </div>
        </template>

        <div v-if="!messages.length" class="flex-1 flex items-center justify-center text-base-content/40 py-10">
          Напишите первое сообщение
        </div>
      </div>

      <!-- Input -->
      <div class="flex items-end gap-2 flex-shrink-0">
        <textarea
          v-model="messageText"
          placeholder="Введите сообщение..."
          rows="1"
          class="textarea textarea-bordered flex-1 resize-none min-h-[44px] max-h-32"
          @keydown="handleKeydown"
        />
        <button
          class="btn btn-primary btn-square"
          :disabled="!messageText.trim() || sending"
          @click="handleSend"
        >
          <svg v-if="!sending" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
          <span v-else class="loading loading-spinner loading-xs" />
        </button>
      </div>
    </template>
  </div>
</template>
