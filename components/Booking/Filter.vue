<script setup lang="ts">
import VueDatePicker from '@vuepic/vue-datepicker';
import SelectBase from '~/components/SelectBase.vue';
import {breakpointsTailwind} from '@vueuse/core';

interface FilterPayload {
  city?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  date?: string
  time?: string
}

const emit = defineEmits<{
  (e: 'apply', filters: FilterPayload): void
}>()

const date = ref<Date | null>(null);
const { lg } = useBreakpoints(breakpointsTailwind, { ssrWidth: 768 })
const menuStore = useMenuStore()
const { menuHeader } = storeToRefs(menuStore)

const minPriceInput = ref('')
const maxPriceInput = ref('')
const inStockOnly = ref(false)

const categorySelector = computed(() => {
  return menuHeader.value.flatMap((category: any) => {
    const children = Array.isArray(category?.children) ? category.children : []

    return [
      ...(category?.id && category?.name ? [{ name: category.name, value: category.id }] : []),
      ...children
        .filter((child: any) => child?.id && child?.name)
        .map((child: any) => ({ name: `${category.name} / ${child.name}`, value: child.id })),
    ]
  })
})

const selectedCity = ref<{ name: string; value: string } | null>(null);
const selectedCategory = ref<{ name: string; value: string } | null>(null);
const time = ref({ hours: new Date().getHours(), minutes: new Date().getMinutes()});

const now = new Date()
now.setHours(now.getHours() + 1)
now.setMinutes(0)
now.setSeconds(0)

const minTime = {
  hours: now.getHours(),
  minutes: now.getMinutes(),
  seconds: now.getSeconds()
}

const citiList = [
  {
    name: 'Ташкент',
    value: 'tashkent',
  },
  {
    name: 'Самарканд',
    value: 'samarkand',
  },
  {
    name: 'Джизак',
    value: 'jizzakh',
  },
  {
    name: 'Фергана',
    value: 'fergana',
  },
  {
    name: 'Андижан',
    value: 'andijan',
  }
]

function parsePrice(value: string): number | undefined {
  const price = Number(value)
  if (!value || Number.isNaN(price) || price < 0)
    return undefined

  return price
}

function handleApply() {
  const payload: FilterPayload = {
    city: selectedCity.value?.name,
    category: selectedCategory.value?.value ? String(selectedCategory.value.value) : undefined,
    minPrice: parsePrice(minPriceInput.value),
    maxPrice: parsePrice(maxPriceInput.value),
    date: date.value ? date.value.toISOString() : undefined,
    time: `${String(time.value.hours).padStart(2, '0')}:${String(time.value.minutes).padStart(2, '0')}`,
  }

  emit('apply', payload)
}
</script>

<template>
<div class="flex flex-col gap-2 w-full lg:w-1/2 shadow-base-300">
  <SelectBase v-model="selectedCity" :size="lg ? 'lg' : 'md'" :items="citiList" placeholder="Выберите город" class="!w-full lg:w-max"/>
 <div class="flex gap-2">
  <VueDatePicker
      v-model="date"
      placeholder="Выберите дату"
      locale="ru-Ru"
      cancel-text="Закрыть"
      select-text="Выбрать"
      :format="'dd.MM'"
      :preview-format="'dd.MM'"
      :enable-time-picker="false"
      input-class-name="h-12"
      :disable-year-select="true"
      :min-date="new Date()"
  />
  <VueDatePicker
      v-model="time"
      placeholder="Выберете время"
      time-picker
      locale="ru-Ru"
      :format="'HH:mm'"
      cancel-text="Закрыть"
      :min-time="minTime"
      select-text="Выбрать"
  />
 </div>
  <SelectBase v-model="selectedCategory" :size="lg ? 'lg' : 'md'" :items="categorySelector" placeholder="Выберите категорию" class="!w-full lg:w-max"/>
  <div class="flex gap-2">
    <input
      v-model="minPriceInput"
      class="input input-md border-gray-200 w-full"
      min="0"
      placeholder="Цена от"
      type="number"
  >
  <input
      v-model="maxPriceInput"
      class="input input-md border-gray-200 w-full"
      min="0"
      placeholder="Цена до"
      type="number"
  >
  </div>
  <Button class="mt-4 lg:mt-0" :size="lg ? 'lg' : 'md'" @click="handleApply">
    Применить фильтры
  </Button>
</div>
</template>

<style scoped>
.dp__main :deep(.dp__theme_light) {
  --dp-highlight-color: rgba(34, 233, 8, 0.993);
  --dp-primary-color: var(--color-primary);
  --dp-primary-text-color: var(--color-primary-content);
}

@media (max-width: 1023px) {
  :deep(.dp__input) {
    padding: 7.5px 40px !important;
  }
}
@media (min-width: 1024px) {
  :deep(.dp__input) {
    padding: 11.5px 40px !important;
  }
}
</style>