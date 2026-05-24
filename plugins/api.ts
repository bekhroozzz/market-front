import type { JwtPayload } from 'jwt-decode'
import { jwtDecode } from 'jwt-decode'
import {useToken} from '~/composables/states';
import {useRefreshToken, useSetTokens} from '~/composables/refresh-token';

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const api = $fetch.create({
    baseURL: config.public.BASE_API_URL,
    headers: {
      Accept: 'application/json',
    },
    async onRequest({ options, request }) {
      const headers = new Headers(options.headers as HeadersInit)
      const access = useToken()
      const isRefreshTokenRequest = String(request).includes('/api/auth/refresh')
      const fuserToken = useCookie('fuserToken')


      if (access.value && !isRefreshTokenRequest) {
        const tokenExp = jwtDecode<JwtPayload>(access.value).exp
        const currentTime = new Date().getTime()
        const tokenTime = new Date(tokenExp! * 1000).getTime()
        if (currentTime + 10 * 1000 >= tokenTime) {
          const data = await useRefreshToken()
          if (data)
            useSetTokens(data)
        }

        headers.set('Authorization', `Bearer ${access.value}`)
      }

      if (fuserToken.value) {
        headers.set('Fuser-Token', fuserToken.value)
      }

      const locationWithId = globalThis.location as (Location & { id?: string | number }) | undefined
      if (locationWithId?.id !== undefined && locationWithId.id !== null) {
        headers.set('User-Location-Id', String(locationWithId.id))
      }

      options.headers = headers

    },
    async onResponseError({ response }) {
      throw response
    },
  })

  return {
    provide: {
      api,
    },
  }
})
