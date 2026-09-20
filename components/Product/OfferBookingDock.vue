<script setup lang="ts">
import VueDatePicker from '@vuepic/vue-datepicker'
import type { PriceTariff, WorkScheduleDay } from '~/composables/product'
import { getClosedWeekDays } from '~/composables/booking'
import { formatDayChip, generateTimeSlots } from '~/utils/time-slots'
import { formatFromPrice, formatPrice } from '~/utils/format-price'

const props = defineProps<{
  price?: number | null
  oldPrice?: number | null
  prices?: PriceTariff[]
  workSchedule?: WorkScheduleDay[]
  chatLoading?: boolean
}>()

const emit = defineEmits<{
  book: [payload: { date: string; time: string; persons: number }]
  chat: []
}>()

const PRICE_TYPE_LABELS: Record<string, string> = {
  for_enter: 'за вход',
  by_hour: 'в час',
  by_minute: 'в минуту',
  by_day: 'в день',
  by_party: 'за партию',
}

const selectedDate = ref<Date>(new Date())
const selectedTime = ref('')
const persons = ref(2)
const showDatePicker = ref(false)

const dateChips = computed(() =>
  Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() + index)
    return { date, ...formatDayChip(date) }
  }),
)

const slots = computed(() => generateTimeSlots(props.workSchedule, selectedDate.value))
const disabledWeekDays = computed(() => getClosedWeekDays(props.workSchedule))

watch(slots, (value) => {
  if (!value.includes(selectedTime.value))
    selectedTime.value = value[0] || ''
}, { immediate: true })

const tariff = computed(() => props.prices?.[0] || null)
const unitPrice = computed(() => tariff.value?.price ?? props.price ?? 0)
const priceLabel = computed(() => PRICE_TYPE_LABELS[tariff.value?.priceType || ''] || 'за бронь')
const dateLabel = computed(() =>
  selectedDate.value.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }),
)
const monthLabel = computed(() =>
  selectedDate.value.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }),
)
const extraTariff = computed(() => props.prices?.[1] || null)

