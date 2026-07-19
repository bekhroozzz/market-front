import {useLogged, useToken} from '~/composables/states';
import { useNotificationStore } from '~/stores/notification'
import { disconnectChatSocket } from '~/utils/chat-socket.client'

export function useLogout() {
  const isLogged = useLogged()
  const token = useToken()
  const refreshToken = useCookie('refreshToken')
  const fuserToken = useCookie('fuserToken')
  const fuserFavoriteProducts = useCookie('fuserFavoriteProducts')

  disconnectChatSocket()
  useNotificationStore().clear()
  token.value = null
  refreshToken.value = null
  fuserToken.value = null
  isLogged.value = false
  fuserFavoriteProducts.value = null
}
