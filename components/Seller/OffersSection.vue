<script setup lang="ts">
import type { Offer } from '~/composables/product'

defineProps<{
  offers: Offer[]
  total: number
  page: number
  pages: number
  loading?: boolean
}>()

const emit = defineEmits<{ (e: 'page-change', page: number): void }>()
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-base-content">
        Предложения
        <span v-if="total" class="badge badge-neutral ml-2">{{ total }}</span>
      </h2>
    </div>

    <!-- Skeleton -->
    <template v-if="loading">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div
          v-for="n in 8"
          :key="n"
          class="card bg-base-200 animate-pulse"
        >
          <div class="h-48 bg-base-300 rounded-t-2xl"></div>
          <div class="card-body gap-2">
            <div class="h-4 bg-base-300 rounded w-3/4"></div>
            <div class="h-3 bg-base-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    </template>

    <!-- Empty state -->
    <template v-else-if="!offers.length">
      <div class="text-center py-16 text-base-content/50">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
        </svg>
        <p class="text-lg font-medium">Нет опубликованных предложений</p>
        <p class="text-sm mt-1">Продавец ещё не добавил предложения</p>
      </div>
    </template>

    <!-- Grid -->
    <template v-else>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <NuxtLink
          v-for="offer in offers"
          :key="offer.id"
          :to="`/product/${offer.slug ?? offer.id}`"
          class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow border border-base-200"
        >
          <figure class="h-48 bg-base-200 overflow-hidden rounded-t-2xl">
            <img
              v-if="offer.images?.length"
              :src="offer.images[0]"
              :alt="offer.title"
              class="w-full h-full object-cover"
              loading="lazy"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-base-content/20">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
          </figure>
          <div class="card-body p-4 gap-1">
            <h3 class="font-medium text-base-content line-clamp-2 text-sm">{{ offer.title }}</h3>
            <p v-if="offer.price" class="text-primary font-bold text-base">
              {{ offer.price.toLocaleString('ru-RU') }} ₽
            </p>
          </div>
        </NuxtLink>
      </div>

      <!-- Pagination -->
      <div v-if="pages > 1" class="flex justify-center gap-1 pt-4">
        <button
          v-for="p in pages"
          :key="p"
          class="btn btn-sm"
          :class="p === page ? 'btn-primary' : 'btn-ghost'"
          @click="emit('page-change', p)"
        >
          {{ p }}
        </button>
      </div>
    </template>
  </section>
</template>
