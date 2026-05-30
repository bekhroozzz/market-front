<script setup lang="ts">
import * as Yup from 'yup'
import {useForm} from 'vee-validate';
import {useSetTokens} from '~/composables/refresh-token';

const tabs = ref(
    [
      {label: 'Войти', val: 'login' },
      {label: 'Зарегистрироваться', val: 'signup'}
    ]
)

const emit = defineEmits(['close'])
const activeTab = ref(tabs.value[0])
const isLoading = ref(false)
const schema = Yup.object().shape({
  name: Yup.string().notRequired(),
  email: Yup.string().email('Введите почту в правильном формате').required('Введите вашу почту'),
  password: Yup.string().required('Введите ваш пароль').min(6, 'Пароль должен быть не менее 6 символов'),
  passwordRepeat: Yup.string().notRequired()
})


const { handleSubmit, setFieldError } = useForm({
  validationSchema: schema,
})

const onSubmit = handleSubmit(async (values) => {
  const { name, email, password, passwordRepeat } = values
  if (passwordRepeat!== password && activeTab.value.val === 'signup') {
    setFieldError('passwordRepeat', 'Пароли не совпадают')
    return
  }

  isLoading.value = true
    try {
      if (activeTab.value.val === 'login'){
        const response = await useApiPost('/api/auth/signin', {
          body: { email, password,}
        })

        useSetTokens(response)
      }

      if (activeTab.value.val === 'signup'){
        const response = await useApiPost('/api/auth/signup', {
          body: {
            email,
            password,
          }
        })
        useSetTokens(response)
      }
      emit('close')
    }catch (error) {
      setFieldError('password', error._data?.message)
      console.error(error)
    }finally {
      isLoading.value = false
    }
})
</script>

<template>
  <div class="flex flex-col w-full items-center gap-4 p-10 justify-center">
    <h2 class="text-2xl w-full font-semibold text-base-700 text-start">
      Авторизация
    </h2>
    <Tab :tabs="tabs" @update:active-tab="(val)=>activeTab = val" class="w-full"/>
    <form  @submit="onSubmit" class="transition-all w-full duration-500">
        <div v-if="activeTab.val === 'login'" class="flex flex-col w-full gap-4">
          <Input name="email" placeholder="Email"/>
          <Input name="password" placeholder="Пароль"/>
          <Button :is-loading="isLoading">
            Войти
          </Button>
        </div>
        <div  v-if="activeTab.val === 'signup'" class="flex flex-col w-full gap-4">
          <Input name="name" placeholder="Как вас зовут?"/>
          <Input name="email" placeholder="Email"/>
          <Input name="password" placeholder="Пароль"/>
          <Input name="passwordRepeat" placeholder="Повторить пароль"/>
          <Button :is-loading="isLoading">
            Зарегистрироваться
          </Button>
        </div>
    </form>
  </div>
</template>