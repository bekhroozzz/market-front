import { io, type Socket } from 'socket.io-client'
import { useToken, useLogged } from '~/composables/states'
import { useNotificationStore } from '~/stores/notification'

let socket: Socket | null = null

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const token = useToken()
  const logged = useLogged()

  function connect() {
    if (!token.value || socket?.connected) return
    const baseUrl = (config.public.BASE_API_URL as string || 'http://localhost:4000')
      .replace(/\/api\/?$/, '')

    socket = io(`${baseUrl}/ws`, {
      auth: { token: token.value },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    })

    socket.on('notification.created', (n) => {
      const store = useNotificationStore()
      store.push(n)
    })

    // NOTE: message.created is NOT listened here to avoid duplicate delivery.
    // The chat page uses its own socket (chat.ts composable) which joins the
    // chat room and handles messages directly. Toasts come via notification.created.
  }

  function disconnect() {
    socket?.disconnect()
    socket = null
  }

  // Connect on login, disconnect on logout
  watch(logged, (isLogged) => {
    if (isLogged) {
      connect()
    } else {
      disconnect()
    }
  }, { immediate: true })

  // Also reconnect if token refreshes while already logged in
  watch(token, (newToken) => {
    if (newToken && logged.value && !socket?.connected) {
      connect()
    }
  })
})
