<script setup lang="ts">
import { useChat, useChatSocket, type Chat, type ChatMessage } from '~/composables/chat'
import { useLogged, useToken } from '~/composables/states'
import { jwtDecode, type JwtPayload } from 'jwt-decode'
import { useNotificationStore } from '~/stores/notification'

definePageMeta({ middleware: [] })

useAppSeo({ title: 'Чат | LocaFun', noindex: true })

const logged = useLogged()
if (!logged.value) {
  await navigateTo('/')
}

const config = useRuntimeConfig()
const route = useRoute()
const chatId = String(route.params.id)

const { getChat, getMessages, sendMessage, markRead } = useChat()
const { onMessageCreated, onMessageRead, onChatUpdated, joinChat, leaveChat } = useChatSocket()

let unsubMessageCreated: (() => void) | null = null
let unsubMessageRead: (() => void) | null = null
let unsubChatUpdated: (() => void) | null = null
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
let pendingMessageId: string | null = null

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
  unsubMessageCreated = onMessageCreated((msg) => {
    if (msg.chatId !== chatId) return

    if (msg.senderId === currentUserId.value) reconcileOwnMessage(msg)
    else upsertMessage(msg)

    if (msg.senderId !== currentUserId.value) {
      void markCurrentChatRead().catch(() => {})
    }
    scrollToBottom()
  })

  unsubMessageRead = onMessageRead((data) => {
    if (
      data.chatId !== chatId ||
      data.readerId === currentUserId.value ||
      !data.readAt
    ) return

    const readAt = new Date(data.readAt).getTime()
    messages.value = messages.value.map((message) => {
      if (
        message.senderId === currentUserId.value &&
        new Date(message.createdAt).getTime() <= readAt
      ) {
        return { ...message, isRead: true, readAt: data.readAt }
      }
      return message
    })
  })

  unsubChatUpdated = onChatUpdated((updatedChat) => {
    if (updatedChat.id === chatId) chat.value = updatedChat
  })
  joinChat(chatId)

  try {
    const [chatData, msgData] = await Promise.all([
      getChat(chatId),
      getMessages(chatId, 1),
    ])
    chat.value = chatData
    messages.value = mergeMessages(msgData.data, messages.value)
    total.value = msgData.total

    await markCurrentChatRead().catch(() => {})

    loadingChat.value = false
    await nextTick()
    scrollToBottom()
  } catch {
    error.value = 'Не удалось загрузить чат'
    loadingChat.value = false
  }
})

onBeforeUnmount(() => {
  leaveChat(chatId)
  unsubMessageCreated?.()
  unsubMessageRead?.()
  unsubChatUpdated?.()
})

function mergeMessages(...groups: ChatMessage[][]): ChatMessage[] {
  const merged = new Map<string, ChatMessage>()
  for (const group of groups) {
    for (const message of group) merged.set(message.id, message)
  }
  return [...merged.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )
}

function upsertMessage(incoming: ChatMessage) {
  const index = messages.value.findIndex((message) => message.id === incoming.id)
  if (index === -1) messages.value = mergeMessages(messages.value, [incoming])
  else messages.value[index] = incoming
}

function reconcileOwnMessage(incoming: ChatMessage, optimisticId = pendingMessageId) {
  const existingIndex = messages.value.findIndex((message) => message.id === incoming.id)
  const optimisticIndex = optimisticId
    ? messages.value.findIndex((message) => message.id === optimisticId)
    : -1
  const matchingOptimisticIndex =
    optimisticIndex !== -1 && messages.value[optimisticIndex].message === incoming.message
      ? optimisticIndex
      : -1

  if (existingIndex !== -1) {
    messages.value[existingIndex] = incoming
    if (matchingOptimisticIndex !== -1 && matchingOptimisticIndex !== existingIndex) {
      messages.value.splice(matchingOptimisticIndex, 1)
    }
  } else if (matchingOptimisticIndex !== -1) {
    messages.value[matchingOptimisticIndex] = incoming
  } else {
    upsertMessage(incoming)
  }

  if (optimisticId === pendingMessageId) pendingMessageId = null
}

async function markCurrentChatRead() {
  notifStore.markChatReadLocal(chatId)
  await markRead(chatId)
}

async function loadMore() {
  if (loadingMore.value) return
  const nextPage = page.value + 1
  loadingMore.value = true
  try {
    const previousHeight = messagesEl.value?.scrollHeight ?? 0
    const previousTop = messagesEl.value?.scrollTop ?? 0
    const data = await getMessages(chatId, nextPage)
    messages.value = mergeMessages(data.data, messages.value)
    page.value = nextPage
    await nextTick()
    if (messagesEl.value) {
      messagesEl.value.scrollTop =
        previousTop + (messagesEl.value.scrollHeight - previousHeight)
    }
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
  pendingMessageId = optimistic.id
  scrollToBottom()
  sending.value = true

  try {
    const real = await sendMessage(chatId, text)
    reconcileOwnMessage(real, optimistic.id)
  } catch {
    const stillOptimistic = messages.value.some((message) => message.id === optimistic.id)
    messages.value = messages.value.filter((message) => message.id !== optimistic.id)
    if (stillOptimistic) messageText.value = text
    if (pendingMessageId === optimistic.id) pendingMessageId = null
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
