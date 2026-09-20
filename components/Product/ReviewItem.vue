<script setup lang="ts">
interface Props {
  id: string
  text: string
  rating: number
  createdAt: string
  author?: string
  profileImage?: string
}

const props = defineProps<Props>()

const formattedDate = computed(() => {
  try {
    return new Date(props.createdAt).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }
  catch {
    return ''
  }
})

const initials = computed(() => (props.author ?? 'Гость').slice(0, 2).toUpperCase())
</script>

<template>
  <div class="p-space-md rounded-2xl bg-surface-secondary flex flex-col justify-between gap-space-md">
    <div class="flex flex-col gap-space-xs">
      <div class="flex items-center gap-space-sm">
        <div class="w-10 h-10 rounded-full bg-surface-page flex items-center justify-center font-bold text-text-primary shadow-sm overflow-hidden">
          <img v-if="profileImage" class="w-10 h-10 object-cover" :src="profileImage" alt="">
          <span v-else>{{ initials }}</span>
        </div>
        <div class="flex flex-col">
          <span class="font-label-md text-text-primary">{{ author ?? 'Гость' }}</span>
          <span class="text-text-muted font-label-sm">{{ formattedDate }}</span>
        </div>
      </div>
      <div class="flex text-status-warning pt-1">
        <span
          v-for="star in 5"
          :key="star"
          class="material-symbols-outlined text-base"
          :class="star <= rating ? 'filled' : 'text-border-strong'"
        >
          star
        </span>
      </div>
      <p class="font-body-sm text-text-secondary leading-relaxed pt-1">{{ text }}</p>
    </div>
  </div>
</template>
