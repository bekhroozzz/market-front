<script setup lang="ts">
import { useModal, useModalSlot } from 'vue-final-modal'
import { LazyAuthSignup, LazyModalTemplate } from '#components'
import { useLogged } from '~/composables/states'

const isLogged = useLogged()

const authModal = useModal({
  component: LazyModalTemplate,
  attrs: {
    variant: 'center',
    hideClose: true,
    containerWidth: '490px',
  },
  slots: {
    default: useModalSlot({
      component: LazyAuthSignup,
      attrs: {
        onClose() {
          authModal.close()
        },
      },
    }),
  },
})
</script>

<template>
  <footer class="hidden md:block w-full bg-surface-secondary border-t border-border-default pt-space-3xl pb-space-2xl">
    <div class="max-w-[1440px] mx-auto px-margin">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-space-2xl pb-space-3xl border-b border-border-default">
        <div class="col-span-2">
          <p class="font-headline-sm font-headline mb-space-md">
            Loca<span class="text-primary-pressed">Fun</span>
          </p>
          <p class="font-body-md text-text-secondary max-w-sm">
            Платформа для поиска и мгновенного бронирования развлечений в вашем городе.
          </p>
        </div>
        <div class="flex flex-col gap-space-sm font-body-sm text-text-secondary">
          <span class="font-label-lg text-text-primary">Компания</span>
          <NuxtLink to="/about" class="hover:text-text-primary">О нас</NuxtLink>
          <NuxtLink to="/jobs" class="hover:text-text-primary">Вакансии</NuxtLink>
          <NuxtLink to="/contact" class="hover:text-text-primary">Контакты</NuxtLink>
        </div>
        <div class="flex flex-col gap-space-sm font-body-sm text-text-secondary">
          <span class="font-label-lg text-text-primary">Поддержка</span>
          <NuxtLink to="/contact" class="hover:text-text-primary">Помощь</NuxtLink>
          <NuxtLink v-if="isLogged" to="/profile/bookings" class="hover:text-text-primary">Мои брони</NuxtLink>
          <button v-else class="text-left hover:text-text-primary" type="button" @click="authModal.open()">Мои брони</button>
        </div>
      </div>
      <div class="pt-space-xl font-body-sm text-text-muted">
        © {{ new Date().getFullYear() }} LocaFun. Все права защищены.
      </div>
    </div>
  </footer>
</template>
