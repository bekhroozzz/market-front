import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null
let socketBaseUrl = ''
let currentToken: string | null = null
const joinedChats = new Set<string>()

export function normalizeSocketBaseUrl(baseUrl?: string): string {
  return (baseUrl || 'http://localhost:4000')
    .replace(/\/api\/?$/i, '')
    .replace(/\/+$/, '')
}

function ensureSocket(baseUrl?: string): Socket {
  const normalizedBaseUrl = normalizeSocketBaseUrl(baseUrl)

  if (!socket) {
    socketBaseUrl = normalizedBaseUrl
    socket = io(`${socketBaseUrl}/ws`, {
      autoConnect: false,
      auth: { token: currentToken ?? '' },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    })

    socket.on('connect', () => {
      for (const chatId of joinedChats) {
        socket?.emit('chat.join', { chatId })
      }
    })
  }

  return socket
}

export function configureChatSocket(baseUrl?: string): Socket {
  return ensureSocket(baseUrl)
}

export function connectChatSocket(token: string, baseUrl?: string): Socket {
  currentToken = token
  const activeSocket = ensureSocket(baseUrl)
  activeSocket.auth = { token }

  if (!activeSocket.connected) {
    activeSocket.connect()
  }

  return activeSocket
}

export function updateChatSocketToken(token: string | null, baseUrl?: string): void {
  currentToken = token
  const activeSocket = ensureSocket(baseUrl)
  activeSocket.auth = { token: token ?? '' }

  if (token && activeSocket.connected) {
    activeSocket.disconnect()
    activeSocket.connect()
  } else if (token) {
    activeSocket.connect()
  }
}

export function disconnectChatSocket(clearRooms = true): void {
  socket?.disconnect()
  currentToken = null
  if (socket) socket.auth = { token: '' }
  if (clearRooms) joinedChats.clear()
}

export function onChatSocketEvent<T>(event: string, callback: (payload: T) => void): () => void {
  const activeSocket = ensureSocket()
  activeSocket.on(event, callback)
  return () => activeSocket.off(event, callback)
}

export function joinChatRoom(chatId: string): void {
  joinedChats.add(chatId)
  const activeSocket = ensureSocket()
  if (activeSocket.connected) activeSocket.emit('chat.join', { chatId })
}

export function leaveChatRoom(chatId: string): void {
  joinedChats.delete(chatId)
  const activeSocket = ensureSocket()
  if (activeSocket.connected) activeSocket.emit('chat.leave', { chatId })
}
