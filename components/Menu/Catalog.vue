<script setup lang="ts">
import { categoryHref, type CategoryNode } from '~/composables/catalog'

interface Props {
  menu?: CategoryNode[]
  onNavigate?: () => void
}

const props = defineProps<Props>()
const menuStore = useMenuStore()
const { menuHeader } = storeToRefs(menuStore)

/** Prefer live store data so modal always has slug/path, not a stale snapshot. */
const items = computed(() =>
  (props.menu?.length ? props.menu : menuHeader.value) ?? [],
)

function handleClick() {
  props.onNavigate?.()
}
</script>

<template>
  <div class="flex lg:justify-center overflow-y-auto max-h-svh flex-wrap gap-6 pb-20 pt-4 lg:p-10">
    <div v-for="item in items" :key="item.id" class="flex gap-2 flex-col">
      <NuxtLink
        :to="categoryHref(item)"
        class="text-xl font-semibold pl-4 hover:text-primary transition-colors cursor-pointer"
        @click="handleClick"
      >
        {{ item.name }}
      </NuxtLink>
      <NuxtLink
        v-for="child in item.children"
        :key="child.id"
        :to="categoryHref(child)"
        class="pl-6 textarea-md hover:text-primary transition-colors cursor-pointer"
        @click="handleClick"
      >
        {{ child.name }}
      </NuxtLink>
    </div>
  </div>
</template>
