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
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return ''
  }
})
</script>

<template>
  <div class="aspect-auto p-6 border border-gray-100 rounded-3xl shadow-md">
    <div class="flex gap-4">
      <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
        <img v-if="profileImage" class="w-12 h-12 rounded-full object-cover" :src="profileImage" alt="avatar" loading="lazy" />
        <span v-else>{{ (author ?? 'А').charAt(0).toUpperCase() }}</span>
      </div>
      <div class="flex flex-col w-full">
        <h6 class="text-base font-medium text-gray-700 flex justify-between dark:text-white">
          <span>{{ author ?? 'Гость' }}</span>
          <span class="text-xs text-base-content/50">{{ formattedDate }}</span>
        </h6>
        <div class="flex items-center gap-1 mt-1">
          <Icon
            v-for="i in 5"
            :key="i"
            name="24x24/star"
            size="18"
            :class="i <= rating ? 'text-yellow-400' : 'text-base-content/20'"
          />
          <span class="text-sm ml-1 text-base-content/60">{{ rating }}/5</span>
        </div>
      </div>
    </div>
    <p class="mt-4 text-sm leading-relaxed text-base-content/80">{{ text }}</p>
  </div>
</template>
