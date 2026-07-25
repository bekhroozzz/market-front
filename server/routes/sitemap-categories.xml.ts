import {
  absoluteSiteUrl,
  flattenCategoryPaths,
  getApiBaseUrl,
  renderUrlSet,
  type CategoryNode,
  type SitemapUrl,
} from '../utils/sitemap'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')

  const api = getApiBaseUrl()
  const now = new Date().toISOString()
  const urls: SitemapUrl[] = []

  if (api) {
    try {
      const categories = await $fetch<CategoryNode[]>(`${api}/api/category/get-all`)
      for (const path of flattenCategoryPaths(Array.isArray(categories) ? categories : [])) {
        urls.push({
          loc: absoluteSiteUrl(`/catalog/${path}`),
          changefreq: 'daily',
          priority: 0.8,
          lastmod: now,
        })
      }
    }
    catch {
      // Return empty set rather than failing the whole crawl budget
    }
  }

  return renderUrlSet(urls)
})
