import type { CategoryNode } from '~/composables/catalog'

export const useMenuStore = defineStore('menu-store', () => {
  const menuHeader = ref<CategoryNode[]>([])

  return { menuHeader }
})
