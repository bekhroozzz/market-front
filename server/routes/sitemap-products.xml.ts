import {
  absoluteSiteUrl,
  getApiBaseUrl,
  renderUrlSet,
  type SitemapUrl,
} from '../utils/sitemap'

interface OfferListItem {
  id: string
  slug?: string | null
  updatedAt?: string
  createdAt?: string
}

interface OfferListResponse {
  items: OfferListItem[]
  pages: number
  page: number
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=1800, s-maxage=1800')

  const api = getApiBaseUrl()
  const urls: SitemapUrl[] = []

  if (!api)
    return renderUrlSet(urls)

  try {
    const limit = 100
    let page = 1
    let pages = 1

    while (page <= pages && page <= 100) {
      const data = await $fetch<OfferListResponse>(`${api}/api/offer/all`, {
        query: { page, limit },
      })

      pages = Math.max(1, Number(data?.pages) || 1)

      for (const item of data?.items || []) {
        const slugOrId = item.slug || item.id
        if (!slugOrId) continue
        urls.push({
          loc: absoluteSiteUrl(`/product/${slugOrId}`),
          changefreq: 'weekly',
          priority: 0.7,
          lastmod: item.updatedAt || item.createdAt || undefined,
        })
      }

      page++
    }
  }
  catch {
    // Empty sitemap is better than 500 for crawlers
  }

  return renderUrlSet(urls)
})
