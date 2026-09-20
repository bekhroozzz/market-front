<script setup lang="ts">
import VueDatePicker from '@vuepic/vue-datepicker'
import { HOME_CITIES } from '~/composables/home'

export interface HomeSearchPayload {
  city?: string
  category?: string
}

const props = defineProps<{
  categories: Array<{ name: string; value: string }>
  city?: string
  category?: string
}>()

const emit = defineEmits<{
  apply: [payload: HomeSearchPayload]
}>()

const selectedCity = ref(props.city || 'Ташкент')
const selectedCategory = ref(props.category || '')
const selectedDate = ref<Date | null>(new Date())
const openField = ref<'city' | 'category' | 'date' | null>(null)

watch(() => props.city, (value) => {
  if (value) selectedCity.value = value
})

watch(() => props.category, (value) => {
  selectedCategory.value = value || ''
})

const selectedCategoryName = computed(() => {
  return props.categories.find(item => item.value === selectedCategory.value)?.name
    || 'Любые развлечения'
})

const dateLabel = computed(() => {
  if (!selectedDate.value) return 'Сегодня, в любое время'
  const today = new Date()
  const isToday = selectedDate.value.toDateString() === today.toDateString()
  const time = selectedDate.value.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  return `${isToday ? 'Сегодня' : selectedDate.value.toLocaleDateString('ru-RU')} , ${time}`
})

function apply() {
  emit('apply', {
    city: selectedCity.value,
    category: selectedCategory.value || undefined,
  })
  openField.value = null
}

function pickCity(name: string) {
  selectedCity.value = name
  openField.value = null
}

function pickCategory(value: string) {
  selectedCategory.value = value
  openField.value = null
}
</script>

