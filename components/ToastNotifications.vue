<script setup lang="ts">
import { useNotificationStore } from '~/stores/notification'

const store = useNotificationStore()
const router = useRouter()

async function handleClick(n: { id: string; type: string; entityId: string | null }) {
  const markRead = store.markRead(n.id).catch(() => {})
  if (n.type === 'new_message' && n.entityId) {
    await Promise.all([
      markRead,
      router.push(`/profile/chats/${n.entityId}`),
    ])
  } else {
    await markRead
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-20 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <TransitionGroup
        enter-from-class="translate-x-full opacity-0"
        enter-active-class="transition-all duration-300 ease-out"
        leave-to-class="translate-x-full opacity-0"
        leave-active-class="transition-all duration-300 ease-in"
      >
        <div
          v-for="toast in store.toasts"
          :key="toast.id"
          class="pointer-events-auto flex items-start gap-3 bg-base-100 border border-base-200 shadow-2xl rounded-xl p-4 cursor-pointer hover:border-primary transition-colors"
          @click="handleClick(toast)"
        >
          <div class="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-sm text-base-content">{{ toast.title }}</p>
            <p class="text-xs text-base-content/60 truncate mt-0.5">{{ toast.body }}</p>
          </div>
          <button
            class="flex-shrink-0 text-base-content/30 hover:text-base-content ml-1"
            @click.stop="store.dismissToast(toast.id)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
