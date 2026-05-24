<script setup lang="ts">
interface BreadcrumbItem {
  label: string
  to?: string
}

interface Props {
  items?: BreadcrumbItem[]
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
})
</script>

<template>
  <div class="breadcrumbs text-sm">
    <ul>
      <li>
        <NuxtLink to="/" class="underline">Главная</NuxtLink>
      </li>
      <li v-for="(item, index) in props.items" :key="index">
        <NuxtLink v-if="item.to" :to="item.to" class="underline">{{ item.label }}</NuxtLink>
        <span v-else>{{ item.label }}</span>
      </li>
    </ul>
  </div>
</template>