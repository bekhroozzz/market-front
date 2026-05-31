import { io, type Socket } from 'socket.io-client'
import { useToken } from '~/composables/states'

export interface ChatUser {
  id: number
  email: string
}

export interface ChatOffer {
  id: string
  title: string
  images?: string[]
  price?: number
  slug?: string
}

export interface ChatLastMessage {
  id: string
  message: string
  senderId: number
  createdAt: string
}

export interface Chat {
  id: string
  offerId: string
  sellerId: number
  buyerId: number
  offer: ChatOffer
  seller: ChatUser
  buyer: ChatUser
  lastMessage: ChatLastMessage | null
  lastMessageAt: string | null
  unreadForSeller: number
  unreadForBuyer: number
  createdAt: string
}

export interface ChatMessage {
  id: string
  chatId: string
  senderId: number
  message: string
  isRead: boolean
  readAt: string | null
  createdAt: string
}

let socket: Socket | null = null

function getSocket(): Socket {
  const config = useRuntimeConfig()
  const token = useToken()

  if (!socket || !socket.connected) {
    const baseUrl = config.public.BASE_API_URL || 'http://localhost:4000'
    socket = io(`${baseUrl}/ws`, {
      auth: { token: token.value ?? '' },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })
  }
  return socket
}

export function useChat() {
  async function openChat (offerId: string): Promise<Chat> {
    return useApiPost<Chat>('/api/chats/open', { body: { offerId } })
  }

  async function listChats (): Promise<Chat[]> {
    return useApiGet<Chat[]>('/api/chats')
  }

  async function getChat (chatId: string): Promise<Chat> {
    return useApiGet<Chat>(`/api/chats/${chatId}`)
  }

  async function getMessages (chatId: string, page = 1): Promise<{ data: ChatMessage[]; total: number }>{
    return useApiGet(`/api/chats/${chatId}/messages`, { params: { page } })
  }

  async function sendMessage (chatId: string, message: string,): Promise<ChatMessage> {
    return useApiPost<ChatMessage>(`/api/chats/${chatId}/messages`, {
      body: { message },
    })
  }

  async function markRead (chatId: string): Promise<void> {
    return useApiPost(`/api/chats/${chatId}/read`)
  }

  return { openChat, listChats, getChat, getMessages, sendMessage, markRead,}
}

export function useChatSocket() {
  const onMessageCreated = (cb: (msg: ChatMessage) => void): (() => void) => {
    const s = getSocket()
    s.on('message.created', cb)
    return () => s.off('message.created', cb)
  }

  const onChatCreated = (cb: (chat: Chat) => void): (() => void) => {
    const s = getSocket()
    s.on('chat.created', cb)
    return () => s.off('chat.created', cb)
  }

  const onMessageRead = (cb: (data: { chatId: string }) => void): (() => void) => {
    const s = getSocket()
    s.on('message.read', cb)
    return () => s.off('message.read', cb)
  }

  const joinChat = (chatId: string) => {
    getSocket().emit('chat.join', { chatId })
  }

  const leaveChat = (chatId: string) => {
    getSocket().emit('chat.leave', { chatId })
  }

  const disconnect = () => {
    socket?.disconnect()
    socket = null
  }

  return { onMessageCreated, onChatCreated, onMessageRead, joinChat, leaveChat, disconnect }
}
