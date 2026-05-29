<script setup lang="ts">
import { getOfferReviews, createReview, type Review } from '~/composables/product'
import { useLogged } from '~/composables/states'

const props = defineProps<{ offerId: string }>()

const isLogged = useLogged()
const reviews = ref<Review[]>([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Form state
const formText = ref('')
const formRating = ref(0)
const hoverRating = ref(0)

async function loadReviews() {
  if (!props.offerId) return
  isLoading.value = true
  try {
    reviews.value = await getOfferReviews(props.offerId)
  } catch {
    // silently fail — reviews not critical for page render
  } finally {
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

    // Optimistic prepend
    reviews.value = [newReview, ...reviews.value]
    formText.value = ''
    formRating.value = 0
    successMessage.value = 'Спасибо за ваш отзыв!'
  } catch {
    errorMessage.value = 'Не удалось отправить отзыв. Попробуйте позже.'
  } finally {
    isSubmitting.value = false
  }
}

onMounted(loadReviews)
</script>

<template>
  <div class="max-w-7xl mx-auto flex flex-col gap-8 px-0 md:px-6">
    <h2 class="text-2xl font-bold md:text-3xl">
      Отзывы
      <span v-if="reviews.length" class="text-base font-normal text-base-content/50 ml-2">({{ reviews.length }})</span>
    </h2>

    <!-- Leave a review form -->
    <div class="bg-base-200 rounded-2xl p-6">
      <h3 class="font-semibold text-lg mb-4">Оставить отзыв</h3>

      <!-- Star picker -->
      <div class="flex items-center gap-1 mb-4">
        <button
          v-for="star in 5"
          :key="star"
          type="button"
          class="transition-transform hover:scale-110"
          @mouseenter="hoverRating = star"
          @mouseleave="hoverRating = 0"
          @click="formRating = star"
        >
          <Icon
            name="24x24/star"
            size="28"
            :class="star <= (hoverRating || formRating) ? 'text-yellow-400' : 'text-base-content/25'"
          />
        </button>
        <span class="ml-2 text-sm text-base-content/60">
          {{ formRating > 0 ? `${formRating} из 5` : 'Выберите оценку' }}
        </span>
      </div>

      <textarea
        v-model="formText"
        class="textarea textarea-bordered w-full mb-4 resize-none"
        rows="3"
        placeholder="Поделитесь впечатлениями об этом месте..."
        maxlength="1000"
      />

      <div v-if="errorMessage" class="alert alert-error mb-3 text-sm py-2">{{ errorMessage }}</div>
      <div v-if="successMessage" class="alert alert-success mb-3 text-sm py-2">{{ successMessage }}</div>

      <Button
        size="md"
        :disabled="!formText.trim() || formRating < 1 || isSubmitting"
        :is-loading="isSubmitting"
        @click="submitReview"
      >
        Отправить отзыв
      </Button>
    </div>

    <!-- Reviews list -->
    <div v-if="isLoading" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <template v-else-if="reviews.length">
      <div class="md:columns-2 lg:columns-3 gap-6">
        <ProductReviewItem
          v-for="review in reviews"
          :key="review.id"
          :id="review.id"
          :text="review.text"
          :rating="review.rating"
          :created-at="review.createdAt"
          class="mb-6 break-inside-avoid"
        />
      </div>
    </template>

    <div v-else class="text-center py-12 text-base-content/40">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
      </svg>
      <p class="text-lg font-medium">Пока нет отзывов</p>
      <p class="text-sm mt-1">Будьте первым, кто оставит отзыв!</p>
    </div>
  </div>
</template>
