<script setup lang="ts">
import * as Yup from 'yup'
import { useForm, useField } from 'vee-validate'
import { useSetTokens } from '~/composables/refresh-token'

const emit = defineEmits(['close'])
const mode = ref<'login' | 'signup'>('login')
const isLoading = ref(false)
const showPassword = ref(false)
const showPasswordRepeat = ref(false)

const schema = Yup.object().shape({
  name: Yup.string().notRequired(),
  email: Yup.string().email('Введите почту в правильном формате').required('Введите вашу почту'),
  password: Yup.string().required('Введите ваш пароль').min(6, 'Пароль должен быть не менее 6 символов'),
  passwordRepeat: Yup.string().notRequired(),
})

const { handleSubmit, setFieldError } = useForm({
  validationSchema: schema,
})

const { value: email, errorMessage: emailError } = useField<string>('email', undefined, { initialValue: '' })
const { value: password, errorMessage: passwordError } = useField<string>('password', undefined, { initialValue: '' })
const { value: name, errorMessage: nameError } = useField<string>('name', undefined, { initialValue: '' })
const { value: passwordRepeat, errorMessage: passwordRepeatError } = useField<string>('passwordRepeat', undefined, { initialValue: '' })

const headline = computed(() =>
  mode.value === 'login' ? 'Войдите в аккаунт' : 'Создайте аккаунт',
)
const subtitle = computed(() =>
  mode.value === 'login'
    ? 'Бронируйте боулинг, картинги, караоке и бассейны в один клик с сохранением билетов.'
    : 'Получайте скидки, сохраняйте избранные локации и делитесь бронью с друзьями.',
)
const submitLabel = computed(() =>
  mode.value === 'login' ? 'Войти в аккаунт' : 'Создать аккаунт',
)
const fieldClass = 'flex items-center rounded-xl bg-white border border-border-default px-3.5 focus-within:border-primary-container focus-within:shadow-sm transition-all gap-2.5'
const inputClass = 'w-full bg-white py-2.5 text-text-primary font-label-md placeholder:text-text-muted focus:outline-none'

function setMode(next: 'login' | 'signup') {
  mode.value = next
}

