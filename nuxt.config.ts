// https://nuxt.com/docs/api/configuration/nuxt-config
import process from 'node:process';
import svgLoader from 'vite-svg-loader'

export default defineNuxtConfig({
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      title: 'LocaFun — найди лучшие места для отдыха и развлечений рядом',
      titleTemplate: '%s',
      meta: [
        {
          name: 'description',
          content:
            'Платформа LocaFun поможет найти бассейны, рестораны, компьютерные клубы, боулинги и другие развлечения рядом с вами. Открой для себя активный отдых в своём городе!',
        },
        { name: 'theme-color', content: '#0F766E' },
        { name: 'format-detection', content: 'telephone=no' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'LocaFun' },
        { property: 'og:locale', content: 'ru_UZ' },
        { name: 'twitter:card', content: 'summary_large_image' },
        {
          name: 'googlebot',
          content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
        },
      ],
      htmlAttrs: {
        lang: 'ru',
      },
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
        { rel: 'apple-touch-icon', href: '/favicon.ico' },
      ],
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
      // Canonical / Open Graph base. Override in Dokploy if the public domain changes.
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://locafun.uz',
    },
  },
  build: {
    transpile: ['@vuepic/vue-datepicker']
  },
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: ['@vueuse/nuxt', 'nuxt-lucide-icons', '@pinia/nuxt', 'nuxt-swiper', '@nuxtjs/tailwindcss', '@nuxtjs/color-mode']
})