<script setup lang="ts">
defineProps<{ aboutCompany: string | null }>()
</script>

<template>
  <section v-if="aboutCompany" class="space-y-3">
    <h2 class="text-xl font-semibold text-base-content">О компании</h2>
    <p class="text-base-content/70 leading-relaxed whitespace-pre-line">
      {{ aboutCompany }}
    </p>
  </section>
</template>