const onSubmit = handleSubmit(async (values) => {
  const { email: emailValue, password: passwordValue, passwordRepeat: repeatValue } = values
  if (mode.value === 'signup' && repeatValue !== passwordValue) {
    setFieldError('passwordRepeat', 'Пароли не совпадают')
    return
  }

  isLoading.value = true
  try {
    if (mode.value === 'login') {
      const response = await useApiPost('/api/auth/signin', {
        body: { email: emailValue, password: passwordValue },
      })
      useSetTokens(response)
    }

    if (mode.value === 'signup') {
      const response = await useApiPost('/api/auth/signup', {
        body: {
          email: emailValue,
          password: passwordValue,
        },
      })
      useSetTokens(response)
    }
    emit('close')
  }
  catch (error: any) {
    setFieldError('password', error?._data?.message || 'Не удалось выполнить запрос')
    console.error(error)
  }
  finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="relative w-full bg-surface-page text-text-primary font-body">
    <div class="md:hidden w-full flex flex-col items-center pt-3 relative">
      <div class="w-12 h-1.5 bg-surface-container-highest rounded-full" />
      <button
        aria-label="Закрыть"
        class="absolute right-4 top-0 w-8 h-8 rounded-full bg-surface-secondary flex items-center justify-center"
        type="button"
        @click="emit('close')"
      >
        <span class="material-symbols-outlined text-[20px]">close</span>
      </button>
    </div>

    <button
      aria-label="Закрыть окно"
      class="hidden md:flex absolute top-6 right-6 w-9 h-9 rounded-full bg-surface-secondary text-text-primary hover:bg-surface-container items-center justify-center"
      type="button"
      @click="emit('close')"
    >
      <span class="material-symbols-outlined text-lg">close</span>
    </button>

    <div class="px-5 pt-4 pb-6 md:p-9 flex flex-col">
      <div class="hidden md:flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center font-headline text-headline-sm shadow-sm">
          🎉
        </div>
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-soft-pink text-primary-pressed font-label-sm">
          <span class="w-2 h-2 rounded-full bg-primary-pressed" />
          <span>Добро пожаловать в LocaFun</span>
        </div>
      </div>

      <div class="md:hidden flex items-center gap-3 mb-3">
        <div class="w-11 h-11 rounded-2xl bg-primary-container flex items-center justify-center">
          <span class="material-symbols-outlined text-[22px] filled">local_activity</span>
        </div>
        <div>
          <h2 class="font-headline-lg-mobile font-headline text-text-primary tracking-tight">
            {{ mode === 'login' ? 'Вход в LocaFun' : 'Регистрация' }}
          </h2>
          <p class="font-body-sm text-text-secondary">
            {{ mode === 'login' ? 'Бронируйте лучшие места Ташкента за 60 секунд' : 'Создайте профиль и сохраняйте любимые места' }}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-2 p-1 bg-surface-secondary rounded-xl gap-1">
        <button
          class="py-2.5 px-4 rounded-lg font-label-md transition-all"
          :class="mode === 'login'
            ? 'text-text-primary font-bold bg-surface-soft-pink shadow-sm'
            : 'text-text-secondary hover:text-text-primary'"
          type="button"
          @click="setMode('login')"
        >
          Вход
        </button>
        <button
          class="py-2.5 px-4 rounded-lg font-label-md transition-all"
          :class="mode === 'signup'
            ? 'text-text-primary font-bold bg-surface-soft-pink shadow-sm'
            : 'text-text-secondary hover:text-text-primary'"
          type="button"
          @click="setMode('signup')"
        >
          Регистрация
        </button>
      </div>

      <div class="hidden md:flex flex-col gap-1.5 mt-6">
        <h2 class="font-headline-md font-headline text-text-primary tracking-tight">
          {{ headline }}
        </h2>
        <p class="font-body-sm text-text-secondary leading-relaxed">
          {{ subtitle }}
        </p>
      </div>

      <form class="mt-5 md:mt-6 flex flex-col gap-4" @submit="onSubmit">
        <div v-if="mode === 'signup'" class="flex flex-col gap-1.5">
          <label class="font-label-sm text-text-primary" for="auth-name">Как вас зовут?</label>
          <div :class="fieldClass">
            <span class="material-symbols-outlined text-text-muted text-xl">person</span>
            <input
              id="auth-name"
              v-model="name"
              :class="inputClass"
              placeholder="Имя"
              type="text"
              autocomplete="name"
            >
          </div>
          <p v-if="nameError" class="text-status-error font-body-sm">{{ nameError }}</p>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="font-label-sm text-text-primary" for="auth-email">Электронная почта</label>
          <div :class="fieldClass">
            <span class="material-symbols-outlined text-text-muted text-xl">alternate_email</span>
            <input
              id="auth-email"
              v-model="email"
              :class="inputClass"
              placeholder="example@mail.com"
              type="email"
              autocomplete="email"
            >
          </div>
          <p v-if="emailError" class="text-status-error font-body-sm">{{ emailError }}</p>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="font-label-sm text-text-primary" for="auth-password">Пароль</label>
          <div :class="fieldClass">
            <span class="material-symbols-outlined text-text-muted text-xl">lock</span>
            <input
              id="auth-password"
              v-model="password"
              :class="inputClass"
              placeholder="••••••••"
              :type="showPassword ? 'text' : 'password'"
              :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
            >
            <button
              class="text-text-muted hover:text-text-primary flex items-center justify-center"
              type="button"
              :aria-label="showPassword ? 'Скрыть пароль' : 'Показать пароль'"
              @click="showPassword = !showPassword"
            >
              <span class="material-symbols-outlined text-xl">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
            </button>
          </div>
          <p v-if="passwordError" class="text-status-error font-body-sm">{{ passwordError }}</p>
        </div>

        <div v-if="mode === 'signup'" class="flex flex-col gap-1.5">
          <label class="font-label-sm text-text-primary" for="auth-password-repeat">Повторите пароль</label>
          <div :class="fieldClass">
            <span class="material-symbols-outlined text-text-muted text-xl">lock</span>
            <input
              id="auth-password-repeat"
              v-model="passwordRepeat"
              :class="inputClass"
              placeholder="••••••••"
              :type="showPasswordRepeat ? 'text' : 'password'"
              autocomplete="new-password"
            >
            <button
              class="text-text-muted hover:text-text-primary flex items-center justify-center"
              type="button"
              :aria-label="showPasswordRepeat ? 'Скрыть пароль' : 'Показать пароль'"
              @click="showPasswordRepeat = !showPasswordRepeat"
            >
              <span class="material-symbols-outlined text-xl">{{ showPasswordRepeat ? 'visibility_off' : 'visibility' }}</span>
            </button>
          </div>
          <p v-if="passwordRepeatError" class="text-status-error font-body-sm">{{ passwordRepeatError }}</p>
        </div>

        <button
          class="w-full h-12 rounded-[14px] bg-primary-container hover:bg-primary-hover active:bg-primary-pressed text-text-primary font-label-lg flex items-center justify-center gap-2 transition-colors shadow-sm mt-1 disabled:opacity-60"
          type="submit"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="material-symbols-outlined animate-spin text-xl">progress_activity</span>
          <template v-else>
            <span>{{ submitLabel }}</span>
            <span class="material-symbols-outlined text-xl">{{ mode === 'login' ? 'login' : 'how_to_reg' }}</span>
          </template>
        </button>
      </form>

      <div class="mt-5 text-center">
        <button
          class="font-label-md text-text-primary py-1"
          type="button"
          @click="setMode(mode === 'login' ? 'signup' : 'login')"
        >
          <template v-if="mode === 'login'">
            Ещё нет аккаунта?
            <span class="text-primary-pressed font-bold underline decoration-primary-pressed/40">Зарегистрироваться</span>
          </template>
          <template v-else>
            Уже есть аккаунт?
            <span class="text-primary-pressed font-bold underline decoration-primary-pressed/40">Войти</span>
          </template>
        </button>
      </div>

      <div class="mt-4 flex flex-col items-center text-center gap-3">
        <p class="font-body-sm text-xs text-text-muted leading-relaxed max-w-sm">
          Нажимая кнопку, вы соглашаетесь с правилами сервиса LocaFun.
        </p>
        <div class="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-secondary text-text-secondary text-xs font-label-md">
          <span class="material-symbols-outlined text-sm text-status-success">verified_user</span>
          <span>Защищённое соединение SSL</span>
        </div>
      </div>
    </div>
  </div>
</template>
