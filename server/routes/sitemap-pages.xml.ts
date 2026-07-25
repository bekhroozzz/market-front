import { absoluteSiteUrl, renderUrlSet, type SitemapUrl } from '../utils/sitemap'

export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')

  const now = new Date().toISOString()
  const urls: SitemapUrl[] = [
    { loc: absoluteSiteUrl('/'), changefreq: 'daily', priority: 1, lastmod: now },
    { loc: absoluteSiteUrl('/about'), changefreq: 'monthly', priority: 0.5, lastmod: now },
    { loc: absoluteSiteUrl('/contact'), changefreq: 'monthly', priority: 0.5, lastmod: now },
    { loc: absoluteSiteUrl('/jobs'), changefreq: 'monthly', priority: 0.4, lastmod: now },
  ]

  return renderUrlSet(urls)
})
