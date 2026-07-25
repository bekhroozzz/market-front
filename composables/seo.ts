export const SITE_NAME = 'LocaFun'
export const DEFAULT_TITLE = 'LocaFun — найди лучшие места для отдыха и развлечений рядом'
export const DEFAULT_DESCRIPTION = 'Платформа LocaFun поможет найти бассейны, рестораны, компьютерные клубы, боулинги и другие развлечения рядом с вами. Открой для себя активный отдых в своём городе!'
export const DEFAULT_OG_IMAGE = '/og-default.jpg'
export const DEFAULT_LOCALE = 'ru_UZ'
export const PRICE_CURRENCY = 'UZS'

export interface AppSeoOptions {
  title?: MaybeRefOrGetter<string | undefined | null>
  description?: MaybeRefOrGetter<string | undefined | null>
  image?: MaybeRefOrGetter<string | undefined | null>
  /** Path or absolute URL. Defaults to current route path (no query). */
  canonical?: MaybeRefOrGetter<string | undefined | null>
  type?: MaybeRefOrGetter<'website' | 'article' | 'product' | 'profile'>
  robots?: MaybeRefOrGetter<string | undefined | null>
  noindex?: MaybeRefOrGetter<boolean | undefined | null>
  /** Extra JSON-LD graphs (Organization/WebSite are set globally). */
  jsonLd?: MaybeRefOrGetter<object | object[] | null | undefined>
}

function toValueLoose<T>(input: MaybeRefOrGetter<T> | undefined): T | undefined {
  if (input === undefined) return undefined
  return toValue(input)
}

export function useSiteUrl(): string {
  const config = useRuntimeConfig()
  const fromConfig = String(config.public.siteUrl || '').replace(/\/+$/, '')
  if (fromConfig) return fromConfig

  if (import.meta.client && globalThis.location?.origin)
    return globalThis.location.origin.replace(/\/+$/, '')

  return 'https://locafun.uz'
}

export function useMediaBaseUrl(): string {
  const config = useRuntimeConfig()
  const api = String(config.public.BASE_API_URL || '').replace(/\/+$/, '')
  if (!api) return useSiteUrl()
  return api.replace(/\/api\/?$/, '')
}

/** Build absolute site URL from a path. */
export function absoluteUrl(path = '/'): string {
  const site = useSiteUrl()
  if (!path || path === '/') return `${site}/`
  if (/^https?:\/\//i.test(path)) return path
  return `${site}${path.startsWith('/') ? path : `/${path}`}`
}

/** Resolve product/media/asset URLs to absolute http(s). */
export function absoluteAssetUrl(src?: string | null): string {
  if (!src) return absoluteUrl(DEFAULT_OG_IMAGE)
  if (/^https?:\/\//i.test(src)) return src
  if (src.startsWith('//')) return `https:${src}`

  // Site-public assets (/og-default.png, /1.jpg, …)
  if (
    src.startsWith('/og-')
    || src.startsWith('/favicon')
    || /^\/\d+\.(jpe?g|png|webp|gif)$/i.test(src)
    || /^\/og-default\.(jpe?g|png|webp)$/i.test(src)
  ) {
    return absoluteUrl(src)
  }

  // Uploaded media from API (often "/uploads/...")
  const mediaBase = useMediaBaseUrl()
  return `${mediaBase}${src.startsWith('/') ? src : `/${src}`}`
}

export function stripHtml(input?: string | null): string {
  if (!input) return ''
  return input
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

export function truncateMeta(input?: string | null, max = 160): string {
  const text = stripHtml(input)
  if (text.length <= max) return text
  const sliced = text.slice(0, max - 1)
  const lastSpace = sliced.lastIndexOf(' ')
  return `${(lastSpace > 80 ? sliced.slice(0, lastSpace) : sliced).trimEnd()}…`
}

export function useJsonLd(schema: MaybeRefOrGetter<object | object[] | null | undefined>) {
  useHead(() => {
    const value = toValue(schema)
    if (!value) return {}

    const graphs = Array.isArray(value) ? value : [value]
    return {
      script: graphs.map((graph, index) => ({
        key: `jsonld-${index}`,
        type: 'application/ld+json',
        children: JSON.stringify(graph),
      })),
    }
  })
}

/**
 * Full page SEO: title, description, canonical, Open Graph, Twitter, robots, JSON-LD.
 */
export function useAppSeo(options: AppSeoOptions = {}) {
  const route = useRoute()

  const resolved = computed(() => {
    const title = toValueLoose(options.title)?.trim() || DEFAULT_TITLE
    const description =
      truncateMeta(toValueLoose(options.description) || DEFAULT_DESCRIPTION) || DEFAULT_DESCRIPTION
    const image = absoluteAssetUrl(toValueLoose(options.image) || DEFAULT_OG_IMAGE)
    const canonicalInput = toValueLoose(options.canonical)
    const canonical = absoluteUrl(canonicalInput || route.path || '/')
    const type = toValueLoose(options.type) || 'website'
    const noindex = Boolean(toValueLoose(options.noindex))
    const robots = toValueLoose(options.robots) || (noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1')

    return { title, description, image, canonical, type, robots }
  })

  useSeoMeta({
    title: () => resolved.value.title,
    description: () => resolved.value.description,
    robots: () => resolved.value.robots,
    ogType: () => resolved.value.type,
    ogSiteName: SITE_NAME,
    ogTitle: () => resolved.value.title,
    ogDescription: () => resolved.value.description,
    ogUrl: () => resolved.value.canonical,
    ogImage: () => resolved.value.image,
    ogImageAlt: () => resolved.value.title,
    ogLocale: DEFAULT_LOCALE,
    twitterCard: 'summary_large_image',
    twitterTitle: () => resolved.value.title,
    twitterDescription: () => resolved.value.description,
    twitterImage: () => resolved.value.image,
  })

  useHead(() => ({
    link: [
      { rel: 'canonical', href: resolved.value.canonical },
    ],
  }))

  if (options.jsonLd !== undefined)
    useJsonLd(options.jsonLd)

  return resolved
}
