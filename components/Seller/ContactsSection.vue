<script setup lang="ts">
import type { Branch } from '~/composables/seller'

defineProps<{
  phones: string[]
  branches: Branch[]
}>()
</script>

<template>
  <section class="space-y-4">
    <h2 class="text-xl font-semibold text-base-content">Контакты и адреса</h2>

    <div v-if="phones.length" class="flex flex-wrap gap-3">
      <a
        v-for="phone in phones"
        :key="phone"
        :href="`tel:${phone}`"
        class="btn btn-outline btn-sm gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
        </svg>
        {{ phone }}
      </a>
    </div>

    <div v-if="branches.length" class="grid gap-3 sm:grid-cols-2">
      <div
        v-for="(branch, idx) in branches"
        :key="idx"
        class="card card-compact bg-base-200 shadow-sm"
      >
        <div class="card-body">
          <h3 class="card-title text-base">{{ branch.title }}</h3>
          <p class="text-sm text-base-content/70">{{ branch.address }}</p>
          <a
            v-if="branch.latitude && branch.longitude"
            :href="`https://maps.google.com/?q=${branch.latitude},${branch.longitude}`"
            target="_blank"
            rel="noopener noreferrer"
            class="link link-primary text-xs mt-1"
          >
            Открыть на карте →
          </a>
        </div>
      </div>
    </div>

    <p v-if="!phones.length && !branches.length" class="text-base-content/50 text-sm">
      Контактная информация не указана
    </p>
  </section>
</template>
