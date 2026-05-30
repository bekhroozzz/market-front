<script setup lang="ts">
import type { WorkScheduleDay, PriceTariff } from '~/composables/product'
import { useChat } from '~/composables/chat'
import { useLogged } from '~/composables/states'

const DAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']

interface Props {
  name: string
  description: string
  reviewCount: number
  price: number
  oldPrice: number
  rating: number
  offerId?: string | null
  sellerId?: number | null
  sellerCompanyName?: string | null
  branchAddress?: string
  workSchedule?: WorkScheduleDay[]
  features?: string[]
  rules?: string[]
  prices?: PriceTariff[]
}

const props = withDefaults(defineProps<Props>(), {
  workSchedule: () => [],
  features: () => [],
  rules: () => [],
  prices: () => [],
})

const route = useRoute()
const { lg } = useBreakpoints({ lg: '1024px' }, { ssrWidth: 768 })

const logged = useLogged()
const { openChat } = useChat()
const chatLoading = ref(false)

async function handleWriteSeller() {
  if (!logged.value) {
    // Trigger auth modal or redirect
    await navigateTo('/?auth=1')
    return
  }
  if (!props.offerId) return
  chatLoading.value = true
  try {
    const chat = await openChat(props.offerId)
    await navigateTo(`/profile/chats/${chat.id}`)
  } catch (e) {
    console.error('Ошибка при открытии чата', e)
  } finally {
    chatLoading.value = false
  }
}

const sellerLink = computed(() =>
  props.sellerId ? `/seller/${props.sellerId}` : null,
)

const displayName = computed(() =>
  props.sellerCompanyName?.trim() || (props.sellerId ? `Продавец #${props.sellerId}` : null),
)

const sortedSchedule = computed(() =>
  [...(props.workSchedule ?? [])].sort((a, b) => a.day - b.day),
)

const primaryPrice = computed(() => {
  if (props.prices?.length) return props.prices[0]
  return null
})

const PRICE_TYPE_LABELS: Record<string, string> = {
  for_enter: 'за вход',
  by_hour: 'в час',
  by_minute: 'в минуту',
  by_day: 'в день',
  by_party: 'за партию',
}
</script>

<template>
  <div class="w-full lg:w-1/3">
    <h1 class="text-3xl font-bold mb-2">{{ name }}</h1>

    <p class="mb-4 flex flex-wrap gap-2 items-center justify-between">
      <span v-if="branchAddress" class="text-sm text-base-content/60">📍 {{ branchAddress }}</span>
    </p>

    <!-- Pricing -->
    <div class="mb-4">
      <template v-if="prices?.length">
        <div class="flex flex-wrap gap-2">
          <span
            v-for="tariff in prices"
            :key="tariff.priceType"
            class="badge badge-lg badge-outline font-semibold"
          >
            {{ tariff.price.toLocaleString('ru-RU') }} ₽ {{ PRICE_TYPE_LABELS[tariff.priceType] ?? tariff.priceType }}
          </span>
        </div>
      </template>
      <template v-else-if="price">
        <span class="text-2xl font-bold mr-2">{{ price.toLocaleString('ru-RU') }} ₽</span>
        <span v-if="oldPrice && oldPrice !== price" class="line-through text-base-content/50">
          {{ oldPrice.toLocaleString('ru-RU') }} ₽
        </span>
      </template>
    </div>

    <!-- Rating -->
    <div class="flex items-center mb-8">
      <span class="mr-2">Рейтинг:</span>
      <Icon v-for="i in 5" :key="i" name="24x24/star" :size="lg ? '24' : '16'"
        :class="i <= Math.round(rating) ? 'text-yellow-400' : 'text-base-content/20'"
      />
      <span class="ml-2">{{ rating > 0 ? rating.toFixed(1) : '—' }} ({{ reviewCount }} отзывов)</span>
    </div>

    <p class="mb-8">{{ description }}</p>

    <!-- Seller link -->
    <NuxtLink
      v-if="sellerLink && displayName"
      :to="sellerLink"
      class="flex items-center gap-4 w-full lg:w-max px-6 py-4 mb-8 border border-gray-200 rounded-xl hover:border-primary hover:bg-base-200 transition-colors"
    >
      <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
        {{ displayName.charAt(0).toUpperCase() }}
      </div>
      <div class="flex flex-col gap-0.5">
        <span class="text-sm text-base-content/50 uppercase tracking-wide">Продавец</span>
        <span class="font-semibold text-base-content">{{ displayName }}</span>
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" class="ml-auto w-5 h-5 text-base-content/30 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
      </svg>
    </NuxtLink>

    <!-- Actions -->
    <div class="flex flex-col w-full gap-4 mb-8">
      <Button icon-size="16" icon-name="16x16/calendar-add" size="lg" class="w-full" :to="`/booking/${route.params.slug}`">
        Забронировать
      </Button>
      <Button
        is-outline
        icon-name="24x24/support-agent"
        size="lg"
        class="w-full"
        icon-size="16"
        :disabled="chatLoading || !offerId"
        @click="handleWriteSeller"
      >
        <span v-if="chatLoading" class="loading loading-spinner loading-xs mr-1" />
        Написать заведению
      </Button>
    </div>

    <!-- Features -->
    <div v-if="features?.length" class="my-6">
      <h3 class="text-lg font-semibold mb-3">Ключевые особенности:</h3>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="feature in features"
          :key="feature"
          class="badge badge-outline badge-md gap-1"
        >
          ✓ {{ feature }}
        </span>
      </div>
    </div>

    <!-- Accordions -->
    <div class="flex flex-col gap-2">
      <!-- Work schedule -->
      <div class="collapse collapse-arrow bg-base-100 border border-base-300">
        <input type="radio" name="offer-accordion" checked />
        <div class="collapse-title font-semibold">График работы</div>
        <div class="collapse-content text-sm">
          <template v-if="sortedSchedule.length">
            <div
              v-for="day in sortedSchedule"
              :key="day.day"
              class="flex justify-between border-b pb-1 last:border-0"
            >
              <span class="font-medium">{{ DAY_NAMES[day.day] }}</span>
              <span v-if="day.isClosed" class="text-base-content/40 italic">Выходной</span>
              <span v-else>{{ day.openTime }} – {{ day.closeTime }}</span>
            </div>
          </template>
          <p v-else class="text-base-content/40 italic">Информация не указана</p>
        </div>
      </div>

      <!-- Rules -->
      <div v-if="rules?.length" class="collapse collapse-arrow bg-base-100 border border-base-300">
        <input type="radio" name="offer-accordion" />
        <div class="collapse-title font-semibold">Правила и ограничения</div>
        <div class="collapse-content text-sm">
          <ul class="space-y-1 list-disc list-inside">
            <li v-for="rule in rules" :key="rule">{{ rule }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
