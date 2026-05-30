<script setup lang="ts">
import { ModalsContainer } from 'vue-final-modal'

const menuStore = useMenuStore()
const { menuHeader } = storeToRefs(menuStore)
const refreshToken = useCookie('refreshToken')

await useLazyAsyncData('category-menu', ()=> useApiGet('/api/category/get-all', {
  onResponse({response}) {
    menuHeader.value = response._data
  }
}))

if (refreshToken.value) {
  const { data } = await useAsyncData(() => useRefreshToken())
  if (data.value)
    useSetTokens(data.value)
}
</script>

<template>
  <NuxtLoadingIndicator
    :throttle="200"
    color="var(--color-primary)"
    :height="4"
  />
  <NuxtLayout>
      <NuxtPage/>
      <ClientOnly>
        <ModalsContainer />
        <ToastNotifications />
      </ClientOnly>
    </NuxtLayout>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: all 0.4s;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  filter: blur(1rem);
}
</style>