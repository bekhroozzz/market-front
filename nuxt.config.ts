// https://nuxt.com/docs/api/configuration/nuxt-config
import process from 'node:process';
import svgLoader from 'vite-svg-loader'

export default defineNuxtConfig({
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1, user-scalable=no',
      title: 'LocaFun — найди лучшие места для отдыха и развлечений рядом',
      meta: [
        {
          name: 'description',
          content:
            'Платформа LocaFun поможет найти бассейны, рестораны, компьютерные клубы, боулинги и другие развлечения рядом с вами. Открой для себя активный отдых в своём городе!',
        },
      ],
      htmlAttrs: {
        lang: 'ru',
      },
      link: [],
      script: [],
    },
  },
  nitro: {
    compressPublicAssets: true,
  },

  router: {
    options: {
      scrollBehaviorType: 'smooth',
    },
  },
  css: ["~/assets/css/style.css", 'vue-final-modal/style.css'],
  vite: {
      plugins: [
        svgLoader({
          svgoConfig: {
            plugins: [
              {
                name: 'preset-default',
                params: {
                  overrides: {
                    convertColors: {
                      currentColor: true,
                    },
                    removeViewBox: false,
                  },
                },
              },
            ],
          },
        }),
      ],
  },

  tailwindcss: { exposeConfig: true },
  colorMode: {
    dataValue: 'theme',
    preference: 'system',
    fallback: 'light',

  },
  vue: {
    compilerOptions: {
      isCustomElement: (tag) => tag.startsWith('swiper-'),
    },
  },
  runtimeConfig: {
    // Server-only. When set, SSR requests hit the API over the internal Docker
    // network (e.g. http://market-api:4000) instead of the public domain,
    // avoiding an extra TLS + reverse-proxy round-trip on every render.
    // Falls back to the public URL when empty.
    apiInternalUrl: process.env.NUXT_API_INTERNAL_URL || '',
    public: {
      BASE_API_URL: process.env.NUXT_PUBLIC_BASE_API_URL,
    },
  },
  build: {
    transpile: ['@vuepic/vue-datepicker']
  },
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: ['@vueuse/nuxt', 'nuxt-lucide-icons', '@pinia/nuxt', 'nuxt-swiper', '@nuxtjs/tailwindcss', '@nuxtjs/color-mode']
})