const dateQuery = computed(() => {
  const year = selectedDate.value.getFullYear()
  const month = String(selectedDate.value.getMonth() + 1).padStart(2, '0')
  const day = String(selectedDate.value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})

function pickChip(date: Date) {
  selectedDate.value = date
}

function book() {
  if (!selectedTime.value) return
  emit('book', { date: dateQuery.value, time: selectedTime.value, persons: persons.value })
}
</script>

<template>
  <div class="flex flex-col gap-space-md">
    <div class="hidden lg:block p-space-lg rounded-2xl bg-surface-page shadow-xl border border-border-default">
      <div class="flex items-baseline justify-between mb-space-sm">
        <div class="flex items-baseline gap-1">
          <span class="font-body-sm text-text-secondary">от</span>
          <span class="font-headline-lg font-headline text-text-primary tracking-tight">{{ formatPrice(unitPrice) }}</span>
          <span class="font-label-md text-text-secondary">{{ priceLabel }}</span>
        </div>
        <span v-if="oldPrice && oldPrice !== unitPrice" class="text-text-muted font-label-sm line-through">
          {{ formatFromPrice(oldPrice) }}
        </span>
      </div>
      <p v-if="extraTariff" class="font-body-sm text-text-secondary -mt-2 mb-space-sm">
        Доп. тариф:
        <span class="font-semibold text-text-primary">{{ formatPrice(extraTariff.price) }} {{ PRICE_TYPE_LABELS[extraTariff.priceType] || '' }}</span>
      </p>

      <label class="font-label-sm text-text-secondary">Дата</label>
      <button
        class="w-full flex items-center justify-between p-3 rounded-xl bg-surface-soft-pink text-text-primary font-label-md mt-1.5 mb-space-md"
        type="button"
        @click="showDatePicker = !showDatePicker"
      >
        <span class="flex items-center gap-2">
          <span class="material-symbols-outlined text-primary-pressed">calendar_today</span>
          <span class="font-bold capitalize">{{ dateLabel }}</span>
        </span>
        <span class="material-symbols-outlined text-text-secondary">expand_more</span>
      </button>
      <VueDatePicker
        v-if="showDatePicker"
        v-model="selectedDate"
        locale="ru-RU"
        :min-date="new Date()"
        :disabled-week-days="disabledWeekDays"
        :enable-time-picker="false"
        cancel-text="Закрыть"
        select-text="Выбрать"
        class="mb-space-md"
      />

      <div class="flex items-center justify-between mb-2">
        <label class="font-label-sm text-text-secondary">Слот времени</label>
        <span class="font-label-sm text-primary-pressed">Часовой пояс: Ташкент</span>
      </div>
      <div class="grid grid-cols-3 gap-2 mb-space-md">
        <button
          v-for="slot in slots"
          :key="slot"
          class="py-2.5 rounded-xl font-label-sm transition-all"
          :class="selectedTime === slot ? 'bg-primary-container text-text-primary font-bold shadow-sm' : 'bg-surface-secondary text-text-primary'"
          type="button"
          @click="selectedTime = slot"
        >
          {{ slot }}
        </button>
        <p v-if="!slots.length" class="col-span-3 font-body-sm text-text-muted">В этот день слотов нет</p>
      </div>

      <label class="font-label-sm text-text-secondary">Гости</label>
      <div class="flex items-center justify-between p-2.5 rounded-xl bg-surface-secondary mt-1.5 mb-space-md">
        <button class="w-9 h-9 rounded-lg bg-surface-page" type="button" @click="persons = Math.max(1, persons - 1)">−</button>
        <span class="font-label-md">{{ persons }} чел</span>
        <button class="w-9 h-9 rounded-lg bg-surface-page" type="button" @click="persons = Math.min(12, persons + 1)">+</button>
      </div>

      <button
        class="w-full h-12 rounded-xl bg-primary-container hover:bg-primary-hover text-text-primary font-label-lg font-bold flex items-center justify-center gap-2 mb-2"
        type="button"
        @click="book"
      >
        Забронировать слот
        <span class="material-symbols-outlined">arrow_forward</span>
      </button>
      <button
        class="w-full h-11 rounded-xl hover:bg-surface-secondary font-label-md flex items-center justify-center gap-2"
        type="button"
        :disabled="chatLoading"
        @click="emit('chat')"
      >
        <span class="material-symbols-outlined text-text-secondary">chat</span>
        Задать вопрос заведению
      </button>
      <div class="mt-space-md p-3 rounded-xl bg-surface-soft-pink flex items-start gap-2.5">
        <span class="material-symbols-outlined text-primary-pressed">verified_user</span>
        <div class="font-body-sm">
          <p class="font-bold text-text-primary">Гарантия брони LocaFun</p>
          <p class="text-text-secondary">Мгновенное подтверждение. Отмена без штрафа по правилам площадки.</p>
        </div>
      </div>
    </div>

    <div class="lg:hidden bg-surface-secondary rounded-xl p-space-md flex flex-col gap-space-md">
      <div class="flex items-center justify-between">
        <span class="font-label-lg text-text-primary">Выбор даты и времени</span>
        <span class="font-label-sm text-primary-pressed inline-flex items-center gap-0.5 capitalize">
          <span class="material-symbols-outlined text-[15px]">event</span>
          {{ monthLabel }}
        </span>
      </div>
      <div class="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          v-for="chip in dateChips"
          :key="chip.day"
          class="shrink-0 px-3.5 py-2 rounded-xl text-center"
          :class="chip.date.toDateString() === selectedDate.toDateString() ? 'bg-primary-container text-text-primary' : 'bg-surface-page text-text-secondary'"
          type="button"
          @click="pickChip(chip.date)"
        >
          <span class="block font-label-sm">{{ chip.label }}</span>
          <span class="block font-label-md font-bold">{{ chip.day }}</span>
        </button>
      </div>
      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="slot in slots"
          :key="`m-${slot}`"
          class="px-2 py-2 rounded-xl font-label-md"
          :class="selectedTime === slot ? 'bg-primary-container font-bold' : 'bg-surface-page'"
          type="button"
          @click="selectedTime = slot"
        >
          {{ slot }}
        </button>
        <p v-if="!slots.length" class="col-span-3 font-body-sm text-text-muted">В этот день слотов нет</p>
      </div>
    </div>

    <div class="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-page/95 backdrop-blur-xl shadow-[0_-4px_20px_rgba(23,23,23,0.06)] px-margin-mobile py-3 pb-safe">
      <div class="flex items-center justify-between gap-space-md">
        <div class="min-w-0">
          <div class="flex items-baseline gap-1">
            <span class="font-headline-sm font-bold">{{ formatPrice(unitPrice) }}</span>
            <span class="font-body-sm text-text-muted">{{ priceLabel }}</span>
          </div>
          <span class="font-label-sm text-text-secondary truncate">
            {{ selectedTime || 'Выберите слот' }} · {{ dateChips[0] && selectedDate.toDateString() === dateChips[0].date.toDateString() ? 'сегодня' : dateLabel }}
          </span>
        </div>
        <button
          class="shrink-0 bg-primary-container hover:bg-primary-hover text-text-primary font-label-lg px-6 py-3.5 rounded-xl flex items-center gap-1.5"
          type="button"
          @click="book"
        >
          Забронировать
          <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>
    </div>
  </div>
</template>
