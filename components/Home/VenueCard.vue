<script setup lang="ts">
import type { VenueCardModel } from '~/composables/home'
import { formatFromPrice } from '~/utils/format-price'

const props = withDefaults(defineProps<{
  venue: VenueCardModel
  variant?: 'desktop' | 'mobile'
}>(), {
  variant: 'desktop',
})

const bookedHref = computed(() => props.venue.url)
const filled = computed(() => props.venue.rating > 0)
</script>

<template>
  <article
    class="group bg-surface-page overflow-hidden flex flex-col"
    :class="variant === 'desktop'
      ? 'rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300'
      : 'rounded-xl shadow-md active:scale-[0.99] transition-transform'"
  >
    <div
      class="relative w-full overflow-hidden bg-surface-secondary"
      :class="variant === 'desktop' ? 'aspect-[4/3]' : 'aspect-[16/10]'"
    >
      <NuxtLink :to="venue.url" class="absolute inset-0">
        <img
          :src="venue.image"
          :alt="venue.title"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        >
      </NuxtLink>
      <span
        v-if="venue.category"
        class="absolute top-space-sm left-space-sm font-label-sm text-label-sm px-space-md py-0.5 rounded-full bg-surface-page/90 backdrop-blur-md text-text-primary font-bold shadow-sm"
      >
        {{ venue.category }}
      </span>
      <div
        v-if="venue.inStock !== false"
        class="absolute bottom-space-sm left-space-sm font-label-sm text-label-sm px-space-sm py-0.5 rounded-lg bg-status-success-bg text-status-success font-bold flex items-center gap-1 shadow-sm"
      >
        <span class="material-symbols-outlined text-[14px]">bolt</span>
        <span>Свободно сегодня</span>
      </div>
      <div
        v-if="variant === 'mobile'"
        class="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-text-primary/80 backdrop-blur-md text-surface-page font-label-sm font-bold"
      >
        {{ formatFromPrice(venue.price) }}
      </div>
    </div>

    <div class="p-space-lg flex-1 flex flex-col justify-between">
      <div>
        <div class="flex items-center gap-1 mb-1 text-status-success font-label-sm font-bold">
          <span class="material-symbols-outlined text-[16px]">verified</span>
          <span>Проверенный партнер</span>
        </div>
        <NuxtLink :to="venue.url">
          <h3 class="font-headline-sm font-headline text-text-primary group-hover:text-primary-pressed transition-colors">
            {{ venue.title }}
          </h3>
        </NuxtLink>
        <p class="font-body-sm text-text-secondary flex items-center gap-1 mt-1">
          <span class="material-symbols-outlined text-[16px] text-text-muted">location_on</span>
          <span class="truncate">{{ venue.location }}</span>
        </p>
      </div>

      <div
        class="pt-space-md mt-space-md bg-surface-secondary/40 -mx-space-lg -mb-space-lg px-space-lg py-space-md flex items-center justify-between"
      >
        <div>
          <div v-if="filled" class="flex items-center gap-1 font-label-sm text-text-primary">
            <span class="material-symbols-outlined filled text-[16px] text-status-warning">star</span>
            <span class="font-bold">{{ venue.rating.toFixed(1) }}</span>
            <span v-if="venue.reviewCount" class="text-text-muted">({{ venue.reviewCount }})</span>
          </div>
          <div class="font-label-lg font-headline text-text-primary mt-0.5">
            {{ formatFromPrice(venue.price) }}
          </div>
        </div>
        <NuxtLink
          :to="bookedHref"
          class="px-space-md py-space-sm rounded-xl bg-primary-container text-text-primary font-label-md font-bold hover:bg-primary-hover active:bg-primary-pressed transition-colors"
        >
          Бронь
        </NuxtLink>
      </div>
    </div>
  </article>
</template>
