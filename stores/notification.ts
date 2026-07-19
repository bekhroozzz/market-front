export interface FrontNotification {
  id: string
  type: string
  title: string
  body: string
  entityId: string | null
  isRead: boolean
  createdAt: string
}

export const useNotificationStore = defineStore('notifications', () => {
  const items = ref<FrontNotification[]>([])
  const toasts = ref<FrontNotification[]>([])
  const total = ref(0)
  const hydrated = ref(false)
  let hydration: Promise<void> | null = null
  let generation = 0

  const unreadCount = computed(() => items.value.filter((n) => !n.isRead).length)
  const chatUnreadCount = computed(
    () => items.value.filter((n) => n.type === 'new_message' && !n.isRead).length,
  )

  function merge(n: FrontNotification) {
    const existing = items.value.find((item) => item.id === n.id)
    if (existing) {
      Object.assign(existing, n, { isRead: existing.isRead || n.isRead })
      return existing
    }

    items.value.unshift(n)
    items.value.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    if (items.value.length > 50) items.value = items.value.slice(0, 50)
    total.value = Math.max(total.value + 1, items.value.length)
    return n
  }

  function push(n: FrontNotification, showToast = true) {
    const wasKnown = items.value.some((item) => item.id === n.id)
    const merged = merge(n)
    if (wasKnown || !showToast || merged.isRead) return

    toasts.value.push(merged)
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== n.id)
    }, 5000)
  }

  async function hydrate(force = false) {
    if (hydration) return hydration
    if (hydrated.value && !force) return

    const hydrationGeneration = generation
    const task = (async () => {
      try {
        const response = await useApiGet<{ data: FrontNotification[]; total: number }>(
          '/api/notifications',
        )
        if (hydrationGeneration !== generation) return
        for (const notification of response.data) merge(notification)
        total.value = Math.max(response.total, items.value.length)
        hydrated.value = true
      } finally {
        if (hydrationGeneration === generation) hydration = null
      }
    })()
    hydration = task

    return hydration
  }

  function dismissToast(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function markReadLocal(id: string) {
    const item = items.value.find((n) => n.id === id)
    if (item) item.isRead = true
    dismissToast(id)
  }

  async function markRead(id: string, persist = true) {
    markReadLocal(id)
    if (persist) await useApiPost(`/api/notifications/${id}/read`)
  }

  function markChatReadLocal(chatId: string) {
    for (const item of items.value) {
      if (item.type === 'new_message' && item.entityId === chatId) item.isRead = true
    }
    toasts.value = toasts.value.filter(
      (item) => item.type !== 'new_message' || item.entityId !== chatId,
    )
  }

  function clear() {
    generation += 1
    items.value = []
    toasts.value = []
    total.value = 0
    hydrated.value = false
    hydration = null
  }

  return {
    items,
    toasts,
    total,
    hydrated,
    unreadCount,
    chatUnreadCount,
    push,
    hydrate,
    dismissToast,
    markRead,
    markReadLocal,
    markChatReadLocal,
    clear,
  }
})