<template>
  <div>
    <!-- Desktop search -->
    <div class="hidden md:flex w-full bg-surface-page rounded-2xl shadow-md border border-border-default p-2 items-stretch justify-between gap-1">
      <button
        class="flex-1 flex items-center gap-space-sm px-space-md py-space-sm rounded-xl hover:bg-surface-secondary text-left transition-colors"
        type="button"
        @click="openField = openField === 'city' ? null : 'city'"
      >
        <span class="material-symbols-outlined text-text-muted text-[22px]">location_on</span>
        <div class="flex flex-col min-w-0 flex-1">
          <span class="font-label-sm text-text-muted uppercase tracking-wider">Город</span>
          <span class="font-label-md text-text-primary font-bold truncate">{{ selectedCity }}</span>
        </div>
        <span class="material-symbols-outlined text-text-muted text-[18px]">expand_more</span>
      </button>
      <div class="hidden md:block w-px h-8 bg-surface-variant self-center" />
      <button
        class="flex-1 flex items-center gap-space-sm px-space-md py-space-sm rounded-xl hover:bg-surface-secondary text-left transition-colors"
        type="button"
        @click="openField = openField === 'category' ? null : 'category'"
      >
        <span class="material-symbols-outlined text-text-muted text-[22px]">category</span>
        <div class="flex flex-col min-w-0 flex-1">
          <span class="font-label-sm text-text-muted uppercase tracking-wider">Категория</span>
          <span class="font-label-md text-text-primary font-bold truncate">{{ selectedCategoryName }}</span>
        </div>
        <span class="material-symbols-outlined text-text-muted text-[18px]">expand_more</span>
      </button>
      <div class="hidden md:block w-px h-8 bg-surface-variant self-center" />
      <button
        class="flex-1 flex items-center gap-space-sm px-space-md py-space-sm rounded-xl hover:bg-surface-secondary text-left transition-colors"
        type="button"
        @click="openField = openField === 'date' ? null : 'date'"
      >
        <span class="material-symbols-outlined text-text-muted text-[22px]">calendar_today</span>
        <div class="flex flex-col min-w-0 flex-1">
          <span class="font-label-sm text-text-muted uppercase tracking-wider">Когда</span>
          <span class="font-label-md text-text-primary font-bold truncate">{{ dateLabel }}</span>
        </div>
        <span class="material-symbols-outlined text-text-muted text-[18px]">schedule</span>
      </button>
      <button
        class="bg-primary-container text-text-primary font-label-lg px-space-xl py-space-md rounded-xl hover:bg-primary-hover active:bg-primary-pressed transition-all flex items-center justify-center gap-space-xs shadow-sm shrink-0"
        type="button"
        @click="apply"
      >
        <span class="material-symbols-outlined text-[22px]">search</span>
        <span class="font-bold">Найти</span>
      </button>
    </div>

    <!-- Mobile stacked search -->
    <div class="md:hidden bg-surface-page rounded-xl shadow-md p-space-sm space-y-2">
      <button
        class="w-full min-h-[48px] px-3.5 py-2.5 rounded-lg bg-surface-secondary flex items-center justify-between text-left"
        type="button"
        @click="openField = openField === 'city' ? null : 'city'"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-8 h-8 rounded-full bg-surface-page flex items-center justify-center text-primary-pressed shrink-0 shadow-sm">
            <span class="material-symbols-outlined text-[18px]">near_me</span>
          </div>
          <div class="truncate">
            <p class="font-label-sm text-text-muted">Где?</p>
            <p class="font-label-md text-text-primary truncate">{{ selectedCity }}</p>
          </div>
        </div>
        <span class="material-symbols-outlined text-text-secondary text-[20px]">keyboard_arrow_down</span>
      </button>
      <button
        class="w-full min-h-[48px] px-3.5 py-2.5 rounded-lg bg-surface-secondary flex items-center justify-between text-left"
        type="button"
        @click="openField = openField === 'category' ? null : 'category'"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-8 h-8 rounded-full bg-surface-page flex items-center justify-center text-primary-pressed shrink-0 shadow-sm">
            <span class="material-symbols-outlined text-[18px]">sports_esports</span>
          </div>
          <div class="truncate">
            <p class="font-label-sm text-text-muted">Что?</p>
            <p class="font-label-md text-text-primary truncate">{{ selectedCategoryName }}</p>
          </div>
        </div>
        <span class="material-symbols-outlined text-text-secondary text-[20px]">tune</span>
      </button>
      <button
        class="w-full min-h-[48px] px-3.5 py-2.5 rounded-lg bg-surface-secondary flex items-center justify-between text-left"
        type="button"
        @click="openField = openField === 'date' ? null : 'date'"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-8 h-8 rounded-full bg-surface-page flex items-center justify-center text-primary-pressed shrink-0 shadow-sm">
            <span class="material-symbols-outlined text-[18px]">calendar_month</span>
          </div>
          <div class="truncate">
            <p class="font-label-sm text-text-muted">Когда?</p>
            <p class="font-label-md text-text-primary truncate">{{ dateLabel }}</p>
          </div>
        </div>
        <span class="material-symbols-outlined text-text-secondary text-[20px]">schedule</span>
      </button>
      <button
        class="w-full h-12 rounded-xl bg-primary-container hover:bg-primary-hover active:bg-primary-pressed text-text-primary font-label-lg flex items-center justify-center gap-2 shadow-sm"
        type="button"
        @click="apply"
      >
        <span class="material-symbols-outlined text-[20px]">search</span>
        <span>Найти развлечения</span>
      </button>
    </div>

    <div v-if="openField" class="mt-2 rounded-xl border border-border-default bg-surface-page shadow-md p-2 max-h-64 overflow-y-auto">
      <template v-if="openField === 'city'">
        <button
          v-for="item in HOME_CITIES"
          :key="item.value"
          class="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-soft-pink font-label-md"
          type="button"
          @click="pickCity(item.name)"
        >
          {{ item.name }}
        </button>
      </template>
      <template v-else-if="openField === 'category'">
        <button
          class="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-soft-pink font-label-md"
          type="button"
          @click="pickCategory('')"
        >
          Любые развлечения
        </button>
        <button
          v-for="item in categories"
          :key="item.value"
          class="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-soft-pink font-label-md"
          type="button"
          @click="pickCategory(item.value)"
        >
          {{ item.name }}
        </button>
      </template>
      <div v-else class="p-2">
        <VueDatePicker
          v-model="selectedDate"
          locale="ru-RU"
          :min-date="new Date()"
          cancel-text="Закрыть"
          select-text="Выбрать"
        />
      </div>
    </div>
  </div>
</template>
