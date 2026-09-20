<script setup lang="ts">
import { breakpointsTailwind } from '@vueuse/core'
import { VueFinalModal } from 'vue-final-modal'

interface Props {
  hideOverlay?: boolean
  interactive?: boolean
  removeOverflow?: boolean
  modalId?: string
  transition?: 'vfm-fade' | 'vfm-slide-down' | 'vfm-slide-up' | 'vfm-slide-right' | 'vfm-slide-left'
  closeBtnStyle?: string
  containerWidth?: string
  isHeightFull?: string
  variant?: 'drawer' | 'center'
  hideClose?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  containerWidth: '440px',
  variant: 'drawer',
})
defineEmits(['update:modelValue'])

const { lg } = useBreakpoints(breakpointsTailwind, { ssrWidth: 768 })
const isCenter = computed(() => props.variant === 'center')
const contentTransition = computed(() => {
  if (props.transition) return props.transition
  if (isCenter.value) return lg.value ? 'vfm-fade' : 'vfm-slide-down'
  return lg.value ? 'vfm-slide-right' : 'vfm-slide-down'
})
</script>

<template>
  <VueFinalModal
      :modal-id="modalId"
      :content-style="{ width: lg ? containerWidth : '100%' }"
      :content-class="isCenter
        ? [
          'bg-surface-page shadow-2xl flex flex-col overflow-y-auto z-[1001]',
          lg
            ? 'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[24px] max-h-[90vh]'
            : 'fixed bottom-0 left-0 right-0 rounded-t-[28px] max-h-[92vh]',
        ]
        : [
          transition === 'vfm-slide-right' ? 'max-h-[100%] h-full' : 'max-h-[80%]',
          'fixed bottom-0 shadow-2xl bg-base-300 flex flex-col lg:right-0 lg:h-full lg:max-h-none',
        ]"
      :hide-overlay="hideOverlay"
      :swipe-to-close="isCenter || lg || transition !== 'vfm-slide-down' ? 'none' : 'down'"
      :content-transition="contentTransition"
      :background="interactive ? 'interactive' : 'non-interactive'"
      overlay-transition="vfm-fade"
      :overlay-class="isCenter
        ? 'bg-[#171717]/45 backdrop-blur-sm'
        : 'glass'"
      v-bind="$attrs"
      @update:model-value="val => $emit('update:modelValue', val)"
  >
    <span
      v-if="!isCenter && transition !== 'vfm-slide-right'"
      class="absolute left-2/4 top-1.5 h-1 w-[27px] -translate-x-2/4 rounded-xl bg-base-700 lg:hidden"
    />
    <button
        v-if="!hideClose"
        aria-label="Закрыть"
        :style="closeBtnStyle ?? ''"
        class="absolute right-2 top-2 z-10 flex size-6 glass text-white shadow-2xl items-center justify-center lg:right-2 lg:top-3 lg:size-10 lg:text-base-700"
        @click="$emit('update:modelValue', false)"
    >
      <Icon name="close" />
    </button>
    <div class="w-full" :class="{'h-full': isHeightFull}">
      <slot />
    </div>
  </VueFinalModal>
</template>
