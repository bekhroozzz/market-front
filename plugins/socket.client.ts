import { useToken, useLogged } from '~/composables/states'
import { useNotificationStore } from '~/stores/notification'
import type { FrontNotification } from '~/stores/notification'
import {
  configureChatSocket,
  connectChatSocket,
  disconnectChatSocket,
  onChatSocketEvent,
  updateChatSocketToken,
} from '~/utils/chat-socket.client'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const token = useToken()
  const logged = useLogged()
  const route = useRoute()
  const store = useNotificationStore()
  const baseUrl = config.public.BASE_API_URL as string | undefined

  configureChatSocket(baseUrl)

  onChatSocketEvent<FrontNotification>('notification.created', (notification) => {
    const activeChatId =
      route.path.startsWith('/profile/chats/') && route.params.id
        ? String(route.params.id)
        : null

    if (notification.type === 'new_message' && notification.entityId === activeChatId) {
      store.push({ ...notification, isRead: true }, false)
      void store.markRead(notification.id).catch(() => {})
      return
    }

    store.push(notification)
  })

  watch([logged, token], ([isLogged, accessToken], previous) => {
    if (isLogged && accessToken) {
      if (previous?.[1] && previous[1] !== accessToken) {
        updateChatSocketToken(accessToken, baseUrl)
      } else {
        connectChatSocket(accessToken, baseUrl)
      }
      void store.hydrate().catch(() => {})
    } else {
      disconnectChatSocket()
      store.clear()
    }
  }, { immediate: true })
})
