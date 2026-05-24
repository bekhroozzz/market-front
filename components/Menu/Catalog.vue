<script setup lang="ts">
interface Category {
  id: string
  name: string
  children?: Category[]
}

interface Props {
  menu: Category[]
  onNavigate?: () => void
}

const props = defineProps<Props>()

function handleClick() {
  props.onNavigate?.()
}
</script>

<template>
<div class="flex lg:justify-center overflow-y-auto max-h-svh flex-wrap gap-6 pb-20 pt-4 lg:p-10">
  <div v-for="item in menu" :key="item.id" class="flex gap-2 flex-col">
    <NuxtLink
      :to="`/catalog/${item.id}`"
      class="text-xl font-semibold pl-4 hover:text-primary transition-colors cursor-pointer"
      @click="handleClick"
    >
      {{ item.name }}
    </NuxtLink>
    <NuxtLink
      v-for="child in item.children"
      :key="child.id"
      :to="`/catalog/${child.id}`"
      class="pl-6 textarea-md hover:text-primary transition-colors cursor-pointer"
      @click="handleClick"
    >
      {{ child.name }}
    </NuxtLink>
  </div>
</div>
</template>

<style scoped>

</style>