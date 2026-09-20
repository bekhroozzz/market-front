<script setup lang="ts">
import { getOfferReviews, createReview, type Review } from '~/composables/product'
import { useLogged } from '~/composables/states'

const props = defineProps<{
  offerId: string
  rating?: number
  reviewCount?: number
}>()

const isLogged = useLogged()
const reviews = ref<Review[]>([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const formText = ref('')
const formRating = ref(0)
const hoverRating = ref(0)

const visibleReviews = computed(() => reviews.value.slice(0, 3))
const averageRating = computed(() => {
  if (props.rating) return props.rating
  if (!reviews.value.length) return 0
  return reviews.value.reduce((sum, review) => sum + review.rating, 0) / reviews.value.length
})
const totalCount = computed(() => props.reviewCount || reviews.value.length)

async function loadReviews() {
  if (!props.offerId || props.offerId.startsWith('fallback-')) return
  isLoading.value = true
  try {
    reviews.value = await getOfferReviews(props.offerId)
  }
  catch {
    // reviews are optional
  }
  finally {
    isLoading.value = false
  }
}

async function submitReview() {
  if (!formText.value.trim() || formRating.value < 1) return

  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const newReview = await createReview({
      text: formText.value.trim(),
      rating: formRating.value,
      offerId: props.offerId,
    })
    reviews.value = [newReview, ...reviews.value]
    formText.value = ''
    formRating.value = 0
    successMessage.value = 'Спасибо за ваш отзыв!'
  }
  catch {
    errorMessage.value = 'Не удалось отправить отзыв. Попробуйте позже.'
  }
  finally {
    isSubmitting.value = false
  }
}

onMounted(loadReviews)
</script>

<template>
  <section class="flex flex-col gap-space-lg">
    <div class="flex flex-wrap items-center justify-between gap-space-sm">
      <div class="flex items-center gap-space-sm">
        <h2 class="font-headline-md font-headline text-text-primary">Отзывы гостей</h2>
        <div v-if="totalCount" class="flex items-center gap-1 px-3 py-1 rounded-full bg-surface-soft-pink text-primary-pressed font-label-md">
          <span class="material-symbols-outlined text-base filled">star</span>
          <span>{{ averageRating.toFixed(1) }}</span>
          <span class="text-text-secondary font-normal">• {{ totalCount }} оценки</span>
        </div>
      </div>
    </div>

    <div v-if="isLogged" class="p-space-md rounded-2xl bg-surface-secondary">
      <h3 class="font-label-lg mb-space-sm">Оставить отзыв</h3>
      <div class="flex items-center gap-1 mb-space-sm">
        <button
          v-for="star in 5"
          :key="star"
          type="button"
          @mouseenter="hoverRating = star"
          @mouseleave="hoverRating = 0"
          @click="formRating = star"
        >
          <span
            class="material-symbols-outlined text-[28px]"
            :class="star <= (hoverRating || formRating) ? 'filled text-status-warning' : 'text-border-strong'"
          >
            star
          </span>
        </button>
        <span class="ml-2 font-body-sm text-text-muted">
          {{ formRating > 0 ? `${formRating} из 5` : 'Выберите оценку' }}
        </span>
      </div>
      <textarea
        v-model="formText"
        class="w-full mb-space-sm resize-none rounded-xl bg-surface-page border border-border-default p-space-md font-body-sm"
        rows="3"
        placeholder="Поделитесь впечатлениями об этом месте..."
        maxlength="1000"
      />
      <p v-if="errorMessage" class="font-body-sm text-status-error mb-2">{{ errorMessage }}</p>
      <p v-if="successMessage" class="font-body-sm text-status-success mb-2">{{ successMessage }}</p>
      <button
        class="h-11 px-space-lg rounded-xl bg-primary-container text-text-primary font-label-md disabled:opacity-50"
        type="button"
        :disabled="!formText.trim() || formRating < 1 || isSubmitting"
        @click="submitReview"
      >
        {{ isSubmitting ? 'Отправка…' : 'Отправить отзыв' }}
      </button>
    </div>

    <div v-if="isLoading" class="flex justify-center py-8">
      <span class="w-8 h-8 rounded-full border-2 border-primary-container border-t-transparent animate-spin" />
    </div>

    <div v-else-if="visibleReviews.length" class="grid grid-cols-1 md:grid-cols-3 gap-space-md">
      <ProductReviewItem
        v-for="review in visibleReviews"
        :key="review.id"
        :id="review.id"
        :text="review.text"
        :rating="review.rating"
        :created-at="review.createdAt"
      />
    </div>

    <div v-else class="p-space-lg rounded-2xl bg-surface-secondary text-center">
      <p class="font-label-lg">Пока нет отзывов</p>
      <p class="font-body-sm text-text-secondary mt-1">Будьте первым, кто оставит отзыв</p>
    </div>
  </section>
</template>
