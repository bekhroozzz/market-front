<script setup lang="ts">
const props = defineProps<{
  images: { src: string; alt?: string }[]
}>()

const emit = defineEmits<{
  open: []
}>()

const activeIndex = ref(0)
const track = ref<HTMLElement | null>(null)
const photos = computed(() => props.images.filter(image => image.src))
const hero = computed(() => photos.value[0])

const mosaic = computed(() => {
  if (!photos.value.length) return []
  return Array.from({ length: 4 }, (_, index) => {
    return photos.value[(index + 1) % photos.value.length] || photos.value[0]
  })
})

function onScroll() {
  const el = track.value
  if (!el || !photos.value.length) return
  activeIndex.value = Math.round(el.scrollLeft / el.clientWidth)
}

function goTo(index: number) {
  activeIndex.value = index
  track.value?.scrollTo({ left: index * (track.value.clientWidth || 0), behavior: 'smooth' })
}
</script>

<template>
  <div>
    <div class="relative w-full overflow-hidden bg-surface-container-high md:hidden">
      <div
        ref="track"
        class="flex overflow-x-auto snap-x snap-mandatory aspect-[4/3] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        @scroll.passive="onScroll"
      >
        <button
          v-for="(image, index) in photos"
          :key="image.src + index"
          class="min-w-full snap-center"
          type="button"
          @click="emit('open')"
        >
          <img :src="image.src" :alt="image.alt || ''" class="w-full h-full object-cover aspect-[4/3]">
        </button>
      </div>
      <div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
        <button
          v-for="(_, index) in photos"
          :key="index"
          class="rounded-full transition-all"
          :class="index === activeIndex ? 'w-2 h-2 bg-surface-page' : 'w-1.5 h-1.5 bg-surface-page/50'"
          type="button"
          :aria-label="`Фото ${index + 1}`"
          @click="goTo(index)"
        />
      </div>
      <div class="absolute bottom-3 right-margin-mobile bg-text-primary/70 backdrop-blur-md px-2.5 py-1 rounded-full text-surface-page font-label-sm inline-flex items-center gap-1">
        <span class="material-symbols-outlined text-[14px]">photo_camera</span>
        {{ activeIndex + 1 }} / {{ photos.length }}
      </div>
    </div>

    <div class="relative w-full rounded-2xl overflow-hidden shadow-sm hidden md:block">
      <div class="grid grid-cols-4 gap-2 h-[420px] lg:h-[520px]">
        <button class="col-span-2 relative overflow-hidden bg-surface-secondary group" type="button" @click="emit('open')">
          <img v-if="hero" :src="hero.src" :alt="hero.alt || ''" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
        </button>
        <div class="col-span-2 grid grid-cols-2 gap-2">
          <button
            v-for="(image, index) in mosaic"
            :key="image.src + index"
            class="relative overflow-hidden bg-surface-secondary group"
            type="button"
            @click="emit('open')"
          >
            <img :src="image.src" :alt="image.alt || ''" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          </button>
        </div>
      </div>
      <button
        class="absolute bottom-5 right-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-page/95 text-text-primary font-label-md shadow-md"
        type="button"
        @click="emit('open')"
      >
        <span class="material-symbols-outlined text-lg">photo_library</span>
        Все {{ photos.length }} фото
      </button>
    </div>
  </div>
</template>
