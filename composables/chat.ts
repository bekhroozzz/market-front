import {
  configureChatSocket,
  disconnectChatSocket,
  joinChatRoom,
  leaveChatRoom,
  onChatSocketEvent,
} from '~/utils/chat-socket.client'

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

export interface MessageReadEvent {
  chatId: string
  readerId: number
  readAt: string
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
  const config = useRuntimeConfig()
  configureChatSocket(config.public.BASE_API_URL as string | undefined)

  const onMessageCreated = (cb: (msg: ChatMessage) => void): (() => void) => {
    return onChatSocketEvent('message.created', cb)
  }

  const onChatCreated = (cb: (chat: Chat) => void): (() => void) => {
    return onChatSocketEvent('chat.created', cb)
  }

  const onChatUpdated = (cb: (chat: Chat) => void): (() => void) => {
    return onChatSocketEvent('chat.updated', cb)
  }

  const onMessageRead = (cb: (data: MessageReadEvent) => void): (() => void) => {
    return onChatSocketEvent('message.read', cb)
  }

  const joinChat = (chatId: string) => {
    joinChatRoom(chatId)
  }

  const leaveChat = (chatId: string) => {
    leaveChatRoom(chatId)
  }

  const disconnect = () => {
    disconnectChatSocket()
  }

  return {
    onMessageCreated,
    onChatCreated,
    onChatUpdated,
    onMessageRead,
    joinChat,
    leaveChat,
    disconnect,
  }
}
