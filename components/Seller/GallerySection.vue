<script setup lang="ts">
import type { GalleryImage } from '~/composables/seller'

defineProps<{ gallery: GalleryImage[] }>()

const activeIndex = ref(0)
</script>

<template>
  <section v-if="gallery.length" class="space-y-4">
    <h2 class="text-xl font-semibold text-base-content">Галерея</h2>

    <!-- Main image -->
    <div class="relative aspect-video w-full overflow-hidden rounded-2xl bg-base-200">
      <img
        :src="gallery[activeIndex].url"
        :alt="`Фото компании ${activeIndex + 1}`"
        class="w-full h-full object-cover transition-opacity duration-300"
        loading="lazy"
      />
      <span class="absolute bottom-3 right-3 badge badge-neutral text-xs">
        {{ activeIndex + 1 }} / {{ gallery.length }}
      </span>
    </div>

    <!-- Thumbnails -->
    <div v-if="gallery.length > 1" class="flex gap-2 overflow-x-auto pb-1">
      <button
        v-for="(img, idx) in gallery"
        :key="img.id"
        class="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden ring-2 transition-all"
        :class="idx === activeIndex ? 'ring-primary' : 'ring-transparent opacity-60 hover:opacity-100'"
        @click="activeIndex = idx"
      >
        <img
          :src="img.url"
          :alt="`Миниатюра ${idx + 1}`"
          class="w-full h-full object-cover"
          loading="lazy"
        />
      </button>
    </div>
  </section>
</template>
