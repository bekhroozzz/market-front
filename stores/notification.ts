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

  const unreadCount = computed(() => items.value.filter((n) => !n.isRead).length)

  function push(n: FrontNotification) {
    if (items.value.find((x) => x.id === n.id)) return
    items.value.unshift(n)
    if (items.value.length > 50) items.value = items.value.slice(0, 50)

    // Show as toast
    toasts.value.push(n)
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== n.id)
    }, 5000)
  }

  function dismissToast(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function markRead(id: string) {
    const item = items.value.find((n) => n.id === id)
    if (item) item.isRead = true
  }

  return { items, toasts, unreadCount, push, dismissToast, markRead }
})
