import {useApiPost} from '~/composables/api';
import {useLogged, useToken} from '~/composables/states';

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  refreshTokenExpire: number
}

export async function useRefreshToken() {
  const refreshToken = useCookie('refreshToken')
  return useApiPost<AuthTokens>('/api/auth/refresh', {
    headers: {
      Authorization: `Bearer ${refreshToken.value}`,
    },
  })
}

export function useSetTokens(data: AuthTokens) {
  const token = useToken()
  const isLogged = useLogged()

  const expires = new Date(data.refreshTokenExpire * 1000)
  const refreshToken = useCookie('refreshToken', { expires })

  token.value = data.accessToken
  refreshToken.value = data.refreshToken
  isLogged.value = true
}
