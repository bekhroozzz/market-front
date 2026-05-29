<script setup lang="ts">
import {useModal, useModalSlot} from 'vue-final-modal'
import {LazyModalTemplate, LazyAuthSignup, LazyMenuCatalog, LazyMenuModalCatalog} from '#components';
import {useLogged} from '~/composables/states';
import {breakpointsTailwind} from '@vueuse/core';

const isOpen = ref<boolean>(false)
const menuRef = ref(null)
const route = useRoute()
const router = useRouter()
const isLogged = useLogged()
const menuStore = useMenuStore()
const { menuHeader } = storeToRefs(menuStore)
const { lg } = useBreakpoints(breakpointsTailwind, { ssrWidth: 768 })
const searchValue = ref('')

const authModal = useModal({
  component: LazyModalTemplate,
  slots: {
    default: useModalSlot({
      component: LazyAuthSignup,
      attrs:{
        onClose(){
          authModal.close()
        }
      }
    })
  }
})

function closeMenu() {
  menuModal.close()
  isOpen.value = false
}

const menuModal =   useModal(
    {
      component: LazyMenuModalCatalog,
      slots: {
        default: useModalSlot({
          component: LazyMenuCatalog,
          attrs:{
            menu: menuHeader.value,
            onNavigate: closeMenu,
          },
        }),
      },
    })


onClickOutside(menuRef, () => {
  if (isOpen.value)
    closeMenu()
})

watch(() => route.path, () => {
  if (isOpen.value)
    closeMenu()
})

function toggleMenu(opened: boolean) {
  if(opened)
    menuModal.open()
  else
    menuModal.close()
}

function normalizeQuerySearch(value: unknown): string {
  if (Array.isArray(value))
    return String(value[0] || '')
  if (typeof value === 'string')
    return value
  return ''
}

watch(
  () => route?.query?.q,
  (value) => {
    searchValue.value = normalizeQuerySearch(value)
  },
  { immediate: true },
)

async function submitSearch() {
  const q = searchValue.value.trim()

  const query = {
    ...route.query,
  } as Record<string, any>

  if (q)
    query.q = q
  else
    delete query.q

  await router.push({
    path: '/',
    query,
  })
}
</script>

<template>
  <div class="navbar z-50 glass shadow-lg gap-1 sticky top-0">
    <div class="navbar-start">
      <MenuBurgerBtn  ref="menuRef" v-model="isOpen" @update:model-value="toggleMenu"/>
      <NuxtLink to="/" class="btn btn-ghost gap-0 text-md lg:text-xl">Loca
        <span class="text-primary">Fun</span>
      </NuxtLink>
    </div>
    <input
        v-model="searchValue"
        class="input input-primary w-full max-w-xs focus:outline-none focus:bg-base-200"
        :class="[
          {'input-sm': !lg},
          {'input-lg': lg},
        ]"
        placeholder="Поиск"
        type="text"
        @keyup.enter="submitSearch"
    >
    <div class="navbar-end lg:gap-4 gap-1">
<!--      <div class="dropdown dropdown-end">-->
<!--        <div tabindex="0" role="button" class="btn btn-ghost btn-circle">-->
<!--          <div class="indicator">-->
<!--            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /> </svg>-->
<!--            <span class="badge badge-sm indicator-item">8</span>-->
<!--          </div>-->
<!--        </div>-->
<!--        <div tabindex="0" class="card card-compact dropdown-content bg-base-100 z-1 mt-3 w-52 shadow-lg">-->
<!--          <div class="card-body">-->
<!--            <span class="text-lg font-bold">8 Items</span>-->
<!--            <span class="text-info">Subtotal: $999</span>-->
<!--            <NuxtLink to="/cart" class="card-actions">-->
<!--              <button class="btn btn-primary btn-block">View cart</button>-->
<!--            </NuxtLink>-->
<!--          </div>-->
<!--        </div>-->
<!--      </div>-->
      <div v-if="isLogged" class="dropdown dropdown-end">
        <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
          <div class="w-10 rounded-full">
            <img
                alt="Tailwind CSS Navbar component"
                src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" />
          </div>
        </div>
        <ul
            tabindex="0"
            class="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow-lg">
          <li>
            <a class="justify-between">
              Profile
              <span class="badge">New</span>
            </a>
          </li>
          <li><a>Settings</a></li>
          <li><a>Logout</a></li>
        </ul>
      </div>
      <Button
          v-else
          icon-name="16x16/login"
          icon-size="16"
          :size="lg ? 'lg' : 'sm'"
          @click="authModal.open"
          is-outline
          class="textarea-sm"
      >
      Войти
      </Button>
      <ThemeToggle />
    </div>
  </div>
</template>

<style scoped>

</style>