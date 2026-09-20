<script setup lang="ts">
const route = useRoute()

const hideMobileNav = computed(() =>
  route.path.startsWith('/booking')
  || route.path.startsWith('/product/')
  || /\/profile\/chats\/[^/]+/.test(route.path),
)

const contentPad = computed(() =>
  route.path.startsWith('/booking') ? 'pt-14 md:pt-16' : 'pt-14 md:pt-20',
)
</script>

<template>
  <div class="lf-home flex min-h-screen flex-col bg-surface-page text-text-primary font-body antialiased">
    <AppHeader />
    <div
      class="flex-auto"
      :class="[contentPad, hideMobileNav ? '' : 'pb-16 md:pb-0']"
    >
      <slot />
    </div>
    <AppFooter />
    <AppMobileNav v-if="!hideMobileNav" />
  </div>
</template>
