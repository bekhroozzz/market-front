import { absoluteSiteUrl, renderSitemapIndex } from '../utils/sitemap'

export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')

  return renderSitemapIndex([
    absoluteSiteUrl('/sitemap-pages.xml'),
    absoluteSiteUrl('/sitemap-categories.xml'),
    absoluteSiteUrl('/sitemap-products.xml'),
  ])
})
