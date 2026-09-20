<script setup lang="ts">
defineProps<{
  title: string
  categoryName?: string | null
  rating?: number
  reviewCount?: number
  address?: string
  priceChip?: string
  compact?: boolean
  heading?: 'h1' | 'p'
}>()

const emit = defineEmits<{
  reviews: []
}>()
</script>

<template>
  <div class="flex flex-col gap-space-xs">
    <div class="flex flex-wrap items-center justify-between gap-space-xs">
      <div class="flex flex-wrap items-center gap-space-sm">
        <span
          v-if="categoryName"
          class="px-3 py-1 rounded-lg bg-surface-secondary text-text-secondary font-label-sm uppercase tracking-wider"
        >
          {{ categoryName }}
        </span>
        <span class="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-status-success-bg text-status-success font-label-sm">
          <span class="material-symbols-outlined text-base filled">verified</span>
          {{ compact ? 'Проверено' : 'Проверено LocaFun' }}
        </span>
      </div>
      <span
        v-if="compact && priceChip"
        class="bg-surface-soft-pink text-primary-pressed font-label-md px-2.5 py-1 rounded-lg"
      >
        {{ priceChip }}
      </span>
    </div>
    <component
      :is="heading || 'h1'"
      class="font-headline-lg-mobile md:text-headline-lg font-headline tracking-tight text-text-primary"
    >
      {{ title }}
    </component>
    <div class="flex flex-wrap items-center gap-x-space-sm gap-y-1 font-body-sm text-text-secondary">
      <button
        v-if="rating"
        class="inline-flex items-center gap-1 text-text-primary font-label-md"
        type="button"
        @click="emit('reviews')"
      >
        <span class="material-symbols-outlined filled text-status-warning">star</span>
        {{ rating.toFixed(1) }}
        <span class="text-text-muted font-normal underline decoration-text-muted">
          ({{ reviewCount || 0 }} отзывов)
        </span>
      </button>
      <span v-if="address" class="inline-flex items-center gap-1">
        <span class="material-symbols-outlined text-text-muted">location_on</span>
        {{ address }}
      </span>
    </div>
  </div>
</template>
