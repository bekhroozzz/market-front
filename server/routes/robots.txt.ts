import { absoluteSiteUrl, getSiteUrl } from '../utils/sitemap'

export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')

  const site = getSiteUrl()

  return `User-agent: *
Allow: /
Disallow: /profile
Disallow: /profile/
Disallow: /cart
Disallow: /booking/
Disallow: /api/

Host: ${site.replace(/^https?:\/\//, '')}
Sitemap: ${absoluteSiteUrl('/sitemap.xml')}
`
})
