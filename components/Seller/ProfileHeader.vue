<script setup lang="ts">
defineProps<{
  companyName: string | null
  sellerId: number
}>()
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6">
    <div
      class="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold flex-shrink-0"
    >
      {{ companyName ? companyName.charAt(0).toUpperCase() : '?' }}
    </div>

    <div class="text-center sm:text-left">
      <h1 class="text-2xl lg:text-3xl font-bold text-base-content">
        {{ companyName ?? 'Продавец' }}
      </h1>
      <p class="text-base-content/50 text-sm mt-1">ID продавца: {{ sellerId }}</p>
    </div>
  </div>
</template>
